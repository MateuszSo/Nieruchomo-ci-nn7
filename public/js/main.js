document.addEventListener('DOMContentLoaded', () => {
  // 1. Obsługa menu mobilnego
  const mobileBtn = document.getElementById('mobileMenuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  if (mobileBtn && mobileMenu) {
    mobileBtn.addEventListener('click', () => {
      const isHidden = mobileMenu.classList.toggle('hidden');
      mobileBtn.setAttribute('aria-expanded', isHidden ? 'false' : 'true');
    });
  }

  // 2. Pełnoekranowy Lightbox i galeria zdjęć nieruchomości
  const lightbox = document.getElementById('galleryLightbox');
  const lightboxImg = document.getElementById('lightboxImage');
  const lightboxCounter = document.getElementById('lightboxCounter');
  const lightboxCloseBtn = document.getElementById('lightboxCloseBtn');
  const lightboxPrevBtn = document.getElementById('lightboxPrevBtn');
  const lightboxNextBtn = document.getElementById('lightboxNextBtn');
  const lightboxThumbs = document.getElementById('lightboxThumbs');
  const lightboxBackdrop = document.getElementById('lightboxBackdrop');

  let activeImages = [];
  let currentIndex = 0;

  function renderLightboxThumbs() {
    if (!lightboxThumbs) return;
    lightboxThumbs.innerHTML = '';
    if (activeImages.length <= 1) {
      lightboxThumbs.classList.add('hidden');
      return;
    }
    lightboxThumbs.classList.remove('hidden');

    activeImages.forEach((src, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `w-16 h-11 rounded-lg overflow-hidden border-2 transition shrink-0 ${
        idx === currentIndex ? 'border-amber-500 scale-105' : 'border-transparent opacity-60 hover:opacity-100'
      }`;
      const img = document.createElement('img');
      img.src = src;
      img.alt = `Miniatura ${idx + 1}`;
      img.className = 'w-full h-full object-cover';
      btn.appendChild(img);
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        showSlide(idx);
      });
      lightboxThumbs.appendChild(btn);
    });
  }

  function showSlide(index) {
    if (!activeImages.length) return;
    currentIndex = (index + activeImages.length) % activeImages.length;

    if (lightboxImg) {
      lightboxImg.src = activeImages[currentIndex];
    }
    if (lightboxCounter) {
      lightboxCounter.textContent = `${currentIndex + 1} / ${activeImages.length}`;
    }
    if (lightboxPrevBtn && lightboxNextBtn) {
      const displayArrows = activeImages.length > 1 ? 'flex' : 'none';
      lightboxPrevBtn.style.display = displayArrows;
      lightboxNextBtn.style.display = displayArrows;
    }
    renderLightboxThumbs();
  }

  function openLightbox(imagesList, startIndex = 0) {
    if (!lightbox || !imagesList || !imagesList.length) return;
    activeImages = imagesList;
    showSlide(startIndex);
    lightbox.classList.remove('hidden');
    lightbox.classList.add('flex');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.add('hidden');
    lightbox.classList.remove('flex');
    document.body.style.overflow = '';
  }

  // Galeria na stronie szczegółowej nieruchomości
  const galleryContainer = document.querySelector('[data-gallery-images]');
  const mainImage = document.getElementById('mainPropertyImage');
  const thumbs = document.querySelectorAll('[data-gallery-thumb]');
  const openLightboxBtn = document.getElementById('openLightboxBtn');
  const prevInlineBtn = document.getElementById('galleryPrevInline');
  const nextInlineBtn = document.getElementById('galleryNextInline');
  const inlineCounter = document.getElementById('inlineGalleryCounter');

  if (galleryContainer && mainImage) {
    let propertyImages = [];
    try {
      propertyImages = JSON.parse(galleryContainer.getAttribute('data-gallery-images') || '[]');
    } catch {
      propertyImages = [mainImage.src];
    }
    let inlineIndex = 0;

    function updateInlineGallery(newIdx) {
      if (!propertyImages.length) return;
      inlineIndex = (newIdx + propertyImages.length) % propertyImages.length;
      mainImage.src = propertyImages[inlineIndex];
      mainImage.setAttribute('data-open-lightbox', String(inlineIndex));
      if (inlineCounter) {
        inlineCounter.textContent = `${inlineIndex + 1} / ${propertyImages.length}`;
      }
      thumbs.forEach((t, idx) => {
        if (idx === inlineIndex) {
          t.classList.add('ring-2', 'ring-amber-500');
        } else {
          t.classList.remove('ring-2', 'ring-amber-500');
        }
      });
    }

    thumbs.forEach((btn, idx) => {
      btn.addEventListener('click', () => {
        updateInlineGallery(idx);
      });
      btn.addEventListener('dblclick', () => {
        openLightbox(propertyImages, idx);
      });
    });

    if (prevInlineBtn) {
      prevInlineBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        updateInlineGallery(inlineIndex - 1);
      });
    }
    if (nextInlineBtn) {
      nextInlineBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        updateInlineGallery(inlineIndex + 1);
      });
    }

    mainImage.addEventListener('click', () => {
      openLightbox(propertyImages, inlineIndex);
    });

    if (openLightboxBtn) {
      openLightboxBtn.addEventListener('click', () => {
        openLightbox(propertyImages, inlineIndex);
      });
    }
  }

  // Obsługa pojedynczych zdjęć (np. na blogu i w treści artykułów)
  const singleLightboxImgs = document.querySelectorAll('[data-single-lightbox], .rich-content img');
  singleLightboxImgs.forEach((img) => {
    img.classList.add('cursor-zoom-in');
    img.addEventListener('click', () => {
      const src = img.getAttribute('data-single-lightbox') || img.src;
      if (src) openLightbox([src], 0);
    });
  });

  // Zdarzenia kontrolne w Lightboxie
  if (lightboxCloseBtn) {
    lightboxCloseBtn.addEventListener('click', closeLightbox);
  }
  if (lightboxPrevBtn) {
    lightboxPrevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      showSlide(currentIndex - 1);
    });
  }
  if (lightboxNextBtn) {
    lightboxNextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      showSlide(currentIndex + 1);
    });
  }
  if (lightboxBackdrop) {
    lightboxBackdrop.addEventListener('click', (e) => {
      if (e.target === lightboxBackdrop) {
        closeLightbox();
      }
    });
  }

  // Obsługa klawiatury (Strzałki Lewo/Prawo oraz Escape)
  document.addEventListener('keydown', (e) => {
    if (!lightbox || lightbox.classList.contains('hidden')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') showSlide(currentIndex - 1);
    if (e.key === 'ArrowRight') showSlide(currentIndex + 1);
  });

  // Obsługa gestu przesuwania palcem (Swipe) na telefonach
  let touchStartX = 0;
  if (lightbox) {
    lightbox.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    lightbox.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].screenX;
      const diff = touchStartX - touchEndX;
      if (Math.abs(diff) > 45) {
        if (diff > 0) showSlide(currentIndex + 1);
        else showSlide(currentIndex - 1);
      }
    }, { passive: true });
  }
});
