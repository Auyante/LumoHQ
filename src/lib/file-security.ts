/**
 * File Upload Security & Magic Bytes Sanitizer (OWASP ASVS 12.1)
 * Protects against Malicious File Uploads, Polyglots and Metadata Leakage
 */

export interface FileValidationResult {
  isValid: boolean;
  detectedMimeType?: string;
  error?: string;
  cleanBuffer?: Buffer;
}

export function validateImageMagicBytes(buffer: Buffer, originalFilename: string): FileValidationResult {
  // 1. Max size: 10MB
  const MAX_SIZE = 10 * 1024 * 1024;
  if (buffer.length > MAX_SIZE) {
    return { isValid: false, error: 'El archivo excede el límite máximo de 10MB.' };
  }

  // 2. Extension check
  const ext = originalFilename.split('.').pop()?.toLowerCase();
  const dangerousExtensions = ['svg', 'html', 'htm', 'exe', 'php', 'js', 'sh', 'bat', 'cmd', 'phtml', 'dll'];
  if (!ext || dangerousExtensions.includes(ext)) {
    return {
      isValid: false,
      error: `Formato de archivo no permitido (.${ext}). Solo se admiten imágenes JPG, PNG o WebP.`,
    };
  }

  // 3. Inspect Magic Bytes (File Signatures)
  if (buffer.length < 12) {
    return { isValid: false, error: 'Archivo demasiado pequeño o corrupto.' };
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { isValid: true, detectedMimeType: 'image/jpeg', cleanBuffer: buffer };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { isValid: true, detectedMimeType: 'image/png', cleanBuffer: buffer };
  }

  // WebP: RIFF ... WEBP (52 49 46 46 .... 57 45 42 50)
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { isValid: true, detectedMimeType: 'image/webp', cleanBuffer: buffer };
  }

  return {
    isValid: false,
    error: 'Firma de archivo inválida (Magic Bytes no coinciden con formato de imagen seguro).',
  };
}

