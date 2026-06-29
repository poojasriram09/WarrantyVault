import Tesseract from "tesseract.js";
import * as pdfjsLib from "pdfjs-dist";
import { checkRateLimit } from "../utils/rateLimiter";

// Point pdf.js worker at the bundled worker file
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

const EXTRACT_PROMPT = `You are an invoice data extractor. The image may be a printed invoice, digital receipt, OR a handwritten invoice/bill. Carefully read all text including handwritten text. Extract the following fields and return ONLY a valid JSON object with no extra text:
{
  "productName": "full product name or null",
  "brand": "brand name or null",
  "modelNumber": "model number or null",
  "serialNumber": "serial number or IMEI or null",
  "purchaseDate": "date in YYYY-MM-DD format or null",
  "price": number or null,
  "retailer": "store/seller name or null",
  "warrantyMonths": number (warranty period in months) or null
}
If the invoice is handwritten, do your best to interpret the handwriting accurately. For dates, convert any format to YYYY-MM-DD. For prices, extract the numeric value only.`;

export const ocrService = {
  async extractFromImage(imageFile) {
    if (imageFile.type === "application/pdf") {
      // For PDFs: extract text layer directly (perfect for digital invoices)
      const text = await this._extractTextFromPdf(imageFile);
      return this.parseWarrantyFields(text);
    } else {
      // For images: use OpenRouter vision model
      try {
        return await this._extractWithVision(imageFile);
      } catch {
        // Fallback to Tesseract if vision API fails
        const result = await Tesseract.recognize(imageFile, "eng");
        return this.parseWarrantyFields(result.data.text);
      }
    }
  },

  // Use Groq vision model to extract structured fields from image
  async _extractWithVision(imageFile) {
    if (!checkRateLimit("groq_vision", 10, 60_000)) {
      throw new Error("Rate limit exceeded — please wait before scanning another document.");
    }
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(imageFile);
    });

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: EXTRACT_PROMPT },
              { type: "image_url", image_url: { url: `data:${imageFile.type};base64,${base64}` } },
            ],
          },
        ],
        max_tokens: 500,
      }),
    });

    if (!res.ok) throw new Error("Vision API failed");

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in vision response");
    const parsed = JSON.parse(jsonMatch[0]);

    return {
      rawText: content,
      productName: parsed.productName || null,
      brand: parsed.brand || null,
      modelNumber: parsed.modelNumber || null,
      serialNumber: parsed.serialNumber || null,
      purchaseDate: parsed.purchaseDate || null,
      price: parsed.price || null,
      retailer: parsed.retailer || null,
      warrantyMonths: parsed.warrantyMonths || null,
      confidence: parsed.purchaseDate && parsed.price ? "high" : "low",
    };
  },

  // Extract text layer from PDF (works perfectly for digital/e-invoices)
  async _extractTextFromPdf(pdfFile) {
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const allText = [];

    for (let pageNum = 1; pageNum <= Math.min(pdf.numPages, 4); pageNum++) {
      const page = await pdf.getPage(pageNum);

      // Try native text layer first (digital PDFs)
      try {
        const content = await page.getTextContent();
        const pageText = content.items.map((item) => item.str).join(" ");
        if (pageText.trim().length > 50) {
          allText.push(pageText);
          continue;
        }
      } catch { /* fall through to canvas OCR */ }

      // Fallback: render to canvas + vision model (scanned/handwritten PDFs)
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      const file = new File([blob], "page.png", { type: "image/png" });
      try {
        const visionResult = await this._extractWithVision(file);
        return visionResult; // Vision returns structured data directly
      } catch {
        const { data: { text } } = await Tesseract.recognize(blob, "eng");
        allText.push(text);
      }
    }

    return allText.join("\n");
  },

  parseWarrantyFields(rawText) {
    const lines = rawText.split("\n").map((l) => l.trim()).filter(Boolean);
    const full = rawText;

    // --- Patterns ---
    const datePattern = /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/;
    const isoDatePattern = /(\d{4}[\/\-]\d{2}[\/\-]\d{2})/;
    const pricePattern = /(?:₹|Rs\.?|INR)\s*([\d,]+(?:\.\d{1,2})?)/i;
    const modelPattern = /(?:model\s*(?:no\.?|number|name)?|part\s*no\.?|item\s*code)\s*[:\-]?\s*([A-Z0-9][\w\-\/]{2,})/i;
    const serialPattern = /(?:serial\s*(?:no\.?|number)?|s\/n|imei|barcode)\s*[:\-]?\s*([A-Z0-9][\w\-]{4,})/i;
    const warrantyPattern = /(\d+)\s*(?:year|yr|month|mo)s?\s*warranty/i;
    const retailerPattern = /(?:sold\s*by|seller|retailer|store|shop|merchant)\s*[:\-]?\s*(.+)/i;
    const productNamePattern = /(?:product\s*(?:name|description)?|item\s*(?:name|description)?|description)\s*[:\-]?\s*(.+)/i;
    const knownBrands = [
      "Samsung", "Apple", "LG", "Sony", "Bosch", "Whirlpool",
      "HP", "Dell", "Lenovo", "OnePlus", "Xiaomi", "Realme",
      "Asus", "Acer", "Panasonic", "Philips", "Bajaj", "Havells",
      "Toshiba", "Sharp", "Haier", "Godrej", "Voltas", "Daikin",
      "Hitachi", "Carrier", "Videocon", "Micromax", "Vivo", "Oppo",
      "Motorola", "Nokia", "JBL", "Bose", "Logitech", "Canon", "Nikon",
    ];

    let purchaseDate = null;
    let price = null;
    let brand = null;
    let modelNumber = null;
    let serialNumber = null;
    let warrantyMonths = null;
    let retailer = null;
    let productName = null;

    for (const line of lines) {
      // Date — prefer ISO format, fall back to dd/mm/yy
      if (!purchaseDate) {
        const iso = line.match(isoDatePattern);
        if (iso) purchaseDate = iso[1];
        else {
          const m = line.match(datePattern);
          if (m) purchaseDate = m[1];
        }
      }
      // Price
      if (!price) {
        const m = line.match(pricePattern);
        if (m) price = parseFloat(m[1].replace(/,/g, ""));
      }
      // Brand
      if (!brand) {
        for (const b of knownBrands) {
          if (line.toLowerCase().includes(b.toLowerCase())) {
            brand = b;
            break;
          }
        }
      }
      // Model number
      if (!modelNumber) {
        const m = line.match(modelPattern);
        if (m) modelNumber = m[1].trim();
      }
      // Serial number
      if (!serialNumber) {
        const m = line.match(serialPattern);
        if (m) serialNumber = m[1].trim();
      }
      // Warranty duration
      if (!warrantyMonths) {
        const m = line.match(warrantyPattern);
        if (m) {
          const n = parseInt(m[1]);
          const unit = m[0].toLowerCase();
          warrantyMonths = unit.includes("year") || unit.includes("yr") ? n * 12 : n;
        }
      }
      // Retailer
      if (!retailer) {
        const m = line.match(retailerPattern);
        if (m) retailer = m[1].trim().slice(0, 60);
      }
      // Product name
      if (!productName) {
        const m = line.match(productNamePattern);
        if (m) productName = m[1].trim().slice(0, 80);
      }
    }

    // Fallback: if brand found but no product name, try to find a line with the brand + model
    if (!productName && brand) {
      for (const line of lines) {
        if (line.toLowerCase().includes(brand.toLowerCase()) && line.length > brand.length + 3 && line.length < 80) {
          productName = line.trim();
          break;
        }
      }
    }

    return {
      rawText,
      purchaseDate,
      price,
      brand,
      modelNumber,
      serialNumber,
      warrantyMonths,
      retailer,
      productName,
      confidence: purchaseDate && price ? "high" : "low",
    };
  },
};
