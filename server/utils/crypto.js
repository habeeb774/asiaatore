import crypto from 'crypto';

// Encryption key - should be in environment variables
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-prod'; // 32 bytes for AES-256
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