const MAX_PRODUCT_NAME = 255;
const MAX_BRAND = 100;
const MAX_RETAILER = 255;
const MAX_SERIAL = 100;
const MAX_MODEL = 100;
const MAX_PRICE = 10_000_000;
const MIN_DATE = "1900-01-01";
const MAX_DATE = "2100-12-31";

export function validateProductForm({ productName, brand, modelNumber, serialNumber, purchaseDate, price, retailer, warrantyMonths }) {
  const errors = {};

  if (!productName?.trim()) {
    errors.productName = "Product name is required.";
  } else if (productName.trim().length > MAX_PRODUCT_NAME) {
    errors.productName = `Product name must be under ${MAX_PRODUCT_NAME} characters.`;
  }

  if (brand && brand.length > MAX_BRAND) {
    errors.brand = `Brand must be under ${MAX_BRAND} characters.`;
  }

  if (modelNumber && modelNumber.length > MAX_MODEL) {
    errors.modelNumber = `Model number must be under ${MAX_MODEL} characters.`;
  }

  if (serialNumber && serialNumber.length > MAX_SERIAL) {
    errors.serialNumber = `Serial number must be under ${MAX_SERIAL} characters.`;
  }

  if (!purchaseDate) {
    errors.purchaseDate = "Purchase date is required.";
  } else if (purchaseDate < MIN_DATE || purchaseDate > MAX_DATE) {
    errors.purchaseDate = "Purchase date is out of valid range.";
  }

  if (price !== undefined && price !== null && price !== "") {
    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice < 0) {
      errors.price = "Price must be a positive number.";
    } else if (numPrice > MAX_PRICE) {
      errors.price = `Price must be under ${MAX_PRICE.toLocaleString()}.`;
    }
  }

  if (retailer && retailer.length > MAX_RETAILER) {
    errors.retailer = `Retailer must be under ${MAX_RETAILER} characters.`;
  }

  if (!warrantyMonths) {
    errors.warrantyMonths = "Select a warranty duration.";
  }

  return errors;
}

/**
 * Sanitize a string for safe display — strips HTML tags.
 */
export function sanitize(str) {
  if (!str) return str;
  return String(str).replace(/<[^>]*>/g, "");
}
