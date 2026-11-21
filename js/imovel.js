// Os dados do catálogo ficam juntos; campos sem informação permanecem identificados.
    const properties = {
      "apartamento-sacada-gourmet": {
        folder: "imovel-1",
        code: "IMÓVEL 01",
        title: "Apartamento com sacada gourmet",
        location: "Santa Bárbara d’Oeste – SP",
        price: "R$ 435.000",
        stats: [
          ["2", "dormitórios"],
          ["1 suíte", "suítes"],
          ["Não informado", "banheiros"],
          ["2", "vagas"],
          ["57 m²", "área privativa"],
          ["Não informado", "área do terreno"]
        ],
        description: "Exemplo ilustrativo de apartamento com 57 m², dois dormitórios, sendo uma suíte, móveis planejados e sacada gourmet. O exemplo também apresenta vista livre, elevador, fechadura eletrônica e duas vagas de garagem. Aceita financiamento.",
        features: [
          "57 m²",
          "2 dormitórios, sendo 1 suíte",
          "Móveis planejados e sacada gourmet",
          "Vista livre, elevador e fechadura eletrônica",
          "2 vagas de garagem",
          "Aceita financiamento"
        ],
        condoTitle: "Condomínio",
        condo: ["Piscina", "Academia", "Quadra", "Portaria 24h"],
        gallery: [
          ["sala-estar.jpg", "Sala de estar integrada"],
          ["sala-jantar.jpg", "Sala de jantar"],
          ["cozinha.jpg", "Cozinha"],
          ["quarto-1.jpg", "Dormitório"],
          ["suite.jpg", "Suíte"],
          ["banheiro.jpg", "Banheiro"],
          ["sacada.jpg", "Sacada gourmet"],
          ["fachada.jpg", "Fachada do edifício"],
          ["area-lazer.jpg", "Área de lazer do condomínio"]
        ]
      },
      "apartamento-sacada-elevador": {
        folder: "imovel-2",
        code: "IMÓVEL 02",
        title: "Apartamento com sacada e elevador",
        location: "Americana – SP",
        price: "R$ 265.000",
        stats: [
          ["2", "dormitórios"],
          ["Não informado", "suítes"],
          ["Não informado", "banheiros"],
          ["Não informado", "vagas"],
          ["Não informado", "área privativa"],
          ["Não informado", "área do terreno"]
        ],
        description: "Exemplo ilustrativo de apartamento com dois dormitórios, móveis planejados e sacada. O exemplo informa elevador, garagem coberta e condomínio com piscina, salão de festas, playground, quiosque com churrasqueira, mini mercado 24h e portaria 24h. Aceita financiamento.",
        features: [
          "2 dormitórios",
          "Móveis planejados e sacada",
          "Elevador e garagem coberta",
          "Aceita financiamento"
        ],
        condoTitle: "Condomínio",
        condo: [
          "Piscina e salão de festas",
          "Playground",
          "Quiosque com churrasqueira",
          "Mini mercado 24h",
          "Portaria 24h"
        ],
        gallery: [
          ["sala-estar.jpg", "Sala de estar com interiores planejados"],
          ["sala-jantar.jpg", "Sala de jantar"],
          ["cozinha.jpg", "Cozinha"],
          ["quarto-1.jpg", "Dormitório"],
          ["quarto-2.jpg", "Segundo dormitório"],
          ["banheiro.jpg", "Banheiro"],
          ["sacada.jpg", "Sacada"],
          ["fachada.jpg", "Fachada do edifício"],
          ["area-lazer.jpg", "Área de lazer do condomínio"]
        ]
      },
      "casa-tres-dormitorios": {
        folder: "imovel-3",
        code: "IMÓVEL 03",
        title: "Casa com três dormitórios",
        location: "Parque da Liberdade",
        price: "R$ 399.900",
        stats: [
          ["3", "dormitórios"],
          ["1 suíte", "suítes"],
          ["Não informado", "banheiros"],
          ["2", "vagas"],
          ["99 m²", "área construída"],
          ["150 m²", "área do terreno"]
        ],
        description: "Exemplo ilustrativo de casa no Parque da Liberdade, com terreno de 150 m² e 99 m² de área construída. A descrição de exemplo inclui três dormitórios, sendo uma suíte com planejados, sala de estar e jantar, área de luz, lavanderia nos fundos e vaga para dois carros. Aceita financiamento.",
        features: [
          "Terreno de 150 m² e área construída de 99 m²",
          "3 dormitórios, sendo 1 suíte com planejados",
          "Sala de estar e jantar",
          "Área de luz e lavanderia nos fundos",
          "Vaga para 2 carros",
          "Aceita financiamento"
        ],
        condoTitle: "Informações adicionais",
        condo: ["Não informado nesta prévia."],
        gallery: [
          ["fachada.jpg", "Fachada da casa"],
          ["sala-estar.jpg", "Sala de estar"],
          ["sala-jantar.jpg", "Sala de jantar"],
          ["cozinha.jpg", "Cozinha"],
          ["quarto-1.jpg", "Dormitório"],
          ["quarto-2.jpg", "Segundo dormitório"],
          ["suite.jpg", "Suíte"],
          ["banheiro.jpg", "Banheiro"],
          ["area-externa.jpg", "Área externa e garagem"]
        ]
      }
    };

    (() => {
      const property = properties[new URLSearchParams(window.location.search).get("id")];
      const content = document.querySelector("#property-content");
      const notFound = document.querySelector("#not-found");
      document.querySelector("#current-year").textContent = String(new Date().getFullYear());

      if (!property) {
        notFound.hidden = false;
        document.title = "Imóvel não encontrado | Ewerton Imóveis";
        return;
      }

      content.hidden = false;
      document.title = `${property.title} | Ewerton Imóveis`;
      document.querySelector("#breadcrumb-title").textContent = property.title;
      document.querySelector("#property-title").textContent = property.title;
      document.querySelector("#property-location").textContent = property.location;
      document.querySelector("#property-price").textContent = property.price;
      document.querySelector("#property-code").textContent = property.code;
      document.querySelector("#property-description").textContent = property.description;
      document.querySelector("#condo-heading").textContent = property.condoTitle;

      const stats = document.querySelector("#property-stats");
      property.stats.forEach(([value, label]) => {
        const item = document.createElement("div");
        item.className = "stat";
        item.innerHTML = `<span class="stat-value"></span><span class="stat-label"></span>`;
        item.querySelector(".stat-value").textContent = value;
        item.querySelector(".stat-label").textContent = label;
        stats.append(item);
      });

      const addListItems = (target, values) => {
        values.forEach((value) => {
          const item = document.createElement("li");
          item.textContent = value;
          target.append(item);
        });
      };

      addListItems(document.querySelector("#property-features"), property.features);
      addListItems(document.querySelector("#property-condo"), property.condo);

      const gallery = property.gallery.map(([file, label]) => ({
        src: `./assets/img/imoveis/${property.folder}/${file}`,
        alt: `Imagem ilustrativa: ${label.toLocaleLowerCase("pt-BR")}`,
        label
      }));
      const mainPhoto = document.querySelector("#main-photo");
      const photoCount = document.querySelector("#photo-count");
      const photoCaption = document.querySelector("#photo-caption");
      const thumbnails = document.querySelector("#thumbnail-list");
      const lightbox = document.querySelector("#lightbox");
      const lightboxImage = document.querySelector("#lightbox-image");
      let activeIndex = 0;
      let lightboxReturnFocus = null;
      let touchStartX = null;

      const thumbnailButtons = gallery.map((photo, index) => {
        const button = document.createElement("button");
        const image = document.createElement("img");
        button.className = "thumbnail";
        button.type = "button";
        button.setAttribute("aria-label", `Mostrar fotografia ${index + 1}: ${photo.label}`);
        button.setAttribute("aria-pressed", "false");
        image.src = photo.src;
        image.alt = "";
        image.loading = "lazy";
        button.append(image);
        button.addEventListener("click", () => showPhoto(index));
        thumbnails.append(button);
        return button;
      });

      const showPhoto = (index) => {
        activeIndex = (index + gallery.length) % gallery.length;
        const photo = gallery[activeIndex];
        mainPhoto.src = photo.src;
        mainPhoto.alt = photo.alt;
        photoCaption.textContent = photo.label;
        photoCount.textContent = `${activeIndex + 1} de ${gallery.length} fotos`;
        thumbnailButtons.forEach((button, buttonIndex) => {
          button.setAttribute("aria-pressed", String(buttonIndex === activeIndex));
        });
        const selectedThumbnail = thumbnailButtons[activeIndex];
        const thumbnailRailRect = thumbnails.getBoundingClientRect();
        const selectedThumbnailRect = selectedThumbnail.getBoundingClientRect();
        thumbnails.scrollTo({
          left: thumbnails.scrollLeft + selectedThumbnailRect.left - thumbnailRailRect.left -
            (thumbnails.clientWidth - selectedThumbnailRect.width) / 2,
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"
        });
        if (!lightbox.hidden) {
          lightboxImage.src = photo.src;
          lightboxImage.alt = photo.alt;
          document.querySelector("#lightbox-count").textContent = `${activeIndex + 1} de ${gallery.length} fotos`;
          document.querySelector("#lightbox-caption").textContent = photo.label;
        }
      };

      const openLightbox = () => {
        lightboxReturnFocus = document.activeElement;
        lightbox.hidden = false;
        document.body.style.overflow = "hidden";
        showPhoto(activeIndex);
        document.querySelector("#close-lightbox").focus();
      };

      const closeLightbox = () => {
        lightbox.hidden = true;
        document.body.style.overflow = "";
        if (lightboxReturnFocus instanceof HTMLElement) lightboxReturnFocus.focus();
      };

      document.querySelector("#photo-previous").addEventListener("click", () => showPhoto(activeIndex - 1));
      document.querySelector("#photo-next").addEventListener("click", () => showPhoto(activeIndex + 1));
      document.querySelector("#open-lightbox").addEventListener("click", openLightbox);
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
          const deltaX = event.changedTouches[0].clientX - touchStartX;
          if (Math.abs(deltaX) > 45) showPhoto(activeIndex + (deltaX < 0 ? 1 : -1));
          touchStartX = null;
        }, { passive: true });
      };

      bindSwipe(document.querySelector("#gallery-swipe"));
      bindSwipe(document.querySelector("#lightbox-swipe"));
      document.querySelector("#property-whatsapp").href =
        `https://wa.me/5519995188676?text=${encodeURIComponent(`Olá! Tenho interesse no imóvel ${property.code}: ${property.title}.`)}`;
      document.querySelector("#header-whatsapp").href =
        `https://wa.me/5519995188676?text=${encodeURIComponent(`Olá! Gostaria de conversar sobre o imóvel ${property.code}: ${property.title}.`)}`;

      showPhoto(0);

      const revealItems = [
        document.querySelector(".property-heading"),
        document.querySelector(".detail-layout"),
        ...document.querySelectorAll(".detail-section"),
        document.querySelector(".condo-card")
      ].filter(Boolean);
      revealItems.forEach((item) => item.classList.add("reveal"));

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
        revealItems.forEach((item) => item.classList.add("is-revealed"));
      } else {
        const revealObserver = new IntersectionObserver((entries, observer) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-revealed");
            observer.unobserve(entry.target);
          });
        }, { threshold: 0.12 });
        revealItems.forEach((item) => revealObserver.observe(item));
      }
    })();
