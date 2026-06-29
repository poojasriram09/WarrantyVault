import { useState } from "react";
import { ocrService } from "../services/ocr.service";

export function useOCR() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function processImage(file) {
    setIsProcessing(true);
    setError(null);
    try {
      const extracted = await ocrService.extractFromImage(file);
      setResult(extracted);
      return extracted;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }

  return { processImage, isProcessing, result, error };
}
