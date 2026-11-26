(() => {
  const repository = window.PropertyRepository;
  const loading = document.querySelector("#property-loading");
  const content = document.querySelector("#property-content");
  const notFound = document.querySelector("#not-found");
  const money = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0
  });
  const numberFormat = new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 2
  });
  const svgNamespace = "http://www.w3.org/2000/svg";
  const phoneNumber = "5519995188676";

  const hasValue = (value) => value !== null && value !== undefined &&
    (typeof value !== "string" || value.trim() !== "");
  const validNumber = (value) => {
    if (!hasValue(value)) return null;
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? number : null;
  };
  const formatArea = (value) => {
    const number = validNumber(value);
    return number === null ? null : `${numberFormat.format(number)} m²`;
  };
  const formatMoney = (value) => {
    const number = validNumber(value);
    return number === null ? null : money.format(number);
  };
  const makeIcon = (paths) => {
    const icon = document.createElementNS(svgNamespace, "svg");
    icon.setAttribute("viewBox", "0 0 24 24");
    icon.setAttribute("fill", "none");
    icon.setAttribute("stroke", "currentColor");
    icon.setAttribute("stroke-width", "1.5");
    icon.setAttribute("stroke-linecap", "round");
    icon.setAttribute("stroke-linejoin", "round");
    icon.setAttribute("aria-hidden", "true");
    paths.forEach((pathData) => {
      const path = document.createElementNS(svgNamespace, "path");
      path.setAttribute("d", pathData);
      icon.append(path);
    });
    return icon;
  };

  const iconPaths = {
    bedrooms: ["M3 20V9l9-6 9 6v11", "M9 20v-6h6v6"],
    bathrooms: ["M3 12h18", "M5 12v5a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-5", "M7 12V6a2 2 0 0 1 4 0v1"],
    parking: ["M5 20V4h8a5 5 0 0 1 0 10H5", "M5 14h8"],
    area: ["M4 4h16v16H4z", "M8 8h.01M16 8h.01M8 16h.01M16 16h.01"]
  };

  const createWhatsAppLink = (message) =>
    `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  function setReturnLink() {
    const link = document.querySelector("#catalog-back");
    if (!link || !document.referrer) return;
    try {
      const referrer = new URL(document.referrer);
      const current = new URL(window.location.href);
      if (referrer.origin === current.origin && /\/index\.html$/.test(referrer.pathname)) {
        if (!referrer.hash) referrer.hash = "imoveis";
        link.href = referrer.href;
      }
    } catch (error) {
      link.href = "./index.html#imoveis";
    }
  }

  function setupHeader() {
    const header = document.querySelector("#site-header");
    const toggle = document.querySelector("#nav-toggle");
    const navigation = document.querySelector("#primary-navigation");
    if (toggle && navigation) {
      toggle.addEventListener("click", () => {
        const isOpen = toggle.getAttribute("aria-expanded") === "true";
        toggle.setAttribute("aria-expanded", String(!isOpen));
        toggle.setAttribute("aria-label", isOpen ? "Abrir menu" : "Fechar menu");
        navigation.classList.toggle("is-open", !isOpen);
      });
      navigation.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
          toggle.setAttribute("aria-expanded", "false");
          toggle.setAttribute("aria-label", "Abrir menu");
          navigation.classList.remove("is-open");
        });
      });
    }
    const updateHeader = () => {
      if (header) header.classList.toggle("is-scrolled", window.scrollY > 12);
    };
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
  }

  function setupSharing() {
    const shareButton = document.querySelector("#share-property");
    const feedback = document.querySelector("#share-feedback");
    if (!shareButton || !feedback) return;

    const copyLink = async () => {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(window.location.href);
        return;
      }
      const field = document.createElement("textarea");
      field.value = window.location.href;
      field.setAttribute("aria-hidden", "true");
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.append(field);
      field.select();
      const copied = document.execCommand("copy");
      field.remove();
      if (!copied) throw new Error("A cópia do link não foi permitida pelo navegador.");
    };

    shareButton.addEventListener("click", async () => {
      feedback.textContent = "";
      try {
        if (navigator.share) {
          try {
            await navigator.share({
              title: document.querySelector("#property-title")?.textContent || document.title,
              url: window.location.href
            });
            feedback.textContent = "Link compartilhado.";
            return;
          } catch (error) {
            if (error.name === "AbortError") return;
          }
        }
        await copyLink();
        feedback.textContent = "Link copiado.";
      } catch (error) {
        feedback.textContent = "Não foi possível compartilhar o link neste navegador.";
      }
    });
  }

  function renderBadges(property) {
    const container = document.querySelector("#property-badges");
    if (!container) return;
    container.replaceChildren();

    const purposes = {
      sale: "À venda",
      rent: "Para alugar",
      rental: "Para alugar",
      venda: "À venda",
      aluguel: "Para alugar"
    };
    const statuses = {
      available: "Disponível",
      reserved: "Reservado",
      sold: "Vendido",
      rented: "Alugado"
    };
    const purpose = purposes[String(property.purpose || "").toLowerCase()];
    const status = statuses[String(property.status || "").toLowerCase()];
    const values = [
      { text: purpose, className: "property-badge property-badge--accent" },
      { text: property.property_type, className: "property-badge" },
      { text: status, className: "property-badge property-badge--muted" }
    ];

    values.filter((badge) => hasValue(badge.text)).forEach((badge) => {
      const element = document.createElement("span");
      element.className = badge.className;
      element.textContent = badge.text;
      container.append(element);
    });
  }

  function renderFacts(property) {
    const container = document.querySelector("#property-stats");
    const section = document.querySelector(".quick-facts-section");
    if (!container || !section) return;
    container.replaceChildren();

    const facts = [
      { value: validNumber(property.bedrooms), label: "Quartos", icon: "bedrooms" },
      { value: validNumber(property.bathrooms), label: "Banheiros", icon: "bathrooms" },
      { value: validNumber(property.parking_spaces), label: "Vagas", icon: "parking" },
      { value: formatArea(property.total_area), label: "Área total", icon: "area" }
    ].filter((fact) => fact.value !== null);

    facts.forEach((fact) => {
      const item = document.createElement("article");
      item.className = "quick-fact";
      item.append(makeIcon(iconPaths[fact.icon]));
      const text = document.createElement("div");
      text.className = "quick-fact-copy";
      const value = document.createElement("strong");
      value.textContent = typeof fact.value === "number"
        ? numberFormat.format(fact.value)
        : fact.value;
      const label = document.createElement("span");
      label.textContent = fact.label;
      text.append(value, label);
      item.append(text);
      container.append(item);
    });
    section.hidden = facts.length === 0;
  }

  function getLocation(property) {
    return [property.neighborhood, property.city, property.state]
      .filter((value) => hasValue(value))
      .map((value) => String(value).trim())
      .join(", ");
  }

  function renderInformation(property) {
    const container = document.querySelector("#property-info");
    const section = document.querySelector("#info-section");
    if (!container || !section) return;
    container.replaceChildren();

    const entries = [
      ["Suítes", validNumber(property.suites)],
      ["Área privativa", formatArea(property.private_area)],
      ["Área total", formatArea(property.total_area)],
      ["Condomínio", formatMoney(property.condo_fee)],
      ["IPTU", formatMoney(property.property_tax)],
      ["Localização aproximada", getLocation(property)]
    ].filter(([, value]) => value !== null && hasValue(value));

    entries.forEach(([label, value]) => {
      const item = document.createElement("div");
      item.className = "property-info-item";
      const term = document.createElement("dt");
      term.textContent = label;
      const description = document.createElement("dd");
      description.textContent = typeof value === "number" ? numberFormat.format(value) : value;
      item.append(term, description);
      container.append(item);
    });
    section.hidden = entries.length === 0;
  }

  function renderFeatures(property) {
    const features = Array.isArray(property.features)
      ? property.features.filter((feature) => typeof feature === "string" && feature.trim())
      : [];
    const featureSection = document.querySelector("#features-section");
    const featureList = document.querySelector("#property-features");
    const highlights = document.querySelector("#property-highlights");
    if (featureSection && featureList) {
      featureList.replaceChildren();
      features.forEach((feature) => {
        const item = document.createElement("li");
        item.textContent = feature.trim();
        featureList.append(item);
      });
      featureSection.hidden = features.length === 0;
    }
    if (highlights) {
      highlights.replaceChildren();
      features.slice(0, 3).forEach((feature) => {
        const item = document.createElement("li");
        item.textContent = feature.trim();
        highlights.append(item);
      });
      highlights.hidden = features.length === 0;
    }
  }

  function renderGallery(property) {
    const galleryBento = document.querySelector("#gallery-bento");
    const mainPhoto = document.querySelector("#main-photo");
    const mainPhotoButton = document.querySelector("#open-lightbox");
    const photoEmpty = document.querySelector("#photo-empty");
    const photoCount = document.querySelector("#photo-count");
    const photoCaption = document.querySelector("#photo-caption");
    const previousButton = document.querySelector("#photo-previous");
    const nextButton = document.querySelector("#photo-next");
    const previewContainer = document.querySelector("#gallery-previews");
    const thumbnailList = document.querySelector("#thumbnail-list");
    const lightbox = document.querySelector("#lightbox");
    const lightboxImage = document.querySelector("#lightbox-image");
    const lightboxCount = document.querySelector("#lightbox-count");
    const lightboxCaption = document.querySelector("#lightbox-caption");
    const lightboxPrevious = document.querySelector("#lightbox-previous");
    const lightboxNext = document.querySelector("#lightbox-next");
    const closeButton = document.querySelector("#close-lightbox");

    const images = Array.isArray(property.property_images) ? property.property_images : [];
    const photos = images
      .filter((image) => image && hasValue(image.storage_path))
      .sort((first, second) => {
        if (Boolean(first.is_cover) !== Boolean(second.is_cover)) return first.is_cover ? -1 : 1;
        return (Number(first.display_order) || 0) - (Number(second.display_order) || 0);
      });

    let activeIndex = 0;
    let previousFocus = null;
    let thumbnailButtons = [];
    const imageUrl = (photo) => repository.publicImageUrl(photo.storage_path);
    const photoLabel = (photo) => hasValue(photo.alt_text) ? photo.alt_text : property.title;

    const showPhoto = (index) => {
      if (!photos.length) return;
      activeIndex = (index + photos.length) % photos.length;
      const photo = photos[activeIndex];
      const url = imageUrl(photo);
      mainPhoto.src = url;
      mainPhoto.alt = photoLabel(photo);
      mainPhoto.hidden = false;
      photoEmpty.hidden = true;
      if (photoCaption) {
        photoCaption.textContent = hasValue(photo.alt_text) ? photo.alt_text : "";
        photoCaption.hidden = !hasValue(photo.alt_text);
      }
      if (photoCount) {
        photoCount.textContent = `${activeIndex + 1} / ${photos.length}`;
        photoCount.hidden = false;
      }
      if (lightbox && !lightbox.hidden) {
        lightboxImage.src = url;
        lightboxImage.alt = photoLabel(photo);
        lightboxCount.textContent = `${activeIndex + 1} / ${photos.length}`;
        lightboxCaption.textContent = hasValue(photo.alt_text) ? photo.alt_text : "";
        lightboxCaption.hidden = !hasValue(photo.alt_text);
      }
      thumbnailButtons.forEach((button, buttonIndex) => {
        const isCurrent = buttonIndex === activeIndex;
        button.setAttribute("aria-pressed", String(isCurrent));
        if (isCurrent) button.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
      });
    };

    const closeLightbox = () => {
      if (!lightbox || lightbox.hidden) return;
      lightbox.hidden = true;
      document.body.classList.remove("lightbox-open");
      if (previousFocus?.isConnected) previousFocus.focus();
    };

    const openLightbox = () => {
      if (!photos.length || !lightbox) return;
      previousFocus = document.activeElement;
      lightbox.hidden = false;
      document.body.classList.add("lightbox-open");
      showPhoto(activeIndex);
      closeButton.focus();
    };

    const changePhoto = (direction) => showPhoto(activeIndex + direction);
    const bindSwipe = (element) => {
      if (!element) return;
      let touchStartX = 0;
      element.addEventListener("touchstart", (event) => {
        touchStartX = event.changedTouches[0].clientX;
      }, { passive: true });
      element.addEventListener("touchend", (event) => {
        const distance = event.changedTouches[0].clientX - touchStartX;
        if (Math.abs(distance) > 48) changePhoto(distance < 0 ? 1 : -1);
      }, { passive: true });
    };

    if (!photos.length) {
      galleryBento.classList.remove("single-photo");
      galleryBento.classList.add("is-empty");
      mainPhotoButton.hidden = true;
      photoEmpty.hidden = false;
      photoCount.hidden = true;
      previousButton.hidden = true;
      nextButton.hidden = true;
      previewContainer.hidden = true;
      thumbnailList.hidden = true;
      return;
    }

    galleryBento.classList.remove("is-empty");
    galleryBento.classList.toggle("single-photo", photos.length === 1);
    photoEmpty.hidden = true;
    mainPhotoButton.hidden = false;
    previousButton.hidden = photos.length < 2;
    nextButton.hidden = photos.length < 2;
    thumbnailList.hidden = false;
    thumbnailList.dataset.count = String(photos.length);
    previewContainer.replaceChildren();
    thumbnailList.replaceChildren();

    const previews = photos.slice(1, 4);
    previewContainer.dataset.count = String(previews.length);
    previews.forEach((photo, previewIndex) => {
      const preview = document.createElement("div");
      preview.className = "gallery-preview";
      const imageButton = document.createElement("button");
      imageButton.className = "gallery-preview-button";
      imageButton.type = "button";
      imageButton.setAttribute("aria-label", `Ampliar fotografia ${previewIndex + 2}`);
      const image = document.createElement("img");
      image.src = imageUrl(photo);
      image.alt = photoLabel(photo);
      image.loading = "lazy";
      image.addEventListener("error", () => {
        preview.hidden = true;
      }, { once: true });
      imageButton.append(image);
      imageButton.addEventListener("click", () => {
        showPhoto(previewIndex + 1);
        openLightbox();
      });
      preview.append(imageButton);

      if (previewIndex === previews.length - 1 && photos.length > 1) {
        const allButton = document.createElement("button");
        allButton.type = "button";
        allButton.className = "gallery-all-overlay";
        allButton.textContent = `Ver todas as ${photos.length} fotos`;
        allButton.addEventListener("click", openLightbox);
        preview.append(allButton);
      }
      previewContainer.append(preview);
    });
    previewContainer.hidden = previews.length === 0;
    thumbnailButtons = photos.map((photo, index) => {
      const button = document.createElement("button");
      button.className = "thumbnail-button";
      button.type = "button";
      button.setAttribute("aria-label", `Mostrar fotografia ${index + 1}`);
      button.setAttribute("aria-pressed", "false");
      if (index === photos.length - 1 && photos.length > 1) {
        button.classList.add("thumbnail-button--view-all");
        button.dataset.viewAllLabel = `Ver todas as fotos (${photos.length})`;
        button.setAttribute("aria-label", `Ver todas as fotos (${photos.length})`);
      }
      const image = document.createElement("img");
      image.src = imageUrl(photo);
      image.alt = "";
      image.loading = "lazy";
      image.addEventListener("error", () => {
        button.hidden = true;
      }, { once: true });
      button.append(image);
      button.addEventListener("click", () => {
        showPhoto(index);
        openLightbox();
      });
      thumbnailList.append(button);
      return button;
    });

    mainPhoto.addEventListener("error", () => {
      mainPhoto.hidden = true;
      photoEmpty.hidden = false;
      photoEmpty.textContent = "Não foi possível carregar esta fotografia.";
    }, { once: true });
    mainPhotoButton.addEventListener("click", openLightbox);
    previousButton.addEventListener("click", () => changePhoto(-1));
    nextButton.addEventListener("click", () => changePhoto(1));
    lightboxPrevious.addEventListener("click", () => changePhoto(-1));
    lightboxNext.addEventListener("click", () => changePhoto(1));
    closeButton.addEventListener("click", closeLightbox);
    lightbox.addEventListener("click", (event) => {
      if (event.target === lightbox) closeLightbox();
    });
    lightbox.addEventListener("keydown", (event) => {
      if (event.key !== "Tab") return;
      const focusable = [...lightbox.querySelectorAll("button:not([disabled])")];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
    document.addEventListener("keydown", (event) => {
      if (lightbox.hidden) return;
      if (event.key === "Escape") closeLightbox();
      if (event.key === "ArrowLeft") changePhoto(-1);
      if (event.key === "ArrowRight") changePhoto(1);
    });
    bindSwipe(document.querySelector("#gallery-swipe"));
    bindSwipe(document.querySelector("#lightbox-swipe"));
    showPhoto(0);
  }

  async function renderVideos(propertyId) {
    const section = document.querySelector("#property-videos-section");
    const container = document.querySelector("#property-videos");
    const message = document.querySelector("#video-message");
    container.replaceChildren();
    message.hidden = true;
    section.hidden = true;

    let videos;
    try {
      videos = await repository.listPublicVideos(propertyId);
    } catch (error) {
      if (repository.isMissingVideoTable(error) || String(error?.message || "").includes(window.PropertyVideos.migration)) {
        return;
      }
      section.hidden = false;
      message.textContent = "Não foi possível carregar os vídeos deste imóvel.";
      message.hidden = false;
      return;
    }
    if (!Array.isArray(videos) || videos.length === 0) return;

    let invalidCount = 0;
    videos.forEach((video) => {
      let parsed;
      try {
        parsed = window.PropertyVideos.parse(video.url);
      } catch (error) {
        invalidCount += 1;
        return;
      }

      const card = document.createElement("article");
      card.className = "property-video-card";
      card.dataset.platform = parsed.platform;
      const heading = document.createElement("h3");
      heading.textContent = parsed.label;
      card.append(heading);

      if (parsed.platform === "direct") {
        const player = document.createElement("video");
        player.controls = true;
        player.preload = "metadata";
        player.playsInline = true;
        player.src = parsed.url;
        player.setAttribute("aria-label", `Vídeo do imóvel: ${parsed.label}`);
        card.append(player);
      } else if (parsed.embedUrl) {
        const frame = document.createElement("iframe");
        frame.src = parsed.embedUrl;
        frame.title = `Vídeo do imóvel no ${parsed.label}`;
        frame.loading = "lazy";
        frame.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
        frame.allowFullscreen = true;
        frame.referrerPolicy = "strict-origin-when-cross-origin";
        card.append(frame);
      } else {
        const externalLink = document.createElement("a");
        externalLink.className = "video-external-link";
        externalLink.href = parsed.url;
        externalLink.target = "_blank";
        externalLink.rel = "noopener noreferrer";
        externalLink.textContent = `Assistir no ${parsed.label}`;
        card.append(externalLink);
      }
      container.append(card);
    });

    if (container.childElementCount) {
      section.hidden = false;
      if (invalidCount) {
        message.textContent = "Alguns links de vídeo cadastrados não puderam ser exibidos.";
        message.hidden = false;
      }
    } else if (invalidCount) {
      section.hidden = false;
      message.textContent = "Os links de vídeo cadastrados não são válidos para exibição.";
      message.hidden = false;
    }
  }

  function setContactLinks(property) {
    const message = `Olá! Tenho interesse no imóvel "${property.title}". Poderia me passar mais informações?`;
    const scheduleMessage = `Olá! Gostaria de agendar uma visita ao imóvel "${property.title}".`;
    const propertyLink = createWhatsAppLink(message);
    const scheduleLink = createWhatsAppLink(scheduleMessage);
    [
      "#header-whatsapp",
      "#property-whatsapp",
      "#mobile-whatsapp",
      "#floating-whatsapp"
    ].forEach((selector) => {
      const link = document.querySelector(selector);
      if (link) link.href = propertyLink;
    });
    ["#schedule-whatsapp", "#mobile-schedule"].forEach((selector) => {
      const link = document.querySelector(selector);
      if (link) link.href = scheduleLink;
    });
  }

  function showUnavailable(message) {
    const messageElement = document.querySelector("#load-error");
    const eyebrow = notFound.querySelector(".eyebrow");
    const heading = notFound.querySelector("h1");
    eyebrow.textContent = "Detalhes indisponíveis";
    heading.textContent = "Não foi possível abrir este imóvel.";
    loading.hidden = true;
    content.hidden = true;
    document.querySelector("#mobile-contact-bar").hidden = true;
    document.body.classList.remove("has-mobile-contact");
    notFound.hidden = false;
    if (messageElement && message) {
      messageElement.textContent = message;
      messageElement.hidden = false;
    }
  }

  async function loadProperty() {
    const id = new URLSearchParams(window.location.search).get("id");
    if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
      showUnavailable("O endereço do imóvel não é válido.");
      return;
    }

    try {
      const configured = await repository.ready;
      if (!configured) {
        showUnavailable("O catálogo está temporariamente indisponível. Tente novamente mais tarde.");
        return;
      }
      const property = await repository.getPublicProperty(id);
      if (!property || !hasValue(property.title)) {
        showUnavailable("Não foi possível localizar este imóvel no catálogo público.");
        return;
      }

      const title = document.querySelector("#property-title");
      const location = document.querySelector("#property-location");
      const price = document.querySelector("#property-price");
      const description = document.querySelector("#property-description");
      const locationText = getLocation(property);

      title.textContent = property.title;
      document.title = `${property.title} | Ewerton Imóveis`;
      renderBadges(property);
      location.textContent = locationText;
      location.hidden = !locationText;

      const formattedPrice = formatMoney(property.price);
      price.textContent = formattedPrice || "";
      price.hidden = !formattedPrice;

      if (hasValue(property.description)) {
        description.textContent = property.description.trim();
      } else {
        description.textContent = "Descrição não cadastrada para este imóvel.";
        description.classList.add("description-empty");
      }

      renderFacts(property);
      renderInformation(property);
      renderFeatures(property);
      renderGallery(property);
      setContactLinks(property);
      loading.hidden = true;
      content.hidden = false;
      content.classList.add("is-loaded");
      document.querySelector("#mobile-contact-bar").hidden = false;
      document.body.classList.add("has-mobile-contact");

      await renderVideos(property.id);
    } catch (error) {
      showUnavailable("Ocorreu um erro ao carregar o imóvel. Tente novamente mais tarde.");
    }
  }

  document.querySelector("#current-year").textContent = String(new Date().getFullYear());
  setReturnLink();
  setupHeader();
  setupSharing();
  loadProperty();
})();
