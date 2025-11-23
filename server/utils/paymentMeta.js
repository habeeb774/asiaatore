import { encrypt, decrypt } from './crypto.js';

function tryJsonParse(value) {
  if (value == null) return null;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function isEncryptedEnvelope(value) {
  return !!(value && typeof value === 'object' && 'encrypted' in value && 'iv' in value);
}

function setIndexPath(index, path, rawValue) {
  if (!Array.isArray(path) || !path.length) return;
  const value = rawValue == null ? null : String(rawValue);
  if (!value) return;
  let cursor = index;
  for (let i = 0; i < path.length - 1; i += 1) {
    const key = path[i];
    if (!key) return;
    if (!cursor[key] || typeof cursor[key] !== 'object') cursor[key] = {};
    cursor = cursor[key];
  }
  cursor[path[path.length - 1]] = value;
}

function pruneEmptyBranches(obj) {
  if (!obj || typeof obj !== 'object') return undefined;
  const keys = Object.keys(obj);
  if (!keys.length) return undefined;
  let nonEmpty = false;
  for (const key of keys) {
    const pruned = pruneEmptyBranches(obj[key]);
    if (pruned === undefined) {
      delete obj[key];
    } else {
      obj[key] = pruned;
      nonEmpty = true;
    }
  }
  return nonEmpty ? obj : undefined;
}

function normalizeMeta(meta) {
  if (meta == null) return null;
  const parsed = tryJsonParse(meta);
  return parsed;
}

export function buildPaymentMetaIndex(meta) {
  const normalized = normalizeMeta(meta);
  if (!normalized || typeof normalized !== 'object') return undefined;
  const index = {};

  const stc = normalized.stc || {};
  if (stc.sessionId) setIndexPath(index, ['stc', 'sessionId'], stc.sessionId);
  if (stc.externalReference) setIndexPath(index, ['stc', 'externalReference'], stc.externalReference);
  if (stc.transactionId) setIndexPath(index, ['stc', 'transactionId'], stc.transactionId);

  const stripeIntent = normalized.stripePaymentIntentId
    || normalized.paymentIntentId
    || normalized?.stripe?.paymentIntentId
    || normalized?.stripe?.id;
  if (stripeIntent) setIndexPath(index, ['stripe', 'paymentIntentId'], stripeIntent);

  const stripeMethod = normalized.stripePaymentMethodId
    || normalized?.stripe?.paymentMethodId;
  if (stripeMethod) setIndexPath(index, ['stripe', 'paymentMethodId'], stripeMethod);

  const paypalOrder = normalized.paypalOrderId
    || normalized?.paypal?.paypalOrderId
    || normalized?.paypal?.orderId;
  if (paypalOrder) setIndexPath(index, ['paypal', 'paypalOrderId'], paypalOrder);

  const paypalCapture = normalized?.paypal?.captureId || normalized?.paypal?.capture?.id;
  if (paypalCapture) setIndexPath(index, ['paypal', 'captureId'], paypalCapture);

  const bankRef = normalized?.bank?.reference;
  if (bankRef) setIndexPath(index, ['bank', 'reference'], bankRef);

  const codProof = normalized?.cod?.reference;
  if (codProof) setIndexPath(index, ['cod', 'reference'], codProof);

  return pruneEmptyBranches(index);
}

export function deserializePaymentMeta(raw) {
  if (!raw) return null;
  let parsed = raw;
  if (typeof raw === 'string') {
    parsed = tryJsonParse(raw);
  }
  if (isEncryptedEnvelope(parsed)) {
    try {
      const decrypted = decrypt(parsed);
      return JSON.parse(decrypted);
    } catch {
      return null;
    }
  }
  if (typeof parsed === 'string') {
    try {
      return JSON.parse(parsed);
    } catch {
      return null;
    }
  }
  if (parsed && typeof parsed === 'object') {
    return parsed;
  }
  return null;
}

export function serializePaymentMeta(meta) {
  if (!meta) return null;
  if (isEncryptedEnvelope(meta)) {
    const envelope = { ...meta };
    if (!envelope.index) {
      const indexed = buildPaymentMetaIndex(decrypt(meta));
      if (indexed) envelope.index = indexed;
    }
    return envelope;
  }

  let payload;
  let metaObject = meta;
  if (typeof meta === 'string') {
    payload = meta;
    metaObject = tryJsonParse(meta) || meta;
  } else {
    try {
      payload = JSON.stringify(meta);
    } catch {
      return null;
    }
  }

  try {
    const encrypted = encrypt(payload);
    const envelope = { encrypted: encrypted.encrypted, iv: encrypted.iv, v: 1 };
    const index = buildPaymentMetaIndex(metaObject);
    if (index) envelope.index = index;
    return envelope;
  } catch {
    return null;
  }
}

export function mergePaymentMeta(raw, updater) {
  const current = deserializePaymentMeta(raw) || {};
  const next = updater ? updater({ ...current }) : current;
  if (!next || (typeof next === 'object' && !Object.keys(next).length)) {
    return null;
  }
  return serializePaymentMeta(next);
}
