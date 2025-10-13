// Minimal QR code PNG buffer generator for Node.js using qrcode package
import QRCode from 'qrcode';

// Generic QR from arbitrary text (URL, etc.)
export async function generateInvoiceQrPng(text) {
  return await QRCode.toBuffer(text, { type: 'png', errorCorrectionLevel: 'M', width: 180 });
}

// --- ZATCA (Fatoora) Phase 1 simplified invoice QR ---
// TLV fields (1..5):
// 1: Seller Name (UTF-8)
// 2: VAT Number
// 3: Timestamp (ISO8601)
// 4: Invoice Total (with VAT)
// 5: VAT Total
function tlv(tag, value) {
  const v = Buffer.from(String(value ?? ''), 'utf8');
  if (v.length > 255) throw new Error('TLV value too long for single-byte length');
  return Buffer.concat([Buffer.from([tag]), Buffer.from([v.length]), v]);
}

export function buildZatcaTlvBuffer({ sellerName, vatNumber, timestamp, total, vatTotal }) {
  if (!sellerName || !vatNumber || !timestamp || total == null || vatTotal == null) {
    throw new Error('Missing ZATCA fields');
  }
  const parts = [
    tlv(1, sellerName),
    tlv(2, vatNumber),
    tlv(3, timestamp),
    tlv(4, Number(total).toFixed(2)),
    tlv(5, Number(vatTotal).toFixed(2))
  ];
  return Buffer.concat(parts);
}

export function buildZatcaBase64(params) {
  const buf = buildZatcaTlvBuffer(params);
  return buf.toString('base64');
}

export async function generateZatcaQrPng(params, opts = {}) {
  const base64 = buildZatcaBase64(params);
  const width = opts.width || 200;
  return await QRCode.toBuffer(base64, { type: 'png', errorCorrectionLevel: 'M', width });
}
