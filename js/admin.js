(() => {
  const repository = window.PropertyRepository;
  const authPage = document.querySelector("#auth-page");
  const appShell = document.querySelector("#app-shell");
  const loginForm = document.querySelector("#login-form");
  const loginMessage = document.querySelector("#login-message");
  const loginButton = document.querySelector("#login-button");
  const setupNotice = document.querySelector("#setup-notice");
  const panels = [...document.querySelectorAll(".view-panel")];
  const navItems = [...document.querySelectorAll(".nav-item")];
  const form = document.querySelector("#property-form");
  const formMessage = document.querySelector("#form-message");
  const imageList = document.querySelector("#image-list");
  const imageInput = document.querySelector("#image-files");
  const state = { properties: [], editingId: null, images: [], removedImages: [] };
  const statusLabels = { available: "Disponível", sold: "Vendido", rented: "Alugado" };
  const purposeLabels = { sale: "Venda", rent: "Aluguel" };

  const showToast = (message, isError) => {
    const region = document.querySelector("#toast-region");
    const toast = document.createElement("div");
    toast.className = `toast${isError ? " toast--error" : ""}`;
    toast.textContent = message;
    region.replaceChildren(toast);
    window.setTimeout(() => toast.remove(), 4200);
  };
  const setBusy = (button, busy, busyText) => {
    if (busy) {
      button.dataset.label = button.textContent;
      button.textContent = busyText;
      button.disabled = true;
    } else {
      button.textContent = button.dataset.label || button.textContent;
      button.disabled = false;
    }
  };
  const formatPrice = (value) => new Intl.NumberFormat("pt-BR", {
    style: "currency", currency: "BRL", maximumFractionDigits: 2
  }).format(Number(value) || 0);
  const formatDate = (value) => value
    ? new Intl.DateTimeFormat("pt-BR").format(new Date(value))
    : "—";
  const locationOf = (property) => [property.neighborhood, property.city].filter(Boolean).join(", ") || "Localização não informada";

  const setView = (name) => {
    panels.forEach((panel) => { panel.hidden = panel.id !== `view-${name}`; });
    navItems.forEach((item) => item.classList.toggle("is-active", item.dataset.view === name));
    const titles = { dashboard: "Visão geral", properties: "Imóveis", form: state.editingId ? "Editar imóvel" : "Cadastrar imóvel", settings: "Configurações" };
    document.querySelector("#page-title").textContent = titles[name] || "Painel";
    document.querySelector("#sidebar").classList.remove("is-open");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const showApp = (user) => {
    authPage.hidden = true;
    appShell.hidden = false;
    const email = user.email || "Conta administrativa";
    document.querySelector("#account-email").textContent = email;
    document.querySelector("#account-avatar").textContent = email.slice(0, 2).toUpperCase();
    document.querySelector("#settings-email").textContent = email;
    document.querySelector("#pending-banner").hidden = true;
    document.querySelector("#connection-state").classList.add("is-connected");
    document.querySelector("#connection-state").lastElementChild.textContent = "Conectado e autenticado";
  };

  const renderStats = () => {
    document.querySelector("#count-total").textContent = String(state.properties.length);
    document.querySelector("#count-available").textContent = String(state.properties.filter((item) => item.status === "available").length);
    document.querySelector("#count-sold").textContent = String(state.properties.filter((item) => item.status === "sold").length);
    document.querySelector("#count-rented").textContent = String(state.properties.filter((item) => item.status === "rented").length);
  };

  const createStatus = (status) => {
    const badge = document.createElement("span");
    badge.className = `status-badge status-badge--${status || "available"}`;
    badge.textContent = statusLabels[status] || "Indefinido";
    return badge;
  };

  const openProperty = (property) => {
    const images = [...(property.property_images || [])]
      .sort((a, b) => a.display_order - b.display_order);
    const cover = images.find((image) => image.is_cover) || images[0];
    const article = document.createElement("article");
    article.className = "recent-item";
    if (cover) {
      const image = document.createElement("img");
      image.src = repository.publicImageUrl(cover.storage_path);
      image.alt = "";
      article.append(image);
    } else {
      const placeholder = document.createElement("span");
      placeholder.className = "recent-placeholder";
      placeholder.textContent = "EI";
      article.append(placeholder);
    }
    const copy = document.createElement("div");
    copy.className = "recent-copy";
    const title = document.createElement("strong");
    title.textContent = property.title;
    const location = document.createElement("small");
    location.textContent = locationOf(property);
    copy.append(title, location);
    const price = document.createElement("b");
    price.textContent = formatPrice(property.price);
    article.append(copy, price);
    return article;
  };

  const renderRecent = () => {
    const recent = document.querySelector("#recent-properties");
    recent.replaceChildren();
    if (!state.properties.length) {
      recent.className = "empty-state";
      recent.textContent = "Nenhum imóvel cadastrado ainda.";
      return;
    }
    recent.className = "recent-list";
    state.properties.slice(0, 4).forEach((property) => recent.append(openProperty(property)));
  };

  const renderTable = () => {
    const body = document.querySelector("#property-rows");
    const search = document.querySelector("#property-search").value.trim().toLocaleLowerCase("pt-BR");
    const type = document.querySelector("#filter-type").value;
    const purpose = document.querySelector("#filter-purpose").value;
    const status = document.querySelector("#filter-status").value;
    const filtered = state.properties.filter((property) => {
      const text = `${property.title} ${property.city || ""} ${property.neighborhood || ""}`.toLocaleLowerCase("pt-BR");
      return (!search || text.includes(search)) &&
        (!type || property.property_type === type) &&
        (!purpose || property.purpose === purpose) &&
        (!status || property.status === status);
    });
    body.replaceChildren();
    if (!filtered.length) {
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      cell.colSpan = 6;
      cell.className = "table-empty";
      cell.textContent = state.properties.length ? "Nenhum imóvel corresponde aos filtros." : "Nenhum imóvel cadastrado.";
      row.append(cell);
      body.append(row);
    } else {
      filtered.forEach((property) => {
        const row = document.createElement("tr");
        const details = document.createElement("td");
        details.className = "property-cell";
        const images = [...(property.property_images || [])].sort((a, b) => a.display_order - b.display_order);
        const cover = images.find((image) => image.is_cover) || images[0];
        if (cover) {
          const image = document.createElement("img");
          image.src = repository.publicImageUrl(cover.storage_path);
          image.alt = "";
          details.append(image);
        } else {
          const placeholder = document.createElement("span");
          placeholder.className = "table-placeholder";
          placeholder.textContent = "EI";
          details.append(placeholder);
        }
        const copy = document.createElement("span");
        copy.className = "property-cell-copy";
        const title = document.createElement("strong");
        title.textContent = property.title;
        const location = document.createElement("small");
        location.textContent = `${property.property_type} · ${locationOf(property)}`;
        copy.append(title, location);
        details.append(copy);
        const purposeCell = document.createElement("td");
        purposeCell.textContent = purposeLabels[property.purpose] || "—";
        const priceCell = document.createElement("td");
        priceCell.className = "price-cell";
        priceCell.textContent = formatPrice(property.price);
        const statusCell = document.createElement("td");
        statusCell.append(createStatus(property.status));
        const dateCell = document.createElement("td");
        dateCell.textContent = formatDate(property.created_at);
        const actions = document.createElement("td");
        actions.className = "table-actions";
        const view = document.createElement("a");
        view.className = "text-button";
        view.href = `../imovel.html?id=${encodeURIComponent(property.id)}`;
        view.target = "_blank";
        view.rel = "noopener noreferrer";
        view.textContent = "Ver";
        const edit = document.createElement("button");
        edit.className = "text-button";
        edit.type = "button";
        edit.textContent = "Editar";
        edit.addEventListener("click", () => beginEdit(property));
        const remove = document.createElement("button");
        remove.className = "text-button text-button--danger";
        remove.type = "button";
        remove.textContent = "Excluir";
        remove.addEventListener("click", () => removeProperty(property));
        actions.append(view, edit, remove);
        row.append(details, purposeCell, priceCell, statusCell, dateCell, actions);
        body.append(row);
      });
    }
    document.querySelector("#list-count").textContent = `${filtered.length} de ${state.properties.length} imóveis`;
  };

  const refresh = async () => {
    state.properties = await repository.listAdminProperties();
    renderStats();
    renderRecent();
    renderTable();
  };

  const displayFormImages = () => {
    imageList.replaceChildren();
    if (!state.images.length) {
      const empty = document.createElement("p");
      empty.className = "muted";
      empty.textContent = "Nenhuma imagem selecionada.";
      imageList.append(empty);
      return;
    }
    state.images.forEach((image, index) => {
      const item = document.createElement("article");
      item.className = "image-item";
      const preview = document.createElement("img");
      preview.src = image.preview || repository.publicImageUrl(image.storage_path);
      preview.alt = "";
      const name = document.createElement("span");
      name.className = "image-name";
      name.textContent = image.file?.name || image.alt_text || `Imagem ${index + 1}`;
      const cover = document.createElement("label");
      cover.className = "cover-choice";
      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = "cover-index";
      radio.value = String(index);
      radio.checked = index === state.images.findIndex((entry) => entry.is_cover);
      radio.addEventListener("change", () => {
        state.images.forEach((entry, entryIndex) => { entry.is_cover = entryIndex === index; });
        displayFormImages();
      });
      cover.append(radio, document.createTextNode("Capa"));
      const controls = document.createElement("div");
      controls.className = "image-controls";
      [["↑", "Mover para cima", index - 1], ["↓", "Mover para baixo", index + 1]].forEach(([label, aria, target]) => {
        const button = document.createElement("button");
        button.className = "icon-button";
        button.type = "button";
        button.textContent = label;
        button.setAttribute("aria-label", aria);
        button.disabled = target < 0 || target >= state.images.length;
        button.addEventListener("click", () => {
          [state.images[index], state.images[target]] = [state.images[target], state.images[index]];
          displayFormImages();
        });
        controls.append(button);
      });
      const remove = document.createElement("button");
      remove.className = "text-button text-button--danger";
      remove.type = "button";
      remove.textContent = "Remover";
      remove.addEventListener("click", () => {
        const [removed] = state.images.splice(index, 1);
        if (removed.preview) URL.revokeObjectURL(removed.preview);
        if (removed.id) state.removedImages.push(removed);
        if (state.images.length && !state.images.some((entry) => entry.is_cover)) state.images[0].is_cover = true;
        displayFormImages();
      });
      item.append(preview, name, cover, controls, remove);
      imageList.append(item);
    });
  };

  const resetForm = () => {
    state.images.forEach((image) => {
      if (image.preview) URL.revokeObjectURL(image.preview);
    });
    form.reset();
    state.editingId = null;
    state.images = [];
    state.removedImages = [];
    formMessage.textContent = "";
    document.querySelector("#form-heading").textContent = "Cadastrar imóvel";
    document.querySelector("#save-property").textContent = "Salvar imóvel";
    displayFormImages();
  };

  const beginCreate = () => {
    resetForm();
    setView("form");
  };

  const beginEdit = (property) => {
    resetForm();
    state.editingId = property.id;
    document.querySelector("#form-heading").textContent = "Editar imóvel";
    document.querySelector("#save-property").textContent = "Salvar alterações";
    Object.entries(property).forEach(([name, value]) => {
      const field = form.elements.namedItem(name);
      if (field && field.type !== "checkbox" && value !== null && value !== undefined) field.value = value;
    });
    const privateAddressRow = property.property_private_addresses;
    const privateAddress = Array.isArray(privateAddressRow)
      ? privateAddressRow[0] || {}
      : privateAddressRow || {};
    ["postal_code", "address", "street_number", "complement"].forEach((name) => {
      form.elements.namedItem(name).value = privateAddress[name] || "";
    });
    const selectedFeatures = new Set(property.features || []);
    form.querySelectorAll('input[name="features"]').forEach((input) => { input.checked = selectedFeatures.has(input.value); });
    const knownFeatures = new Set([...form.querySelectorAll('input[name="features"]')].map((input) => input.value));
    form.elements.other_features.value = (property.features || []).filter((feature) => !knownFeatures.has(feature)).join(", ");
    state.images = [...(property.property_images || [])]
      .sort((a, b) => a.display_order - b.display_order)
      .map((image) => ({ ...image, is_cover: Boolean(image.is_cover) }));
    if (state.images.length && !state.images.some((image) => image.is_cover)) state.images[0].is_cover = true;
    displayFormImages();
    setView("form");
  };

  const removeProperty = async (property) => {
    if (!window.confirm(`Excluir "${property.title}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await repository.deleteProperty(property);
      await refresh();
      showToast("Imóvel excluído.");
    } catch (error) {
      showToast(`Não foi possível concluir a exclusão: ${error.message}`, true);
      try {
        await refresh();
      } catch (refreshError) {
        showToast(`Também não foi possível atualizar a listagem: ${refreshError.message}`, true);
      }
    }
  };

  const readForm = () => {
    const values = new FormData(form);
    const numeric = (name) => values.get(name) === "" || values.get(name) === null ? null : Number(values.get(name));
    const features = values.getAll("features").map(String);
    const otherFeatures = String(values.get("other_features") || "")
      .split(",").map((item) => item.trim()).filter(Boolean);
    return {
      id: state.editingId || undefined,
      title: String(values.get("title")).trim(),
      description: String(values.get("description") || "").trim() || null,
      property_type: String(values.get("property_type")),
      purpose: String(values.get("purpose")),
      status: String(values.get("status")),
      price: numeric("price"),
      condo_fee: numeric("condo_fee"),
      property_tax: numeric("property_tax"),
      state: String(values.get("state") || "").trim().toUpperCase() || null,
      city: String(values.get("city") || "").trim() || null,
      neighborhood: String(values.get("neighborhood") || "").trim() || null,
      private_address: {
        postal_code: String(values.get("postal_code") || "").trim() || null,
        address: String(values.get("address") || "").trim() || null,
        street_number: String(values.get("street_number") || "").trim() || null,
        complement: String(values.get("complement") || "").trim() || null
      },
      total_area: numeric("total_area"),
      private_area: numeric("private_area"),
      bedrooms: numeric("bedrooms"),
      suites: numeric("suites"),
      bathrooms: numeric("bathrooms"),
      parking_spaces: numeric("parking_spaces"),
      features: [...new Set([...features, ...otherFeatures])],
      is_published: true,
      cover_index: state.images.findIndex((image) => image.is_cover),
      removedImages: state.removedImages
    };
  };

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    loginMessage.textContent = "";
    try {
      await repository.ready;
    } catch (error) {
      loginMessage.textContent = error.message;
      return;
    }
    if (!repository.isConfigured) {
      loginMessage.textContent = "Configure a conexão Supabase antes de entrar.";
      return;
    }
    const email = loginForm.elements.email.value.trim();
    const password = loginForm.elements.password.value;
    setBusy(loginButton, true, "Verificando…");
    try {
      const user = await repository.auth.signIn(email, password);
      const authorizedUser = await repository.auth.getAuthorizedUser();
      if (!authorizedUser) {
        await repository.auth.signOut();
        throw new Error("Esta conta não está autorizada como administradora.");
      }
      await refresh();
      showApp(user);
      setView("dashboard");
    } catch (error) {
      loginMessage.textContent = error.message || "Não foi possível entrar. Verifique seus dados e tente novamente.";
    } finally {
      setBusy(loginButton, false);
    }
  });

  document.querySelector("#password-toggle").addEventListener("click", (event) => {
    const input = loginForm.elements.password;
    const isPassword = input.type === "password";
    input.type = isPassword ? "text" : "password";
    event.currentTarget.textContent = isPassword ? "Ocultar" : "Mostrar";
    event.currentTarget.setAttribute("aria-label", isPassword ? "Ocultar senha" : "Mostrar senha");
  });

  document.querySelector("#logout-button").addEventListener("click", async () => {
    try {
      await repository.auth.signOut();
      state.properties = [];
      appShell.hidden = true;
      authPage.hidden = false;
    } catch (error) {
      showToast(`Não foi possível sair da conta: ${error.message}`, true);
    }
  });

  navItems.forEach((item) => item.addEventListener("click", () => setView(item.dataset.view)));
  document.querySelectorAll("[data-view-link]").forEach((button) => button.addEventListener("click", () => setView(button.dataset.viewLink)));
  document.querySelectorAll('[data-action="new-property"]').forEach((button) => button.addEventListener("click", beginCreate));
  document.querySelectorAll('[data-action="cancel-form"]').forEach((button) => button.addEventListener("click", () => {
    resetForm();
    setView("properties");
  }));
  document.querySelector("#mobile-menu").addEventListener("click", () => document.querySelector("#sidebar").classList.toggle("is-open"));
  ["property-search", "filter-type", "filter-purpose", "filter-status"].forEach((id) => {
    document.querySelector(`#${id}`).addEventListener(id === "property-search" ? "input" : "change", renderTable);
  });

  imageInput.addEventListener("change", () => {
    const files = [...imageInput.files];
    const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
    for (const file of files) {
      if (!allowed.has(file.type)) {
        showToast(`${file.name}: formato não permitido. Use JPG, PNG ou WebP.`, true);
        continue;
      }
      if (file.size > 8 * 1024 * 1024) {
        showToast(`${file.name}: o arquivo excede o limite de 8 MB.`, true);
        continue;
      }
      state.images.push({
        file,
        preview: URL.createObjectURL(file),
        alt_text: "",
        is_cover: state.images.length === 0
      });
    }
    displayFormImages();
    imageInput.value = "";
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    formMessage.textContent = "";
    const button = document.querySelector("#save-property");
    const wasEditing = Boolean(state.editingId);
    setBusy(button, true, "Salvando…");
    try {
      await repository.saveProperty(readForm(), state.images);
      await refresh();
      resetForm();
      setView("properties");
      showToast(wasEditing ? "Imóvel atualizado." : "Imóvel cadastrado.");
    } catch (error) {
      formMessage.textContent = `Não foi possível salvar o imóvel: ${error.message}`;
    } finally {
      setBusy(button, false);
    }
  });

  repository.ready
    .then(async (configured) => {
      if (!configured) {
        setupNotice.hidden = false;
        setupNotice.textContent = "Painel bloqueado: configure SUPABASE_URL e SUPABASE_ANON_KEY em js/supabase-config.js. Nenhuma autenticação ou demonstração está sendo simulada.";
        document.querySelector("#connection-state").lastElementChild.textContent = "Configuração pendente";
        return;
      }
      document.querySelector("#connection-state").lastElementChild.textContent = "Credenciais configuradas";
      const session = await repository.auth.getSession();
        if (!session?.user) return;
        const user = await repository.auth.getAuthorizedUser();
        if (!user) {
          await repository.auth.signOut();
          loginMessage.textContent = "A sessão não pertence a uma conta administrativa autorizada.";
          return;
        }
        await refresh();
        showApp(user);
        setView("dashboard");
      })
      .catch((error) => {
        setupNotice.hidden = false;
        setupNotice.textContent = `Não foi possível iniciar a conexão: ${error.message}`;
        loginMessage.textContent = `Não foi possível validar a sessão: ${error.message}`;
      });
})();
