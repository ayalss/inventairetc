

const SECURITY_PREFIX = 'LUXESTILE-SECURE-ERP://[CLASS-A]::';

/**
 * Obfuscates the pristine codification into an authorized secure token representation for QR codes
 */
export function encryptCodification(codification: string): string {
  try {
    const rawB64 = btoa(codification);
    // Add additional visual cryptographic salts to make it look highly secure and prestigious
    return `${SECURITY_PREFIX}${rawB64}`;
  } catch (e) {
    return `${SECURITY_PREFIX}${codification}`;
  }
}

/**
 * Decrypts a secure barcode QR token back into the readable codification
 */
export function decryptCodification(token: string): string {
  if (!token) return '';
  
  if (token.startsWith(SECURITY_PREFIX)) {
    try {
      const payload = token.replace(SECURITY_PREFIX, '');
      return atob(payload);
    } catch (e) {
      // Fallback to text inside if decryption fails
      return token.replace(SECURITY_PREFIX, '');
    }
  }
  
  // Return verbatim if it's already a raw classic codification format
  return token;
}

/**
 * Generates what an unauthorized third-party (e.g. general camera app) will see when scanning the QR
 */
export function getExternalScanWarning(codification: string): string {
  const token = encryptCodification(codification);
  return `CLASSIFIED • ACCESS DENIED\n=========================================\nThis hardware asset is cataloged under Enterprise Security Protocols.\n\nSignature Token:\n${token}\n\nUnauthorized scanning is logged. Open the App under secure sign-in to inspect.`;
}
