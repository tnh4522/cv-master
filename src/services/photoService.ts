const ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
];
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB (verified from Du in index-B9ESfVPA.js)

export interface PhotoValidationResult {
  valid: boolean;
  errorTitle?: string;
  errorDescription?: string;
}

/**
 * Validates a profile photo file against verified CVMaster rules (`Du`):
 * - Allowed MIME types: image/png, image/jpeg, image/jpg, image/webp
 * - Max file size: 2 MB (2,097,152 bytes)
 */
export function validatePhotoFile(file: File): PhotoValidationResult {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      errorTitle: 'Invalid file type',
      errorDescription: 'Please upload a PNG, JPEG, JPG, or WEBP image.',
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      errorTitle: 'File is too large',
      errorDescription: 'Maximum photo file size is 2MB.',
    };
  }

  return { valid: true };
}

/**
 * Reads a File into a local base64 Data URL for browser-side persistence.
 */
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read image file as Data URL'));
      }
    };
    reader.onerror = () => reject(new Error('Error reading image file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Validates whether a string is a valid http/https URL or data:image URL.
 */
export function isValidPhotoUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return true;
  if (trimmed.startsWith('data:image/')) return true;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

/**
 * Uploads or converts a profile photo (`Du`).
 * 1. Validates MIME type and size <= 2MB.
 * 2. Immediately reads the file via `FileReader.readAsDataURL(file)`.
 * 3. If `VITE_PHOTO_UPLOAD_URL` is configured, posts `{ image: dataUrl }` to the adapter endpoint;
 *    otherwise returns the self-contained Data URL directly for zero-backend persistence.
 */
export async function uploadProfilePhoto(file: File): Promise<string> {
  const validation = validatePhotoFile(file);
  if (!validation.valid) {
    throw new Error(
      validation.errorDescription || validation.errorTitle || 'Invalid file'
    );
  }

  const dataUrl = await readFileAsDataUrl(file);
  const uploadEndpoint = import.meta.env.VITE_PHOTO_UPLOAD_URL;

  if (uploadEndpoint) {
    try {
      const response = await fetch(uploadEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataUrl }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data?.url && typeof data.url === 'string') {
          return data.url;
        }
      }
    } catch {
      // Gracefully fall back to self-contained Data URL when remote endpoint is unreachable
    }
  }

  return dataUrl;
}
