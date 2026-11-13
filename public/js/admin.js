/**
 * Wstawia znacznik HTML wokół zaznaczonego tekstu w polu textarea
 */
function insertHtmlTag(textareaId, openTag, closeTag) {
  const el = document.getElementById(textareaId);
  if (!el) return;

  const start = el.selectionStart || 0;
  const end = el.selectionEnd || 0;
  const text = el.value;
  const selected = text.substring(start, end) || 'Tekst';

  el.value = text.substring(0, start) + openTag + selected + closeTag + text.substring(end);
  el.focus();
  el.selectionStart = start + openTag.length;
  el.selectionEnd = start + openTag.length + selected.length;
}

/**
 * Automatyczna kompresja wgrywanych zdjęć do formatu WebP (max 1600px) po stronie przeglądarki.
 * Dzięki temu na hostingu HitMe.pl (512 MB RAM / 5 GB dysku) serwer nie zużywa pamięci RAM na obróbkę zdjęć,
 * a każde zdjęcie waży ~120-200 KB zamiast 6-10 MB.
 */
async function compressImageToWebP(file, maxWidth = 1600, quality = 0.82) {
  if (!file || !file.type.startsWith('image/') || file.type === 'image/svg+xml' || file.type === 'image/webp') {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            const baseName = file.name.replace(/\.[^.]+$/, '');
            const optimizedFile = new File([blob], `${baseName}.webp`, {
              type: 'image/webp',
              lastModified: Date.now()
            });
            resolve(optimizedFile);
          },
          'image/webp',
          quality
        );
      };
      img.onerror = () => resolve(file);
      img.src = event.target.result;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const fileInputs = document.querySelectorAll('input[type="file"][data-compress-webp="true"]');
  fileInputs.forEach((input) => {
    input.addEventListener('change', async () => {
      if (!input.files || input.files.length === 0 || typeof DataTransfer === 'undefined') return;
      const dt = new DataTransfer();
      for (const file of Array.from(input.files)) {
        const compressed = await compressImageToWebP(file);
        dt.items.add(compressed);
      }
      input.files = dt.files;
    });
  });
});
