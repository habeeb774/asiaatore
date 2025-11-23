import crypto from 'crypto';

// Encryption key - should be in environment variables
let ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length < 32) {
  console.error('[CRYPTO] ENCRYPTION_KEY is missing or too short. Using an insecure default. Please set a strong key (at least 32 chars) in production.');
  // Fallback to a fixed length key for dev, but warn loudly
  ENCRYPTION_KEY = 'insecure-dev-key-please-change-me-in-prod-1234567890';
  process.env.ENCRYPTION_KEY = ENCRYPTION_KEY;
}
const ALGORITHM = 'aes-256-cbc';

// Ensure key is 32 bytes
const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);

export function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return {
    encrypted,
    iv: iv.toString('hex')
  };
}

export function decrypt(encryptedData) {
  const iv = Buffer.from(encryptedData.iv, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Helper to encrypt sensitive fields before saving
export function encryptSensitiveData(data, fields) {
  const encrypted = { ...data };
  fields.forEach(field => {
    if (encrypted[field]) {
      encrypted[field] = JSON.stringify(encrypt(JSON.stringify(encrypted[field])));
    }
  });
  return encrypted;
}

// Helper to decrypt sensitive fields after fetching
export function decryptSensitiveData(data, fields) {
  const decrypted = { ...data };
  fields.forEach(field => {
    if (decrypted[field]) {
      try {
        const parsed = JSON.parse(decrypted[field]);
        decrypted[field] = JSON.parse(decrypt(parsed));
      } catch (e) {
        // If decryption fails, leave as is or log error
        console.error('Failed to decrypt field:', field, e.message);
      }
    }
  });
  return decrypted;
}