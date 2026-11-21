// Navegação, estado do cabeçalho, animações e fallbacks das imagens locais.
    (() => {
      const header = document.querySelector("#site-header");
      const menuToggle = document.querySelector(".menu-toggle");
      const navigation = document.querySelector("#primary-navigation");
      const floatingWhatsApp = document.querySelector(".floating-whatsapp");
      const hero = document.querySelector(".hero");
      const propertyTrack = document.querySelector("#property-track");
      const carouselPrevious = document.querySelector(".carousel-button--previous");
      const carouselNext = document.querySelector(".carousel-button--next");
      const carouselStatus = document.querySelector(".carousel-status");
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
      const propertyCards = [...propertyTrack.querySelectorAll(".property-card")];

      propertyCards.forEach((card) => {
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
      });

      const getCarouselStep = () => {
        const firstCard = propertyCards[0];
        const trackStyles = window.getComputedStyle(propertyTrack);
        const gap = Number.parseFloat(trackStyles.columnGap) || 0;
        return firstCard.getBoundingClientRect().width + gap;
      };

      const updateCarouselControls = () => {
        const maxScroll = propertyTrack.scrollWidth - propertyTrack.clientWidth;
        carouselPrevious.disabled = propertyTrack.scrollLeft <= 2;
        carouselNext.disabled = propertyTrack.scrollLeft >= maxScroll - 2;
        const activeIndex = Math.min(
          propertyCards.length - 1,
          Math.max(0, Math.round(propertyTrack.scrollLeft / getCarouselStep()))
        );
        carouselStatus.textContent = `Imóvel ${activeIndex + 1} de ${propertyCards.length}: ${propertyCards[activeIndex].querySelector(".property-title").textContent}`;
      };

      const scrollCarousel = (direction) => {
        propertyTrack.scrollBy({
          left: getCarouselStep() * direction,
          behavior: reducedMotion.matches ? "auto" : "smooth"
        });
      };

      carouselPrevious.addEventListener("click", () => scrollCarousel(-1));
      carouselNext.addEventListener("click", () => scrollCarousel(1));
      propertyTrack.addEventListener("scroll", () => window.requestAnimationFrame(updateCarouselControls), { passive: true });
      window.addEventListener("resize", updateCarouselControls);
      updateCarouselControls();

      const updateScrollState = () => {
        const scrollY = window.scrollY;
        header.classList.toggle("is-scrolled", scrollY > 60);
        floatingWhatsApp.classList.toggle("is-visible", scrollY > hero.offsetHeight - 100);
      };

      updateScrollState();
      window.addEventListener("scroll", updateScrollState, { passive: true });

      menuToggle.addEventListener("click", () => {
        const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
        menuToggle.setAttribute("aria-expanded", String(!isOpen));
        menuToggle.setAttribute("aria-label", isOpen ? "Abrir menu" : "Fechar menu");
        navigation.classList.toggle("is-open", !isOpen);
      });

      navigation.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
          navigation.classList.remove("is-open");
          menuToggle.setAttribute("aria-expanded", "false");
          menuToggle.setAttribute("aria-label", "Abrir menu");
        });
      });

      document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape" || !navigation.classList.contains("is-open")) return;
        navigation.classList.remove("is-open");
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

      document.querySelector("#current-year").textContent = String(new Date().getFullYear());
    })();
