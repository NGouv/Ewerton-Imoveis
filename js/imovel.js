(() => {
  const repository = window.PropertyRepository;
  const content = document.querySelector("#property-content");
  const notFound = document.querySelector("#not-found");
  const currentYear = document.querySelector("#current-year");
  const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  const area = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });
  const statusLabels = { available: "Disponível", sold: "Vendido", rented: "Alugado" };

  const showUnavailable = (message) => {
    notFound.hidden = false;
    notFound.querySelector("h1").textContent = message;
    document.title = "Imóvel indisponível | Ewerton Imóveis";
  };

  const hasValue = (value) => value !== null && value !== undefined && value !== "";

  const renderStats = (property) => {
    const stats = [
      [property.bedrooms, "quartos"],
      [property.suites, "suítes"],
      [property.bathrooms, "banheiros"],
      [property.parking_spaces, "vagas"],
      [hasValue(property.private_area) ? `${area.format(property.private_area)} m²` : null, "área privativa"],
      [hasValue(property.total_area) ? `${area.format(property.total_area)} m²` : null, "área total"]
    ].filter(([value]) => hasValue(value));

    const container = document.querySelector("#property-stats");
    stats.forEach(([value, label]) => {
      const item = document.createElement("div");
      item.className = "stat";
      const statValue = document.createElement("span");
      statValue.className = "stat-value";
      statValue.textContent = String(value);
      const statLabel = document.createElement("span");
      statLabel.className = "stat-label";
      statLabel.textContent = label;
      item.append(statValue, statLabel);
      container.append(item);
    });
    container.hidden = !stats.length;
  };

  const appendList = (container, values) => {
    values.forEach((value) => {
      const item = document.createElement("li");
      item.textContent = value;
      container.append(item);
    });
  };

  const renderGallery = (property) => {
    const gallery = [...(property.property_images || [])]
      .filter((image) => image.storage_path)
      .sort((a, b) => a.display_order - b.display_order);
    const coverIndex = gallery.findIndex((image) => image.is_cover);
    if (coverIndex > 0) gallery.unshift(gallery.splice(coverIndex, 1)[0]);

    const mainPhoto = document.querySelector("#main-photo");
    const mainPhotoButton = document.querySelector("#open-lightbox");
    const previous = document.querySelector("#photo-previous");
    const next = document.querySelector("#photo-next");
    const photoCount = document.querySelector("#photo-count");
    const photoCaption = document.querySelector("#photo-caption");
    const photoEmpty = document.querySelector("#photo-empty");
    const thumbnails = document.querySelector("#thumbnail-list");
    const lightbox = document.querySelector("#lightbox");
    const lightboxImage = document.querySelector("#lightbox-image");
    let activeIndex = 0;
    let returnFocus = null;
    let touchStartX = null;

    if (!gallery.length) {
      photoEmpty.hidden = false;
      photoCount.textContent = "Sem fotografias";
      mainPhotoButton.hidden = true;
      previous.hidden = true;
      next.hidden = true;
      thumbnails.hidden = true;
      return;
    }

    const photos = gallery.map((image, index) => ({
      src: repository.publicImageUrl(image.storage_path),
      alt: image.alt_text || `Fotografia ${index + 1} do imóvel`,
      label: image.alt_text || `Fotografia ${index + 1}`
    }));
    const thumbnailButtons = photos.map((photo, index) => {
      const button = document.createElement("button");
      const image = document.createElement("img");
      button.className = "thumbnail";
      button.type = "button";
      button.setAttribute("aria-label", `Mostrar fotografia ${index + 1}: ${photo.label}`);
      button.setAttribute("aria-pressed", "false");
      image.alt = "";
      image.loading = "lazy";
      image.src = photo.src;
      image.addEventListener("error", () => { image.hidden = true; }, { once: true });
      button.append(image);
      button.addEventListener("click", () => showPhoto(index));
      thumbnails.append(button);
      return button;
    });

    const showPhoto = (index) => {
      activeIndex = (index + photos.length) % photos.length;
      const photo = photos[activeIndex];
      photoEmpty.hidden = true;
      mainPhoto.hidden = false;
      mainPhotoButton.hidden = false;
      mainPhotoButton.disabled = false;
      mainPhoto.src = photo.src;
      mainPhoto.alt = photo.alt;
      photoCaption.textContent = photo.label;
      photoCount.textContent = `${activeIndex + 1} de ${photos.length} fotos`;
      previous.hidden = photos.length < 2;
      next.hidden = photos.length < 2;
      thumbnailButtons.forEach((button, buttonIndex) => {
        button.setAttribute("aria-pressed", String(buttonIndex === activeIndex));
      });
      const selectedThumbnail = thumbnailButtons[activeIndex];
      const railRect = thumbnails.getBoundingClientRect();
      const selectedRect = selectedThumbnail.getBoundingClientRect();
      thumbnails.scrollTo({
        left: thumbnails.scrollLeft + selectedRect.left - railRect.left -
          (thumbnails.clientWidth - selectedRect.width) / 2,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"
      });
      if (!lightbox.hidden) {
        lightboxImage.hidden = false;
        lightboxImage.src = photo.src;
        lightboxImage.alt = photo.alt;
        document.querySelector("#lightbox-count").textContent = `${activeIndex + 1} de ${photos.length} fotos`;
        document.querySelector("#lightbox-caption").textContent = photo.label;
      }
    };

    mainPhoto.addEventListener("error", () => {
      mainPhoto.hidden = true;
      photoEmpty.hidden = false;
      photoEmpty.textContent = "Não foi possível carregar esta fotografia.";
      mainPhotoButton.disabled = true;
    });
    lightboxImage.addEventListener("error", () => {
      lightboxImage.hidden = true;
    });

    const openLightbox = () => {
      returnFocus = document.activeElement;
      lightbox.hidden = false;
      document.body.style.overflow = "hidden";
      showPhoto(activeIndex);
      document.querySelector("#close-lightbox").focus();
    };
    const closeLightbox = () => {
      lightbox.hidden = true;
      document.body.style.overflow = "";
      if (returnFocus instanceof HTMLElement) returnFocus.focus();
    };

    document.querySelector("#photo-previous").addEventListener("click", () => showPhoto(activeIndex - 1));
    document.querySelector("#photo-next").addEventListener("click", () => showPhoto(activeIndex + 1));
    mainPhotoButton.addEventListener("click", openLightbox);
    document.querySelector("#lightbox-previous").addEventListener("click", () => showPhoto(activeIndex - 1));
    document.querySelector("#lightbox-next").addEventListener("click", () => showPhoto(activeIndex + 1));
    document.querySelector("#close-lightbox").addEventListener("click", closeLightbox);
    lightbox.addEventListener("click", (event) => {
      if (event.target === lightbox) closeLightbox();
    });
    document.addEventListener("keydown", (event) => {
      if (lightbox.hidden) return;
      if (event.key === "Escape") closeLightbox();
      if (event.key === "ArrowLeft") showPhoto(activeIndex - 1);
      if (event.key === "ArrowRight") showPhoto(activeIndex + 1);
      if (event.key === "Tab") {
        const focusable = [...lightbox.querySelectorAll("button")];
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });

    const bindSwipe = (element) => {
      element.addEventListener("touchstart", (event) => {
        touchStartX = event.changedTouches[0].clientX;
      }, { passive: true });
      element.addEventListener("touchend", (event) => {
        if (touchStartX === null) return;
        const delta = event.changedTouches[0].clientX - touchStartX;
        if (Math.abs(delta) > 45) showPhoto(activeIndex + (delta < 0 ? 1 : -1));
        touchStartX = null;
      }, { passive: true });
    };
    bindSwipe(document.querySelector("#gallery-swipe"));
    bindSwipe(document.querySelector("#lightbox-swipe"));
    showPhoto(0);
  };

  const renderVideos = async (propertyId) => {
    const section = document.querySelector("#property-videos-section");
    const list = document.querySelector("#property-videos");
    const message = document.querySelector("#video-message");
    let videos;
    try {
      videos = await repository.listPublicVideos(propertyId);
    } catch (error) {
      message.hidden = false;
      message.textContent = `Não foi possível carregar os vídeos: ${error.message}`;
      section.hidden = false;
      return;
    }

    videos.forEach((video, index) => {
      let parsed;
      try {
        parsed = window.PropertyVideos.parse(video.url);
      } catch (error) {
        message.hidden = false;
        message.textContent = "Um dos links de vídeo cadastrados não é compatível e foi ignorado.";
        return;
      }
      const card = document.createElement("article");
      card.className = "property-video-card";
      const heading = document.createElement("h3");
      heading.textContent = `${parsed.label} · Vídeo ${index + 1}`;
      card.append(heading);
      if (parsed.platform === "direct") {
        const player = document.createElement("video");
        player.src = parsed.url;
        player.controls = true;
        player.preload = "metadata";
        player.playsInline = true;
        player.setAttribute("aria-label", heading.textContent);
        card.append(player);
      } else if (parsed.embedUrl) {
        const frame = document.createElement("iframe");
        frame.src = parsed.embedUrl;
        frame.title = heading.textContent;
        frame.loading = "lazy";
        frame.referrerPolicy = "strict-origin-when-cross-origin";
        frame.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
        frame.allowFullscreen = true;
        card.append(frame);
      } else {
        const note = document.createElement("p");
        note.className = "video-link-note";
        note.textContent = "Este link compartilhado precisa ser aberto na plataforma para reproduzir o vídeo.";
        card.append(note);
      }
      const link = document.createElement("a");
      link.href = parsed.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "Abrir na plataforma";
      card.append(link);
      list.append(card);
    });
    section.hidden = !videos.length && message.hidden;
  };

  const loadProperty = async () => {
    currentYear.textContent = String(new Date().getFullYear());
    const propertyId = new URLSearchParams(window.location.search).get("id");
    if (!propertyId) {
      showUnavailable("Não foi informado o identificador do imóvel.");
      return;
    }
    if (!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(propertyId)) {
      showUnavailable("O identificador do imóvel é inválido.");
      return;
    }

    try {
      const configured = await repository.ready;
      if (!configured) throw new Error("A conexão com o catálogo não está configurada.");
      const property = await repository.getPublicProperty(propertyId);
      if (!property) {
        showUnavailable("Não foi possível localizar este imóvel publicado.");
        return;
      }

      content.hidden = false;
      document.title = `${property.title} | Ewerton Imóveis`;
      document.querySelector("#breadcrumb-title").textContent = property.title;
      document.querySelector("#property-title").textContent = property.title;
      document.querySelector("#property-location").textContent =
        [property.neighborhood, property.city, property.state].filter(Boolean).join(" · ") || "Localização não informada";
      document.querySelector("#property-type").textContent =
        [property.property_type, property.purpose === "rent" ? "Aluguel" : "Venda", statusLabels[property.status]]
          .filter(Boolean).join(" · ");
      document.querySelector("#property-code").textContent = `CÓDIGO · ${property.id.slice(0, 8).toUpperCase()}`;
      document.querySelector("#property-price").textContent = money.format(Number(property.price));
      document.querySelector("#property-description").textContent =
        property.description?.trim() || "Descrição não cadastrada.";
      document.querySelector("#property-whatsapp").href =
        `https://wa.me/5519995188676?text=${encodeURIComponent(`Olá! Tenho interesse no imóvel ${property.title}.`)}`;
      document.querySelector("#header-whatsapp").href =
        `https://wa.me/5519995188676?text=${encodeURIComponent(`Olá! Gostaria de conversar sobre o imóvel ${property.title}.`)}`;

      renderStats(property);
      const features = [...new Set((property.features || []).filter((feature) => String(feature).trim()))];
      const featuresSection = document.querySelector(".detail-section--features");
      appendList(document.querySelector("#property-features"), features);
      featuresSection.hidden = !features.length;

      const costs = [];
      if (hasValue(property.condo_fee)) costs.push(`Condomínio mensal: ${money.format(Number(property.condo_fee))}`);
      if (hasValue(property.property_tax)) costs.push(`IPTU anual: ${money.format(Number(property.property_tax))}`);
      appendList(document.querySelector("#property-costs"), costs);
      document.querySelector("#property-costs-section").hidden = !costs.length;

      renderGallery(property);
      await renderVideos(property.id);

      const detailSections = document.querySelector(".detail-sections");
      detailSections.hidden = !document.querySelector(".detail-section:not([hidden])");
      const revealItems = [
        document.querySelector(".property-heading"),
        document.querySelector(".detail-layout"),
        document.querySelector(".video-section:not([hidden])"),
        ...document.querySelectorAll(".detail-section:not([hidden])")
      ].filter(Boolean);
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
        revealItems.forEach((item) => item.classList.add("is-revealed"));
      } else {
        const observer = new IntersectionObserver((entries, currentObserver) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-revealed");
            currentObserver.unobserve(entry.target);
          });
        }, { threshold: 0.12 });
        revealItems.forEach((item) => {
          item.classList.add("reveal");
          observer.observe(item);
        });
      }
    } catch (error) {
      showUnavailable(`Não foi possível carregar este imóvel: ${error.message}`);
    }
  };

  loadProperty();
})();
