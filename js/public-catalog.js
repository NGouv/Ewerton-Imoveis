(() => {
  const repository = window.PropertyRepository;
  const track = document.querySelector("#property-track");
  if (!repository || !track) return;
  const emptyState = document.querySelector("#catalog-empty");
  const errorState = document.querySelector("#catalog-error");

  const normalize = (value) => String(value || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR").replace(/[^a-z0-9]+/g, " ").trim();
  const priceBand = (price) => {
    const amount = Number(price);
    if (amount <= 300000) return "ate-300";
    if (amount <= 500000) return "300-500";
    return "acima-500";
  };
  const formatPrice = (price) => new Intl.NumberFormat("pt-BR", {
    style: "currency", currency: "BRL", maximumFractionDigits: 2
  }).format(Number(price) || 0);
  const featureIcons = {
    type: ["M3 10.5 12 3l9 7.5", "M5 9v11h14V9", "M9 20v-6h6v6"],
    bedrooms: ["M3 21V8m0 8h18v5M5 16v-3a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3m0 0v-2a2 2 0 0 1 2-2h3a3 3 0 0 1 3 3v1M21 21V10"],
    area: ["M4 4h16v16H4z", "M8 8h.01M16 8h.01M8 16h.01M16 16h.01"],
    bathrooms: ["M4 11h16", "M5 11v4a4 4 0 0 0 4 4h6a4 4 0 0 0 4-4v-4", "M7 11V6a2 2 0 0 1 4 0v2"],
    parking: ["M7 20V4h6a5 5 0 0 1 0 10H7"]
  };
  const makeIcon = (paths) => {
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("viewBox", "0 0 24 24");
    icon.setAttribute("fill", "none");
    icon.setAttribute("stroke", "currentColor");
    icon.setAttribute("stroke-width", "1.6");
    icon.setAttribute("stroke-linecap", "round");
    icon.setAttribute("stroke-linejoin", "round");
    icon.setAttribute("aria-hidden", "true");
    paths.forEach((pathData) => {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", pathData);
      icon.append(path);
    });
    return icon;
  };
  const createWhatsAppIcon = () => {
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("viewBox", "0 0 32 32");
    icon.setAttribute("fill", "currentColor");
    icon.setAttribute("aria-hidden", "true");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M16.04 3C8.88 3 3.06 8.82 3.06 15.98c0 2.3.6 4.53 1.74 6.5L3 29l6.69-1.75a12.93 12.93 0 0 0 6.34 1.65h.01c7.16 0 12.98-5.82 12.98-12.98A12.91 12.91 0 0 0 16.04 3Zm0 23.7h-.01c-1.94 0-3.84-.52-5.5-1.51l-.39-.23-3.97 1.04 1.06-3.87-.25-.4a10.7 10.7 0 1 1 9.06 4.97Zm5.88-8.02c-.32-.16-1.9-.94-2.2-1.05-.3-.1-.51-.16-.73.16-.22.33-.83 1.05-1.02 1.27-.18.21-.37.24-.69.08-.32-.16-1.36-.5-2.6-1.6-.96-.85-1.6-1.9-1.8-2.22-.19-.33-.02-.5.14-.66.15-.14.32-.38.49-.57.16-.19.21-.33.32-.55.1-.22.05-.41-.03-.57-.08-.16-.73-1.75-1-2.4-.26-.63-.53-.54-.73-.55h-.62c-.22 0-.57.08-.86.41-.3.32-1.13 1.1-1.13 2.68s1.16 3.1 1.32 3.31c.16.22 2.28 3.48 5.52 4.88.77.33 1.37.53 1.84.68.77.25 1.47.21 2.02.13.62-.1 1.9-.78 2.17-1.53.27-.76.27-1.4.19-1.53-.08-.14-.3-.22-.62-.38Z");
    icon.append(path);
    return icon;
  };
  const addOption = (select, value, label) => {
    if (!value || [...select.options].some((option) => normalize(option.value) === normalize(value))) return;
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    select.append(option);
  };
  const makeCard = (property) => {
    const images = [...(property.property_images || [])]
      .sort((a, b) => a.display_order - b.display_order);
    const cover = images.find((image) => image.is_cover) || images[0];
    const location = [property.neighborhood, property.city, property.state].filter(Boolean).join(" · ") || "Localização não informada";
    const card = document.createElement("article");
    card.className = "property-card reveal is-revealed";
    card.tabIndex = 0;
    card.setAttribute("role", "link");
    card.dataset.href = `./imovel.html?id=${encodeURIComponent(property.id)}`;
    card.dataset.city = property.city || "";
    card.dataset.type = property.property_type;
    card.dataset.price = priceBand(property.price);
    card.setAttribute("aria-label", `Ver detalhes: ${property.title}`);

    const imageWrap = document.createElement("div");
    imageWrap.className = "property-image-wrap";
    if (cover) {
      const image = document.createElement("img");
      image.className = "property-image";
      image.src = repository.publicImageUrl(cover.storage_path);
      image.alt = cover.alt_text || property.title;
      image.loading = "lazy";
      imageWrap.append(image);
    } else {
      const placeholder = document.createElement("div");
      placeholder.className = "property-image property-image--empty";
      placeholder.textContent = "Imagem não cadastrada";
      imageWrap.append(placeholder);
    }
    const cityTag = document.createElement("span");
    cityTag.className = "city-tag";
    cityTag.textContent = location;
    imageWrap.append(cityTag);
    const purposeLabels = { sale: "Venda", rent: "Locação" };
    const purposeTag = document.createElement("span");
    purposeTag.className = "purpose-tag";
    purposeTag.textContent = purposeLabels[property.purpose] || "";
    if (purposeTag.textContent) imageWrap.append(purposeTag);

    const content = document.createElement("div");
    content.className = "property-content";
    const title = document.createElement("h3");
    title.className = "property-title";
    title.textContent = property.title;
    const price = document.createElement("p");
    price.className = "property-price";
    price.textContent = formatPrice(property.price);
    const details = document.createElement("ul");
    details.className = "property-features";
    const numberFormat = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });
    [
      { value: property.property_type, label: "", icon: "type" },
      { value: property.bedrooms, label: "Quartos", icon: "bedrooms" },
      { value: property.private_area ?? property.total_area, label: "m²", icon: "area" },
      { value: property.bathrooms, label: "Banheiros", icon: "bathrooms" },
      { value: property.parking_spaces, label: "Vagas", icon: "parking" }
    ].filter((feature) => feature.value !== null && feature.value !== undefined && feature.value !== "")
      .forEach((feature) => {
        const item = document.createElement("li");
        item.className = "property-feature";
        item.append(makeIcon(featureIcons[feature.icon]));
        const value = Number(feature.value);
        const text = document.createElement("span");
        text.className = "property-feature-text";
        const formattedValue = Number.isFinite(value) ? numberFormat.format(value) : feature.value;
        text.textContent = feature.label ? `${formattedValue} ${feature.label}` : formattedValue;
        item.append(text);
        details.append(item);
      });
    details.hidden = details.childElementCount === 0;
    const actions = document.createElement("div");
    actions.className = "property-actions";
    const detailLink = document.createElement("a");
    detailLink.className = "button details-button";
    detailLink.href = card.dataset.href;
    detailLink.textContent = "Ver imóvel";
    const whatsapp = document.createElement("a");
    whatsapp.className = "button property-button";
    whatsapp.setAttribute("aria-label", `Conversar no WhatsApp sobre ${property.title}`);
    whatsapp.href = `https://wa.me/5519995188676?text=${encodeURIComponent(`Olá! Tenho interesse no imóvel: ${property.title}.`)}`;
    whatsapp.target = "_blank";
    whatsapp.rel = "noopener noreferrer";
    whatsapp.append(createWhatsAppIcon(), document.createTextNode("WhatsApp"));
    actions.append(detailLink, whatsapp);
    content.append(title, price, details, actions);
    card.append(imageWrap, content);
    return card;
  };

  const appendCatalog = async () => {
    try {
      const properties = await repository.listPublicProperties();
      const published = properties.filter((property) => property.is_published);
      const quickSearch = document.querySelector("#quick-search");
      published.forEach((property) => {
        addOption(quickSearch.elements.cidade, property.city, property.city);
        addOption(quickSearch.elements.tipo, property.property_type, property.property_type);
        track.append(makeCard(property));
      });
      if (!published.length) emptyState.textContent = "No momento, não há imóveis publicados. Entre em contato para receber atendimento.";
      errorState.hidden = true;
      document.dispatchEvent(new CustomEvent("ewerton:catalog-updated"));
    } catch (error) {
      emptyState.hidden = true;
      errorState.hidden = false;
      errorState.textContent = `Não foi possível carregar os imóveis publicados: ${error.message}`;
    }
  };
  repository.ready
    .then((configured) => {
      if (configured) return appendCatalog();
      emptyState.hidden = true;
      errorState.hidden = false;
      errorState.textContent = "O catálogo está temporariamente indisponível. Tente novamente mais tarde.";
      return null;
    })
    .catch((error) => {
      emptyState.hidden = true;
      errorState.hidden = false;
      errorState.textContent = `Não foi possível iniciar o catálogo: ${error.message}`;
    });
})();
