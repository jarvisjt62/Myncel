import crypto from 'crypto';

// Simple TOTP implementation
const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Decode(encoded: string): Buffer {
  encoded = encoded.toUpperCase().replace(/[^A-Z2-7]/g, '');
  const bits: number[] = [];
  
  for (const char of encoded) {
    const val = BASE32_CHARS.indexOf(char);
    if (val === -1) continue;
    bits.push((val >> 4) & 1);
    bits.push((val >> 3) & 1);
    bits.push((val >> 2) & 1);
    bits.push((val >> 1) & 1);
    bits.push(val & 1);
  }
  
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) {
      byte = (byte << 1) | bits[i + j];
    }
    bytes.push(byte);
  }
  
  return Buffer.from(bytes);
}

function base32Encode(buffer: Buffer): string {
  let bits = '';
  for (let i = 0; i < buffer.length; i++) {
    bits += buffer[i].toString(2).padStart(8, '0');
  }
  
  let result = '';
  for (let i = 0; i + 5 <= bits.length; i += 5) {
    const chunk = bits.slice(i, i + 5);
    result += BASE32_CHARS[parseInt(chunk, 2)];
  }
  
  return result;
}

function dynamicTruncation(hmac: Buffer): number {
  const offset = hmac[hmac.length - 1] & 0x0f;
  return ((hmac[offset] & 0x7f) << 24) |
         ((hmac[offset + 1] & 0xff) << 16) |
         ((hmac[offset + 2] & 0xff) << 8) |
         (hmac[offset + 3] & 0xff);
}

// Generate TOTP code
function generateTOTP(secret: string, time: number = Date.now()): string {
  const secretBuffer = base32Decode(secret);
  const counter = Math.floor(time / 30000); // 30 second window
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter), 0);
  
  const hmac = crypto.createHmac('sha1', secretBuffer).update(counterBuffer).digest();
  const code = dynamicTruncation(hmac) % 1000000;
  
  return code.toString().padStart(6, '0');
}

// Verify TOTP code with window tolerance
function verifyTOTP(secret: string, token: string, window: number = 1): boolean {
  const time = Date.now();
  
  for (let i = -window; i <= window; i++) {
    const expectedToken = generateTOTP(secret, time + i * 30000);
    if (expectedToken === token) {
      return true;
    }
  }
  
  return false;
}

// Encryption key for storing 2FA secrets
const ENCRYPTION_KEY = process.env.TWO_FACTOR_ENCRYPTION_KEY || 'default-key-change-in-production-32ch!';
const ALGORITHM = 'aes-256-gcm';

// Encrypt 2FA secret
export function encryptSecret(secret: string): string {
  const iv = crypto.randomBytes(16);
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(secret, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

// Decrypt 2FA secret
export function decryptSecret(encryptedSecret: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedSecret.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// Generate a new TOTP secret
export function generateTOTPSecret(email: string): { secret: string; uri: string } {
  const secretBytes = crypto.randomBytes(20);
  const secret = base32Encode(secretBytes);
  const serviceName = 'Myncel AI';
  const uri = `otpauth://totp/${encodeURIComponent(serviceName)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(serviceName)}`;
  
  return { secret, uri };
}

// Verify TOTP code
export function verifyTOTPCode(secret: string, code: string): boolean {
  try {
    const decryptedSecret = decryptSecret(secret);
    return verifyTOTP(decryptedSecret, code);
  } catch {
    return false;
  }
}

// Verify code with raw secret (for setup verification)
export function verifyTOTPCodeRaw(secret: string, code: string): boolean {
  try {
    return verifyTOTP(secret, code);
  } catch {
    return false;
  }
}

// Generate backup codes
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(code);
  }
  return codes;
}

// Hash backup code for storage
export function hashBackupCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

// Verify backup code
export function verifyBackupCode(hashedCodes: string[], code: string): boolean {
  const hashedInput = hashBackupCode(code);
  return hashedCodes.includes(hashedInput);
}

// Rate limiting for 2FA attempts
const twoFactorAttempts = new Map<string, { count: number; lastAttempt: number }>();

export function check2FARateLimit(userId: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 5;
  
  const attempts = twoFactorAttempts.get(userId);
  
  if (!attempts) {
    twoFactorAttempts.set(userId, { count: 1, lastAttempt: now });
    return { allowed: true };
  }
  
  if (now - attempts.lastAttempt > windowMs) {
    twoFactorAttempts.set(userId, { count: 1, lastAttempt: now });
    return { allowed: true };
  }
  
  if (attempts.count >= maxAttempts) {
    const retryAfter = Math.ceil((windowMs - (now - attempts.lastAttempt)) / 1000);
    return { allowed: false, retryAfter };
  }
  
  attempts.count++;
  attempts.lastAttempt = now;
  return { allowed: true };
}

export function clear2FARateLimit(userId: string): void {
  twoFactorAttempts.delete(userId);
}

// Cleanup old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  for (const [key, value] of Array.from(twoFactorAttempts.entries())) {
    if (now - value.lastAttempt > windowMs) {
      twoFactorAttempts.delete(key);
    }
  }
}, 60 * 1000);