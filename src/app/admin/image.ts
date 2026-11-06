/** Resizes an image in the browser and re-encodes it as WebP, so uploads stay small. */
export async function toWebp(file: File, maxWidth = 1600, quality = 0.82): Promise<Blob> {
  if (!file.type.startsWith('image/')) throw new Error('Оберіть файл зображення (JPG, PNG або WebP).');
  if (file.size > 25 * 1024 * 1024) throw new Error('Файл завеликий (понад 25 МБ).');
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxWidth / bitmap.width);
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/webp', quality));
  if (!blob) throw new Error('Не вдалося обробити зображення.');
  return blob;
}
