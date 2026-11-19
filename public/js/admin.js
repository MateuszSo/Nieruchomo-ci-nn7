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
 * Konwertuje obiekt Canvas do Blob z obsługą WebP oraz automatycznym fallbackiem do JPEG
 * (np. na starszym Safari / iOS, gdzie canvas.toBlob('image/webp') zwraca bezstratny, wielomegabajtowy PNG).
 */
function canvasToCompressedBlob(canvas, quality) {
  return new Promise((resolve) => {
    canvas.toBlob(
      (webpBlob) => {
        if (webpBlob && webpBlob.type === 'image/webp') {
          resolve({ blob: webpBlob, ext: '.webp', mime: 'image/webp' });
          return;
        }
        canvas.toBlob(
          (jpegBlob) => {
            if (jpegBlob) {
              resolve({ blob: jpegBlob, ext: '.jpg', mime: 'image/jpeg' });
            } else {
              resolve(null);
            }
          },
          'image/jpeg',
          quality
        );
      },
      'image/webp',
      quality
    );
  });
}

/**
 * Automatyczna kompresja i skalowanie wgrywanych zdjęć (JPG, PNG oraz ciężkich plików WebP) po stronie przeglądarki.
 */
async function compressImageToWebP(file, maxWidth = 1440, quality = 0.78) {
  if (!file || !file.type.startsWith('image/') || file.type === 'image/svg+xml') {
    return file;
  }

  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = async () => {
      URL.revokeObjectURL(objectUrl);
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;
      const maxHeight = Math.round(maxWidth * 1.25);

      const wasResized = width > maxWidth || height > maxHeight;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = Math.round((width * maxHeight) / height);
        height = maxHeight;
      }

      // Jeśli plik jest już lekki (< 140 KB), w formacie WebP i nie wymaga zmniejszenia wymiarów, zachowaj oryginał
      if (!wasResized && file.type === 'image/webp' && file.size < 140 * 1024) {
        resolve(file);
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      const encoded = await canvasToCompressedBlob(canvas, quality);
      if (!encoded || !encoded.blob) {
        resolve(file);
        return;
      }

      // Jeśli bez zmiany wymiarów plik wyjściowy wyszedł większy niż mały oryginał, zostaw oryginał
      if (!wasResized && encoded.blob.size >= file.size && file.size < 200 * 1024) {
        resolve(file);
        return;
      }

      const baseName = file.name.replace(/\.[^.]+$/, '');
      const optimizedFile = new File([encoded.blob], `${baseName}${encoded.ext}`, {
        type: encoded.mime,
        lastModified: Date.now()
      });
      resolve(optimizedFile);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const fileInputs = document.querySelectorAll('input[type="file"][data-compress-webp="true"]');

  fileInputs.forEach((input) => {
    input.addEventListener('change', async () => {
      if (!input.files || input.files.length === 0 || typeof DataTransfer === 'undefined') return;

      const form = input.closest('form');
      const submitBtn = form ? form.querySelector('button[type="submit"]') : null;
      const originalBtnText = submitBtn ? submitBtn.textContent : '';

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Optymalizacja zdjęć...';
      }

      try {
        const maxWidth = Number(input.getAttribute('data-max-width')) || 1440;
        const quality = Number(input.getAttribute('data-quality')) || 0.78;
        const generateThumb = input.getAttribute('data-generate-thumb') === 'true';

        const dtMain = new DataTransfer();
        const dtThumb = new DataTransfer();

        for (const rawFile of Array.from(input.files)) {
          const compressedMain = await compressImageToWebP(rawFile, maxWidth, quality);
          dtMain.items.add(compressedMain);

          if (generateThumb) {
            const compressedThumb = await compressImageToWebP(rawFile, 720, 0.74);
            dtThumb.items.add(compressedThumb);
          }
        }

        input.files = dtMain.files;

        if (generateThumb && form) {
          const thumbInputName = `${input.name}_thumb`;
          let thumbInput = form.querySelector(`input[type="file"][name="${thumbInputName}"]`);
          if (!thumbInput) {
            thumbInput = document.createElement('input');
            thumbInput.type = 'file';
            thumbInput.name = thumbInputName;
            thumbInput.multiple = input.multiple;
            thumbInput.className = 'hidden';
            input.insertAdjacentElement('afterend', thumbInput);
          }
          thumbInput.files = dtThumb.files;
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalBtnText;
        }
      }
    });
  });

  // Jednokliknięciowa optymalizacja istniejących ciężkich zdjęć w /uploads/ (Panel Kokpit Główny)
  const optimizeUploadsBtn = document.getElementById('optimizeUploadsBtn');
  const optimizeUploadsStatus = document.getElementById('optimizeUploadsStatus');
  if (optimizeUploadsBtn) {
    optimizeUploadsBtn.addEventListener('click', async () => {
      let items = [];
      try {
        items = JSON.parse(optimizeUploadsBtn.getAttribute('data-oversized-uploads') || '[]');
      } catch {
        items = [];
      }
      if (!items.length) return;

      optimizeUploadsBtn.disabled = true;
      let savedKBTotal = 0;
      let processed = 0;

      for (const item of items) {
        processed += 1;
        if (optimizeUploadsStatus) {
          optimizeUploadsStatus.textContent = `Optymalizowanie ${processed} z ${items.length}: ${item.filename} (${item.sizeKB} KB)...`;
        }
        try {
          const res = await fetch(item.publicPath, { cache: 'no-store' });
          if (!res.ok) continue;
          const rawBlob = await res.blob();
          const rawFile = new File([rawBlob], item.filename, { type: rawBlob.type || 'image/webp' });

          const mainCompressed = await compressImageToWebP(rawFile, 1440, 0.78);
          const thumbCompressed = await compressImageToWebP(rawFile, 720, 0.74);

          const fd = new FormData();
          fd.append('oldPath', item.publicPath);
          fd.append('optimizedFile', mainCompressed);
          fd.append('thumbFile', thumbCompressed);

          const uploadRes = await fetch('/admin/optymalizuj-zdjecie', {
            method: 'POST',
            body: fd
          });
          const data = await uploadRes.json();
          if (data && data.ok) {
            savedKBTotal += Math.max(0, item.sizeKB - (data.newSizeKB || 0));
          }
        } catch (err) {
          console.error('[Optymalizacja]', err);
        }
      }

      if (optimizeUploadsStatus) {
        optimizeUploadsStatus.textContent = `Gotowe! Zoptymalizowano ${processed} zdjęć (zaoszczędzono ok. ${Math.round(savedKBTotal)} KB). Odświeżanie...`;
      }
      window.location.reload();
    });
  }

  // Podgląd wizytówki Social Media (Open Graph) na żywo podczas edycji w ustawieniach
  const seoTitleInput = document.getElementById('seoTitleInput');
  const seoDescInput = document.getElementById('seoDescInput');
  const ogImageInput = document.getElementById('ogImageInput');
  const ogPreviewTitle = document.getElementById('ogPreviewTitle');
  const ogPreviewDesc = document.getElementById('ogPreviewDesc');
  const ogPreviewImg = document.getElementById('ogPreviewImg');

  if (seoTitleInput && ogPreviewTitle) {
    seoTitleInput.addEventListener('input', () => {
      ogPreviewTitle.textContent = seoTitleInput.value || 'NAJLEPSZE NIERUCHOMOŚCI NN7';
    });
  }
  if (seoDescInput && ogPreviewDesc) {
    seoDescInput.addEventListener('input', () => {
      ogPreviewDesc.textContent = seoDescInput.value || '';
    });
  }
  if (ogImageInput && ogPreviewImg) {
    ogImageInput.addEventListener('change', () => {
      const file = ogImageInput.files && ogImageInput.files[0];
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          if (ev.target && ev.target.result) {
            ogPreviewImg.src = ev.target.result;
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }
});
