(() => {
  "use strict";
  const WHATSAPP = "56950187327";
  const STORAGE_KEY = "frame-pvc-solicitud-v2";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const money = (value) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(Number(value) || 0);
  const clean = (value = "") => String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
  const slugType = (text) => ["corredera", "proyectante", "fija", "puerta"].find((type) => clean(text).includes(type)) || "";

  function accessoryCategory(item) {
    const category = clean(item.categoria);
    if (category.includes("perfil")) return "perfiles";
    if (category.includes("manilla")) return "manillas";
    if (category.includes("cremona")) return "cremonas";
    if (category.includes("refuerzo") || category.includes("cerradero")) return "refuerzos";
    return "accesorios";
  }
  function normalizeWindowProduct(item) {
    return { id: `window-${item.id}`, sourceId: item.id, group: "VENTANAS", category: "ventanas", categoryLabel: "Ventanas", type: slugType(item.modelo), name: item.modelo, detail: "Ventana PVC termopanel lista para entrega", price: Number(item.precio), image: item.imagen, width: Math.round(Number(item.ancho) * 100), height: Math.round(Number(item.alto) * 100), color: clean(item.modelo).includes("blanca") ? "blanco" : "", availability: "stock" };
  }
  function normalizeAccessoryProduct(item) {
    const category = accessoryCategory(item);
    const label = { perfiles: "Perfiles PVC", manillas: "Manillas", cremonas: "Cremonas", refuerzos: "Refuerzos y cerraderos", accesorios: "Accesorios" }[category];
    return { id: `accessory-${item.id}`, sourceId: item.id, group: category === "perfiles" ? "PERFILES" : "ACCESORIOS", category, categoryLabel: label, type: slugType(`${item.categoria} ${item.nombre}`), name: item.nombre, detail: item.detalle, price: Number(item.precio), image: item.imagen, width: null, height: null, color: clean(item.nombre).includes("blanc") ? "blanco" : "", availability: "stock" };
  }
  const products = [...(window.STOCK_VENTANAS || []).map(normalizeWindowProduct), ...(window.STOCK_ACCESORIOS || []).map(normalizeAccessoryProduct)];
  const categoryLabels = { ventanas: "Ventanas", perfiles: "Perfiles PVC", manillas: "Manillas", cremonas: "Cremonas", refuerzos: "Refuerzos", accesorios: "Accesorios" };
  const state = { query: "", categories: new Set(), types: new Set(), colors: new Set(), availability: new Set(), maxPrice: 400000, widthMin: 0, heightMin: 0, sort: "relevance", cart: loadCart(), config: { type: "corredera", color: "blanco", width: 120, height: 120 } };

  function loadCart() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!Array.isArray(saved)) return [];
      return saved.filter((i) => i && typeof i.id === "string" && Number.isFinite(Number(i.price))).map((i) => ({ id: i.id, group: String(i.group || "PRODUCTOS"), name: String(i.name || "Producto"), detail: String(i.detail || ""), price: Number(i.price), image: String(i.image || ""), qty: Math.max(1, Math.min(99, Number(i.qty) || 1)) }));
    } catch { return []; }
  }
  function saveCart() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.cart)); } catch { /* Storage can be unavailable in private mode. */ } }
  function searchable(product) { return clean([product.name, product.categoryLabel, product.detail, product.type, product.color, product.width && `${product.width} ${product.height} ${product.width}x${product.height}`].filter(Boolean).join(" ")); }
  function matchesQuery(product) { return clean(state.query).split(/\s+/).filter(Boolean).every((term) => searchable(product).includes(term)); }
  function filteredProducts() {
    const filtered = products.filter((p) => matchesQuery(p) && (!state.categories.size || state.categories.has(p.category)) && (!state.types.size || state.types.has(p.type)) && (!state.colors.size || state.colors.has(p.color)) && (!state.availability.size || state.availability.has(p.availability)) && p.price <= state.maxPrice && (!state.widthMin || (p.width && p.width >= state.widthMin)) && (!state.heightMin || (p.height && p.height >= state.heightMin)));
    return filtered.sort((a, b) => state.sort === "price-asc" ? a.price - b.price : state.sort === "price-desc" ? b.price - a.price : state.sort === "name" ? a.name.localeCompare(b.name, "es") : state.sort === "measure" ? (a.width || Infinity) - (b.width || Infinity) : products.indexOf(a) - products.indexOf(b));
  }
  function productCard(p) {
    const measure = p.width ? `${p.width} × ${p.height} cm` : "";
    return `<article class="product-card"><div class="product-image"><img src="${escapeHtml(p.image)}" width="420" height="336" loading="lazy" alt="${escapeHtml(p.name)}"><span class="stock-tag">En stock</span></div><div class="product-body"><span class="product-category">${escapeHtml(p.categoryLabel)}</span><h3>${escapeHtml(p.name)}</h3><p class="product-detail">${escapeHtml(p.detail)}</p><div class="product-specs">${measure ? `<span>${escapeHtml(measure)}</span>` : ""}${p.color ? `<span>${escapeHtml(p.color)}</span>` : ""}</div><div class="product-buy"><strong class="product-price">${money(p.price)}</strong><button class="add-button" type="button" data-add="${escapeHtml(p.id)}" aria-label="Agregar ${escapeHtml(p.name)} a mi solicitud">+</button></div></div></article>`;
  }
  function renderProducts() {
    const shown = filteredProducts();
    $("#product-grid").innerHTML = shown.map(productCard).join("");
    $("#results-count").textContent = `${shown.length} ${shown.length === 1 ? "producto" : "productos"}`;
    $("#empty-state").hidden = shown.length !== 0;
    renderActiveFilters();
  }
  function renderActiveFilters() {
    const labels = [...state.categories].map((v) => ({ type: "category", value: v, label: categoryLabels[v] })).concat([...state.types].map((v) => ({ type: "type", value: v, label: v })), [...state.colors].map((v) => ({ type: "color", value: v, label: v })));
    if (state.query) labels.unshift({ type: "query", value: state.query, label: `“${state.query}”` });
    $("#active-filters").innerHTML = labels.map((x) => `<button type="button" data-remove-filter="${escapeHtml(x.type)}" data-value="${escapeHtml(x.value)}">${escapeHtml(x.label)} ×</button>`).join("");
    const count = labels.length + state.availability.size + (state.maxPrice < 400000 ? 1 : 0) + (state.widthMin ? 1 : 0) + (state.heightMin ? 1 : 0);
    $("#filter-badge").hidden = count === 0; $("#filter-badge").textContent = count;
  }
  function setCategory(category) {
    state.categories.clear(); if (category !== "todos") state.categories.add(category);
    $$('[name="category"]').forEach((input) => { input.checked = state.categories.has(input.value); });
    $$(".nav-chip[data-category]").forEach((el) => el.classList.toggle("is-active", el.dataset.category === category));
    renderProducts(); $("#catalogo").scrollIntoView({ behavior: "smooth" }); closePanels();
  }
  function resetFilters() {
    state.query = ""; state.categories.clear(); state.types.clear(); state.colors.clear(); state.availability.clear(); state.maxPrice = 400000; state.widthMin = 0; state.heightMin = 0; state.sort = "relevance";
    $("#search-input").value = ""; $("#search-clear").hidden = true; $$("#filters input[type=checkbox]").forEach((i) => i.checked = false); $("#price-range").value = 400000; $("#price-output").textContent = money(400000); $("#width-min").value = ""; $("#height-min").value = ""; $("#sort-select").value = "relevance"; $$(".nav-chip[data-category]").forEach((el) => el.classList.toggle("is-active", el.dataset.category === "todos")); renderProducts();
  }
  function cartCount() { return state.cart.reduce((sum, item) => sum + item.qty, 0); }
  function addCart(item) { const found = state.cart.find((entry) => entry.id === item.id); if (found) found.qty = Math.min(99, found.qty + 1); else state.cart.push({ ...item, qty: 1 }); saveCart(); renderCart(); toast(`${item.name} agregado`); }
  function renderCart() {
    const count = cartCount(); $$('[data-cart-count]').forEach((el) => el.textContent = count);
    if (!state.cart.length) $("#cart-items").innerHTML = '<div class="cart-empty"><div><h3>Tu solicitud está vacía</h3><p>Agrega productos o configura una ventana a medida.</p></div></div>';
    else $("#cart-items").innerHTML = state.cart.map((item) => `<article class="cart-item">${item.image ? `<img src="${escapeHtml(item.image)}" width="65" height="65" alt="">` : '<div class="window-thumb">▦</div>'}<div><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.detail)}</p><strong>${money(item.price * item.qty)}</strong><div class="qty"><button type="button" data-qty="-1" data-cart-id="${escapeHtml(item.id)}" aria-label="Disminuir">−</button><span>${item.qty}</span><button type="button" data-qty="1" data-cart-id="${escapeHtml(item.id)}" aria-label="Aumentar">+</button></div></div><button class="remove-item" type="button" data-remove-cart="${escapeHtml(item.id)}" aria-label="Eliminar ${escapeHtml(item.name)}">×</button></article>`).join("");
    const total = state.cart.reduce((sum, item) => sum + item.price * item.qty, 0); $("#cart-total").textContent = money(total);
    const link = $("#cart-whatsapp"); link.classList.toggle("is-disabled", !count); link.setAttribute("aria-disabled", String(!count)); link.href = count ? `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(cartMessage())}` : "#";
  }
  function cartMessage() {
    const groups = [...new Set(state.cart.map((i) => i.group))]; const lines = ["Hola, quiero realizar la siguiente solicitud en FRAME PVC DEPOT:", ""];
    groups.forEach((group) => { lines.push(group, ""); state.cart.filter((i) => i.group === group).forEach((i) => { lines.push(`${i.qty} × ${i.name}`, i.detail, money(i.price * i.qty), ""); }); });
    lines.push("TOTAL REFERENCIAL", money(state.cart.reduce((s, i) => s + i.price * i.qty, 0)), "", "Quisiera confirmar disponibilidad y condiciones."); return lines.filter((line, index, all) => line || all[index - 1]).join("\n");
  }
  function openPanel(name) { closePanels(); $("#overlay").hidden = false; document.body.classList.add("is-locked"); const panels = { cart: $("#cart-drawer"), filters: $("#filters"), sections: $("#sections-drawer") }; const panel = panels[name]; panel.classList.add("is-open"); panel.setAttribute("aria-hidden", "false"); setTimeout(() => $(".icon-close", panel)?.focus(), 50); }
  function closePanels() { $("#overlay").hidden = true; document.body.classList.remove("is-locked"); [$("#cart-drawer"), $("#filters"), $("#sections-drawer")].forEach((panel) => { panel.classList.remove("is-open"); panel.setAttribute("aria-hidden", "true"); }); }
  let toastTimer; function toast(text) { const el = $("#toast"); el.textContent = text; el.classList.add("show"); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("show"), 2200); }

  function initConfigurator() {
    const rates = window.TARIFAS_CALCULADORA || { minimo: 0, tipos: {}, colores: {} };
    $("#type-options").innerHTML = Object.entries(rates.tipos).map(([key, item], index) => `<div class="choice"><input id="type-${escapeHtml(key)}" type="radio" name="config-type" value="${escapeHtml(key)}" ${index === 0 ? "checked" : ""}><label for="type-${escapeHtml(key)}">${escapeHtml(item.nombre)}</label></div>`).join("");
    const swatches = { blanco: "#f5f3e9", nogal: "#684130", "roble-dorado": "#a8793c", antracita: "#343c40", negro: "#121619" };
    $("#color-options").innerHTML = Object.entries(rates.colores).map(([key, item], index) => `<div class="color-choice"><input id="color-${escapeHtml(key)}" type="radio" name="config-color" value="${escapeHtml(key)}" ${index === 0 ? "checked" : ""}><label for="color-${escapeHtml(key)}"><i style="background:${swatches[key] || "#fff"}"></i>${escapeHtml(item.nombre)}</label></div>`).join(""); updateConfig();
  }
  function currentQuote() {
    const rates = window.TARIFAS_CALCULADORA; const type = rates.tipos[state.config.type]; const color = rates.colores[state.config.color]; const area = state.config.width * state.config.height / 10000; const rate = typeof type.precioM2 === "object" ? type.precioM2[state.config.color] : type.precioM2 * (color.factor || 1); return { name: type.nombre, color: color.nombre, area, price: Math.max(rates.minimo || 0, Math.round(area * rate)) };
  }
  function updateConfig() {
    const quote = currentQuote(); $("#config-name").textContent = quote.name; $("#config-color").textContent = quote.color; $("#config-measure").textContent = `${state.config.width} × ${state.config.height} cm`; $("#config-area").textContent = `${quote.area.toLocaleString("es-CL", { maximumFractionDigits: 2 })} m²`; $("#config-price").textContent = money(quote.price);
    const colors = { blanco: "#f3f3ed", nogal: "#684130", "roble-dorado": "#a8793c", antracita: "#343c40", negro: "#121619" }; $("#window-visual").style.borderColor = colors[state.config.color]; $$("#window-visual span").forEach((el) => el.style.borderColor = colors[state.config.color]);
  }
  function bindEvents() {
    $("#search-form").addEventListener("submit", (e) => e.preventDefault()); $("#search-input").addEventListener("input", (e) => { state.query = e.target.value; $("#search-clear").hidden = !state.query; renderProducts(); }); $("#search-clear").addEventListener("click", () => { state.query = ""; $("#search-input").value = ""; $("#search-clear").hidden = true; renderProducts(); });
    document.addEventListener("click", (e) => { const category = e.target.closest("[data-category]"); if (category && !category.closest("#category-filters")) { e.preventDefault(); setCategory(category.dataset.category); } const add = e.target.closest("[data-add]"); if (add) { const p = products.find((x) => x.id === add.dataset.add); if (p) addCart({ id: p.id, group: p.group, name: p.name, detail: [p.width ? `${p.width} × ${p.height} cm` : "", p.detail].filter(Boolean).join(" · "), price: p.price, image: p.image }); } if (e.target.closest("[data-open-cart]")) openPanel("cart"); if (e.target.closest("[data-open-sections]")) openPanel("sections"); if (e.target.closest("[data-focus-search]")) { closePanels(); $("#search-input").focus(); window.scrollTo({ top: 0, behavior: "smooth" }); } if (e.target.closest("[data-section-link]")) closePanels(); if (e.target.closest("[data-clear-all]")) resetFilters(); });
    $("#category-filters").innerHTML = Object.entries(categoryLabels).map(([key, label]) => `<label><input type="checkbox" name="category" value="${key}"> ${label}</label>`).join("");
    $("#filters").addEventListener("change", (e) => { if (e.target.matches('input[type="checkbox"]')) { const map = { category: state.categories, type: state.types, color: state.colors, availability: state.availability }; const set = map[e.target.name]; e.target.checked ? set.add(e.target.value) : set.delete(e.target.value); renderProducts(); } });
    $("#price-range").addEventListener("input", (e) => { state.maxPrice = Number(e.target.value); $("#price-output").textContent = money(state.maxPrice); renderProducts(); }); [["#width-min", "widthMin"], ["#height-min", "heightMin"]].forEach(([id, key]) => $(id).addEventListener("input", (e) => { state[key] = Number(e.target.value) || 0; renderProducts(); })); $("#sort-select").addEventListener("change", (e) => { state.sort = e.target.value; renderProducts(); });
    $("#active-filters").addEventListener("click", (e) => { const button = e.target.closest("[data-remove-filter]"); if (!button) return; if (button.dataset.removeFilter === "query") { state.query = ""; $("#search-input").value = ""; } else { const map = { category: state.categories, type: state.types, color: state.colors }; map[button.dataset.removeFilter].delete(button.dataset.value); const input = $(`[name="${button.dataset.removeFilter}"][value="${button.dataset.value}"]`); if (input) input.checked = false; } renderProducts(); });
    $("#clear-filters").addEventListener("click", resetFilters); $("#open-filters").addEventListener("click", () => openPanel("filters")); $("#close-filters").addEventListener("click", closePanels); $("#close-cart").addEventListener("click", closePanels); $("#close-sections").addEventListener("click", closePanels); $("#overlay").addEventListener("click", closePanels); document.addEventListener("keydown", (e) => { if (e.key === "Escape") closePanels(); });
    $("#cart-items").addEventListener("click", (e) => { const qty = e.target.closest("[data-qty]"); const remove = e.target.closest("[data-remove-cart]"); if (qty) { const item = state.cart.find((x) => x.id === qty.dataset.cartId); if (item) { item.qty += Number(qty.dataset.qty); if (item.qty < 1) state.cart = state.cart.filter((x) => x.id !== item.id); } } if (remove) state.cart = state.cart.filter((x) => x.id !== remove.dataset.removeCart); if (qty || remove) { saveCart(); renderCart(); } });
    $("#config-form").addEventListener("input", (e) => { if (e.target.name === "config-type") state.config.type = e.target.value; if (e.target.name === "config-color") state.config.color = e.target.value; if (e.target.id === "config-width") state.config.width = Math.max(30, Math.min(500, Number(e.target.value) || 30)); if (e.target.id === "config-height") state.config.height = Math.max(30, Math.min(500, Number(e.target.value) || 30)); updateConfig(); });
    $("#add-config").addEventListener("click", () => { if (!$("#config-form").reportValidity()) return; const q = currentQuote(); addCart({ id: `custom-${state.config.type}-${state.config.color}-${state.config.width}-${state.config.height}`, group: "FABRICACIÓN", name: q.name, detail: `${state.config.width} × ${state.config.height} cm · Color: ${q.color} · ${q.area.toLocaleString("es-CL", { maximumFractionDigits: 2 })} m²`, price: q.price, image: "" }); openPanel("cart"); });
  }
  initConfigurator(); bindEvents(); renderProducts(); renderCart(); $("#year").textContent = new Date().getFullYear();
})();
