/**
 * Reads a user-selected file and converts it into a base64 data URI so it can be
 * stored/transmitted through the existing JSON JSON API (no multipart upload layer).
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB (JSON API body limit is 10mb)

export async function fileToDataUri(file: File): Promise<string> {
  if (!file.type || !file.type.startsWith('image/')) {
    throw new Error('Please select an image file (PNG, JPG, SVG, etc.)');
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Selected image is too large. Maximum allowed size is 5MB.');
  }

  const reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read the selected image file'));
    reader.readAsDataURL(file);
  });
}