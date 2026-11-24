(() => {
  const repository = window.PropertyRepository;
  const track = document.querySelector("#property-track");
  if (!repository || !track) return;

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
    card.dataset.status = property.status;
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
    const listingTag = document.createElement("span");
    listingTag.className = "catalog-tag";
    listingTag.textContent = "Publicado";
    imageWrap.append(cityTag, listingTag);

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
    [
      `${property.property_type} · ${property.purpose === "rent" ? "Aluguel" : "Venda"}`,
      `${property.private_area ?? property.total_area ?? "Área não informada"}${property.private_area || property.total_area ? " m²" : ""} · ${property.bedrooms ?? "Quartos não informados"} quartos`,
      statusLabel(property.status)
    ].forEach((value) => {
      const item = document.createElement("li");
      item.textContent = value;
      details.append(item);
    });
    const actions = document.createElement("div");
    actions.className = "property-actions";
    const detailLink = document.createElement("a");
    detailLink.className = "button details-button";
    detailLink.href = card.dataset.href;
    detailLink.textContent = "Ver imóvel";
    const whatsapp = document.createElement("a");
    whatsapp.className = "button property-button";
    whatsapp.href = `https://wa.me/5519995188676?text=${encodeURIComponent(`Olá! Tenho interesse no imóvel: ${property.title}.`)}`;
    whatsapp.target = "_blank";
    whatsapp.rel = "noopener noreferrer";
    whatsapp.textContent = "Tenho interesse";
    actions.append(detailLink, whatsapp);
    content.append(title, price, details, actions);
    card.append(imageWrap, content);
    return card;
  };
  const statusLabel = (status) => ({
    available: "Disponível",
    sold: "Vendido",
    rented: "Alugado"
  }[status] || "Status não informado");

  const appendCatalog = async () => {
    try {
      const properties = await repository.listPublicProperties();
      const published = properties.filter((property) => property.is_published);
      const quickSearch = document.querySelector("#quick-search");
      const sampleCards = [...track.querySelectorAll(".property-card")];
      published.forEach((property) => {
        addOption(quickSearch.elements.cidade, property.city, property.city);
        addOption(quickSearch.elements.tipo, property.property_type, property.property_type);
        track.append(makeCard(property));
      });
      if (published.length) {
        sampleCards.forEach((card) => {
          const label = document.createElement("span");
          label.className = "catalog-tag catalog-tag--sample";
          label.textContent = "Exemplo";
          card.querySelector(".property-image-wrap").append(label);
        });
        track.setAttribute("aria-label", "Imóveis publicados e exemplos demonstrativos");
        const notice = document.querySelector(".notice");
        if (notice) notice.textContent = "Os anúncios publicados abaixo refletem os dados cadastrados. Exemplos de apresentação são identificados separadamente.";
      }
      document.dispatchEvent(new CustomEvent("ewerton:catalog-updated"));
    } catch (error) {
      const status = document.querySelector(".carousel-status");
      if (status) status.textContent = `Não foi possível carregar os anúncios publicados: ${error.message}`;
    }
  };
  repository.ready
    .then((configured) => configured ? appendCatalog() : null)
    .catch((error) => {
      const status = document.querySelector(".carousel-status");
      if (status) status.textContent = `Não foi possível iniciar os anúncios publicados: ${error.message}`;
    });
})();
