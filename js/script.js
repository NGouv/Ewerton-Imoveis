// Navegação, estado do cabeçalho, animações e fallbacks das imagens locais.
    (() => {
      const header = document.querySelector("#site-header");
      const menuToggle = document.querySelector(".menu-toggle");
      const navigation = document.querySelector("#primary-navigation");
      const floatingWhatsApp = document.querySelector(".floating-whatsapp");
      const hero = document.querySelector(".hero");
      const propertyTrack = document.querySelector("#property-track");
      const quickSearch = document.querySelector("#quick-search");
      const scrollCue = document.querySelector(".scroll-cue");
      const pagination = document.querySelector("#property-pagination");
      const paginationPages = document.querySelector("#pagination-pages");
      const pagePrevious = document.querySelector("#page-previous");
      const pageNext = document.querySelector("#page-next");
      const carouselStatus = document.querySelector(".carousel-status");
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
      let propertyCards = [...propertyTrack.querySelectorAll(".property-card")];
      const pageSize = 6;
      let matchingCards = propertyCards;
      let currentPage = 1;
      let activeFilters = { city: "", type: "", price: "" };

      const bindCardNavigation = (card) => {
        card.addEventListener("click", (event) => {
          if (event.target.closest("a, button")) return;
          window.location.href = card.dataset.href;
        });
        card.addEventListener("keydown", (event) => {
          if (event.target !== card) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            window.location.href = card.dataset.href;
          }
        });
      };
      propertyCards.forEach(bindCardNavigation);

      const filterProperties = () => {
        const normalize = (value) => String(value || "")
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          .toLocaleLowerCase("pt-BR").replace(/[^a-z0-9]+/g, " ").trim();
        matchingCards = propertyCards.filter((card) => {
          const matchesCity = !activeFilters.city || normalize(card.dataset.city) === normalize(activeFilters.city);
          const matchesType = !activeFilters.type || card.dataset.type === activeFilters.type;
          const matchesPrice = !activeFilters.price || card.dataset.price === activeFilters.price;
          return matchesCity && matchesType && matchesPrice;
        });
      };

      const renderPage = () => {
        const pageCount = Math.max(1, Math.ceil(matchingCards.length / pageSize));
        currentPage = Math.min(currentPage, pageCount);
        const firstIndex = (currentPage - 1) * pageSize;
        const lastIndex = Math.min(firstIndex + pageSize, matchingCards.length);
        const visibleCards = new Set(matchingCards.slice(firstIndex, lastIndex));

        propertyCards.forEach((card) => {
          card.hidden = !visibleCards.has(card);
        });

        paginationPages.replaceChildren();
        for (let page = 1; page <= pageCount; page += 1) {
          const button = document.createElement("button");
          button.className = "pagination-page";
          button.type = "button";
          button.textContent = String(page);
          button.setAttribute("aria-label", `Página ${page}`);
          if (page === currentPage) button.setAttribute("aria-current", "page");
          button.addEventListener("click", () => goToPage(page));
          paginationPages.append(button);
        }

        pagePrevious.disabled = currentPage === 1;
        pageNext.disabled = currentPage === pageCount;
        if (matchingCards.length) {
          carouselStatus.textContent = `Exibindo imóveis ${firstIndex + 1} a ${lastIndex} de ${matchingCards.length}. Página ${currentPage} de ${pageCount}.`;
        } else {
          carouselStatus.textContent = "Nenhum imóvel corresponde aos filtros selecionados.";
        }
      };

      const goToPage = (page) => {
        currentPage = page;
        renderPage();
        document.querySelector("#imoveis").scrollIntoView({
          behavior: reducedMotion.matches ? "auto" : "smooth",
          block: "start"
        });
      };

      pagePrevious.addEventListener("click", () => goToPage(currentPage - 1));
      pageNext.addEventListener("click", () => goToPage(currentPage + 1));
      renderPage();

      quickSearch.addEventListener("submit", (event) => {
        event.preventDefault();
        activeFilters = {
          city: quickSearch.elements.cidade.value,
          type: quickSearch.elements.tipo.value,
          price: quickSearch.elements.preco.value
        };
        filterProperties();
        currentPage = 1;
        renderPage();
        document.querySelector("#imoveis").scrollIntoView({
          behavior: reducedMotion.matches ? "auto" : "smooth",
          block: "start"
        });
      });

      document.addEventListener("ewerton:catalog-updated", () => {
        propertyCards = [...propertyTrack.querySelectorAll(".property-card")];
        propertyCards.forEach(bindCardNavigation);
        filterProperties();
        currentPage = 1;
        renderPage();
      });

      const updateScrollState = () => {
        const scrollY = window.scrollY;
        header.classList.toggle("is-scrolled", scrollY > 60);
        floatingWhatsApp.classList.toggle("is-visible", scrollY > hero.offsetHeight - 100);
        scrollCue.classList.toggle("is-hidden", scrollY > 60);
      };

      updateScrollState();
      window.addEventListener("scroll", updateScrollState, { passive: true });

      menuToggle.addEventListener("click", () => {
        const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
        menuToggle.setAttribute("aria-expanded", String(!isOpen));
        menuToggle.setAttribute("aria-label", isOpen ? "Abrir menu" : "Fechar menu");
        menuToggle.classList.toggle("is-open", !isOpen);
        navigation.classList.toggle("is-open", !isOpen);
      });

      navigation.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
          navigation.classList.remove("is-open");
          menuToggle.classList.remove("is-open");
          menuToggle.setAttribute("aria-expanded", "false");
          menuToggle.setAttribute("aria-label", "Abrir menu");
        });
      });

      document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape" || !navigation.classList.contains("is-open")) return;
        navigation.classList.remove("is-open");
        menuToggle.classList.remove("is-open");
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-label", "Abrir menu");
        menuToggle.focus();
      });

      document.querySelectorAll('a[href^="#"]').forEach((link) => {
        link.addEventListener("click", (event) => {
          const target = document.querySelector(link.getAttribute("href"));
          if (!target) return;
          event.preventDefault();
          target.scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth", block: "start" });
        });
      });

      document.querySelectorAll("img").forEach((image) => {
        image.addEventListener("error", () => {
          image.hidden = true;
        }, { once: true });
      });

      const objectiveChips = [...document.querySelectorAll(".objective-chip")];
      const contactWhatsapp = document.querySelector(".contact-whatsapp");
      let selectedObjective = "";

      const updateContactWhatsapp = () => {
        const messageByObjective = {
          comprar: "Olá Ewerton, gostaria de conversar sobre a compra de um imóvel em Americana/região.",
          alugar: "Olá Ewerton, gostaria de conversar sobre o aluguel de um imóvel em Americana/região.",
          vender: "Olá Ewerton, gostaria de conversar sobre a venda de um imóvel em Americana/região.",
          outro: "Olá Ewerton, gostaria de conversar sobre um imóvel em Americana/região."
        };
        const message = selectedObjective ? messageByObjective[selectedObjective] : messageByObjective.outro;
        contactWhatsapp.href = `https://wa.me/5519995188676?text=${encodeURIComponent(message)}`;
      };

      objectiveChips.forEach((chip) => {
        chip.addEventListener("click", () => {
          const isSelected = chip.classList.contains("is-selected");
          objectiveChips.forEach((item) => {
            item.classList.remove("is-selected");
            item.setAttribute("aria-pressed", "false");
          });
          selectedObjective = isSelected ? "" : chip.dataset.objective;
          if (!isSelected) {
            chip.classList.add("is-selected");
            chip.setAttribute("aria-pressed", "true");
          }
          updateContactWhatsapp();
        });
      });
      updateContactWhatsapp();

      const revealItems = document.querySelectorAll(".reveal");
      if (reducedMotion.matches || !("IntersectionObserver" in window)) {
        revealItems.forEach((item) => item.classList.add("is-revealed"));
      } else {
        const revealObserver = new IntersectionObserver((entries, observer) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-revealed");
              observer.unobserve(entry.target);
            }
          });
        }, { threshold: 0.12 });
        revealItems.forEach((item) => revealObserver.observe(item));
      }

      const currentYear = document.querySelector("#current-year");
      if (currentYear) currentYear.textContent = String(new Date().getFullYear());
    })();
