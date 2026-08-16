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
  const categoryLabels = { ventanas: "Ventanas", perfiles: "Perfiles PVC", manillas: "Manillas", cremonas: "Cremonas", refuerzos: "Refuerzos", accesorios: "Accesorios" };
  const availabilityLabels = { confirmado: "Stock confirmado", consultar: "Disponible para consultar", fabricacion: "Fabricación" };
  const colorLabels = { blanco: "Blanco", nogal: "Nogal", roble: "Roble dorado", antracita: "Antracita", negro: "Negro", cafe: "Café" };
  function optimizedImage(path) {
    const match = String(path).match(/img\/(stock|accesorios)\/(\d+)\.jpg$/i); if (!match) return path;
    return `img/catalog/${match[1] === "stock" ? "stock" : "accessory"}-${match[2]}.webp`;
  }

  function accessoryCategory(item) {
    const category = clean(item.categoria);
    if (category.includes("perfil")) return "perfiles";
    if (category.includes("manilla")) return "manillas";
    if (category.includes("cremona")) return "cremonas";
    if (category.includes("refuerzo") || category.includes("cerradero")) return "refuerzos";
    return "accesorios";
  }
  function variantLabel(key) {
    return { blanco: "Blanco", "roble-nogal": "Roble dorado / Nogal", "antracita-negro": "Antracita / Negro", "negro-cafe": "Negro / Café", "blanco-negro-cafe": "Blanco / Negro / Café" }[key] || key.replaceAll("-", " / ");
  }
  function variantColors(key) {
    const value = clean(key); const colors = [];
    Object.keys(colorLabels).forEach((color) => { if (value.includes(color) || (color === "roble" && value.includes("roble"))) colors.push(color); });
    return colors;
  }
  function inferUnit(item, category) {
    const text = clean(`${item.nombre} ${item.detalle}`);
    if (text.includes("tira")) return "Tira";
    if (text.includes("juego") || text.includes("par de")) return "Juego";
    if (text.includes("felpa") || text.includes("burlete")) return "Rollo";
    if (category === "perfiles") return "Tira";
    return "Unidad";
  }
  function normalizeWindowProduct(item) {
    return { id: `window-${item.id}`, group: "VENTANAS", category: "ventanas", categoryLabel: "Ventanas", type: slugType(item.modelo), name: item.modelo, detail: "Ventana PVC termopanel lista para entrega", price: Number(item.precio), image: optimizedImage(item.imagen), width: Math.round(Number(item.ancho) * 100), height: Math.round(Number(item.alto) * 100), colors: ["blanco"], availability: "confirmado", unit: "Unidad", variants: [] };
  }
  function normalizeAccessoryProduct(item) {
    const category = accessoryCategory(item);
    const variants = Object.entries(item.precios || {}).map(([key, price]) => ({ id: key, label: variantLabel(key), price: Number(price), colors: variantColors(key) }));
    const colors = [...new Set(variants.flatMap((variant) => variant.colors))];
    return { id: `accessory-${item.id}`, group: category === "perfiles" ? "PERFILES" : "ACCESORIOS", category, categoryLabel: categoryLabels[category], type: slugType(`${item.categoria} ${item.nombre}`), name: item.nombre, detail: item.detalle, price: variants.length ? Math.min(...variants.map((variant) => variant.price)) : Number(item.precio), image: optimizedImage(item.imagen), width: null, height: null, colors, availability: "consultar", unit: inferUnit(item, category), variants };
  }
  const products = [...(window.STOCK_VENTANAS || []).map(normalizeWindowProduct), ...(window.STOCK_ACCESORIOS || []).map(normalizeAccessoryProduct)];
  const pageSize = () => window.innerWidth <= 760 ? 8 : 12;
  const state = { query: "", categories: new Set(), types: new Set(), colors: new Set(), availability: new Set(), maxPrice: 400000, widthMin: 0, heightMin: 0, sort: "relevance", visibleLimit: pageSize(), cart: loadCart(), config: { type: "corredera", color: "blanco", width: 120, height: 120 }, detailProduct: null };
  let lastPanelTrigger = null;

  function loadCart() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!Array.isArray(saved)) return [];
      return saved.filter((item) => item && typeof item.id === "string" && Number.isFinite(Number(item.price))).map((item) => ({ id: item.id, group: String(item.group || "PRODUCTOS"), name: String(item.name || "Producto"), detail: String(item.detail || ""), price: Number(item.price), image: String(item.image || ""), qty: Math.max(1, Math.min(99, Number(item.qty) || 1)) }));
    } catch { return []; }
  }
  function saveCart() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.cart)); } catch { /* localStorage can be unavailable. */ } }
  function searchable(product) { return clean([product.name, product.categoryLabel, product.detail, product.type, product.unit, ...product.colors.map((color) => colorLabels[color]), product.width && `${product.width} ${product.height} ${product.width}x${product.height}`].filter(Boolean).join(" ")); }
  function matchesQuery(product) { return clean(state.query).split(/\s+/).filter(Boolean).every((term) => searchable(product).includes(term)); }
  function filteredProducts() {
    const filtered = products.filter((product) => matchesQuery(product) && (!state.categories.size || state.categories.has(product.category)) && (!state.types.size || state.types.has(product.type)) && (!state.colors.size || [...state.colors].some((color) => product.colors.includes(color))) && (!state.availability.size || state.availability.has(product.availability)) && product.price <= state.maxPrice && (!state.widthMin || (product.width && product.width >= state.widthMin)) && (!state.heightMin || (product.height && product.height >= state.heightMin)));
    return filtered.sort((a, b) => state.sort === "price-asc" ? a.price - b.price : state.sort === "price-desc" ? b.price - a.price : state.sort === "name" ? a.name.localeCompare(b.name, "es") : state.sort === "measure" ? (a.width || Infinity) - (b.width || Infinity) : products.indexOf(a) - products.indexOf(b));
  }
  function productCard(product) {
    const measure = product.width ? `${product.width} × ${product.height} cm` : "";
    const pricePrefix = product.variants.length > 1 ? "Desde " : "";
    return `<article class="product-card"><button class="product-image" type="button" data-view="${escapeHtml(product.id)}" aria-label="Ver detalle de ${escapeHtml(product.name)}"><img src="${escapeHtml(product.image)}" width="420" height="336" loading="lazy" alt="${escapeHtml(product.name)}"><span class="stock-tag is-${escapeHtml(product.availability)}">${escapeHtml(availabilityLabels[product.availability])}</span></button><div class="product-body"><span class="product-category">${escapeHtml(product.categoryLabel)}</span><button class="product-title" type="button" data-view="${escapeHtml(product.id)}"><h3>${escapeHtml(product.name)}</h3></button><p class="product-detail">${escapeHtml(product.detail)}</p><div class="product-specs">${measure ? `<span>${escapeHtml(measure)}</span>` : ""}<span>${escapeHtml(product.unit)}</span>${product.variants.length ? `<span>${product.variants.length} ${product.variants.length === 1 ? "variante" : "variantes"}</span>` : ""}</div><div class="product-buy"><strong class="product-price">${pricePrefix}${money(product.price)}</strong><button class="add-button" type="button" data-view="${escapeHtml(product.id)}" aria-label="Ver opciones de ${escapeHtml(product.name)}">+</button></div></div></article>`;
  }
  function renderProducts(resetLimit = false) {
    if (resetLimit) state.visibleLimit = pageSize();
    const results = filteredProducts(), shown = results.slice(0, state.visibleLimit);
    $("#product-grid").innerHTML = shown.map(productCard).join("");
    $("#results-count").textContent = `${results.length} ${results.length === 1 ? "producto" : "productos"} · mostrando ${shown.length}`;
    $("#empty-state").hidden = results.length !== 0;
    $("#load-more-wrap").hidden = shown.length >= results.length;
    $("#load-more-count").textContent = shown.length < results.length ? `(${results.length - shown.length} restantes)` : "";
    renderActiveFilters();
  }
  function countValues(key) {
    const counts = new Map(); products.forEach((product) => { const values = key === "colors" ? product.colors : [product[key]]; values.filter(Boolean).forEach((value) => counts.set(value, (counts.get(value) || 0) + 1)); }); return counts;
  }
  function filterMarkup(name, entries, labels) {
    return entries.map(([value, count]) => `<label><span><input type="checkbox" name="${escapeHtml(name)}" value="${escapeHtml(value)}"> ${escapeHtml(labels[value] || value)}</span><small>${count}</small></label>`).join("");
  }
  function renderFilterOptions() {
    $("#category-filters").innerHTML = filterMarkup("category", [...countValues("category")], categoryLabels);
    $("#type-filters").innerHTML = filterMarkup("type", [...countValues("type")], { corredera: "Corredera", proyectante: "Proyectante", fija: "Fija", puerta: "Puerta" });
    $("#color-filters").innerHTML = filterMarkup("color", [...countValues("colors")], colorLabels);
    $("#availability-filters").innerHTML = filterMarkup("availability", [...countValues("availability")], availabilityLabels);
  }
  function renderActiveFilters() {
    const labels = [...state.categories].map((value) => ({ type: "category", value, label: categoryLabels[value] })).concat([...state.types].map((value) => ({ type: "type", value, label: value })), [...state.colors].map((value) => ({ type: "color", value, label: colorLabels[value] })), [...state.availability].map((value) => ({ type: "availability", value, label: availabilityLabels[value] })));
    if (state.query) labels.unshift({ type: "query", value: state.query, label: `“${state.query}”` });
    $("#active-filters").innerHTML = labels.map((item) => `<button type="button" data-remove-filter="${escapeHtml(item.type)}" data-value="${escapeHtml(item.value)}">${escapeHtml(item.label)} ×</button>`).join("");
    const count = labels.length + (state.maxPrice < 400000 ? 1 : 0) + (state.widthMin ? 1 : 0) + (state.heightMin ? 1 : 0); $("#filter-badge").hidden = count === 0; $("#filter-badge").textContent = count;
  }
  function setCategory(category) {
    state.categories.clear(); if (category !== "todos") state.categories.add(category);
    $$('[name="category"]').forEach((input) => { input.checked = state.categories.has(input.value); });
    $$(".nav-chip[data-category]").forEach((element) => element.classList.toggle("is-active", element.dataset.category === category));
    renderProducts(true); $("#catalogo").scrollIntoView({ behavior: "smooth" }); closePanels();
  }
  function resetFilters() {
    state.query = ""; state.categories.clear(); state.types.clear(); state.colors.clear(); state.availability.clear(); state.maxPrice = 400000; state.widthMin = 0; state.heightMin = 0; state.sort = "relevance";
    $("#search-input").value = ""; $("#search-clear").hidden = true; $$("#filters input[type=checkbox]").forEach((input) => { input.checked = false; }); $("#price-range").value = 400000; $("#price-output").textContent = money(400000); $("#width-min").value = ""; $("#height-min").value = ""; $("#sort-select").value = "relevance"; $$(".nav-chip[data-category]").forEach((element) => element.classList.toggle("is-active", element.dataset.category === "todos")); renderProducts(true);
  }

  function cartCount() { return state.cart.reduce((sum, item) => sum + item.qty, 0); }
  function addCart(item, qty = 1) { const found = state.cart.find((entry) => entry.id === item.id); if (found) found.qty = Math.min(99, found.qty + qty); else state.cart.push({ ...item, qty }); saveCart(); renderCart(); toast(`${item.name} agregado`); }
  function renderCart() {
    const count = cartCount(); $$('[data-cart-count]').forEach((element) => { element.textContent = count; });
    if (!state.cart.length) $("#cart-items").innerHTML = '<div class="cart-empty"><div><h3>Tu solicitud está vacía</h3><p>Agrega productos o configura una ventana a medida.</p></div></div>';
    else $("#cart-items").innerHTML = state.cart.map((item) => `<article class="cart-item">${item.image ? `<img src="${escapeHtml(item.image)}" width="65" height="65" alt="">` : '<div class="window-thumb">▦</div>'}<div><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.detail)}</p><strong>${money(item.price * item.qty)}</strong><div class="qty"><button type="button" data-qty="-1" data-cart-id="${escapeHtml(item.id)}" aria-label="Disminuir">−</button><span>${item.qty}</span><button type="button" data-qty="1" data-cart-id="${escapeHtml(item.id)}" aria-label="Aumentar">+</button></div></div><button class="remove-item" type="button" data-remove-cart="${escapeHtml(item.id)}" aria-label="Eliminar ${escapeHtml(item.name)}">×</button></article>`).join("");
    const total = state.cart.reduce((sum, item) => sum + item.price * item.qty, 0); $("#cart-total").textContent = money(total);
    const link = $("#cart-whatsapp"); link.classList.toggle("is-disabled", !count); link.setAttribute("aria-disabled", String(!count)); link.href = count ? `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(cartMessage())}` : "#";
  }
  function cartMessage() {
    const groups = [...new Set(state.cart.map((item) => item.group))]; const lines = ["Hola, quiero realizar la siguiente solicitud en FRAME PVC DEPOT:", ""];
    groups.forEach((group) => { lines.push(group, ""); state.cart.filter((item) => item.group === group).forEach((item) => { lines.push(`${item.qty} × ${item.name}`, item.detail, money(item.price * item.qty), ""); }); });
    lines.push("TOTAL REFERENCIAL", money(state.cart.reduce((sum, item) => sum + item.price * item.qty, 0)), "", "Quisiera confirmar disponibilidad, despacho y condiciones de pago."); return lines.filter((line, index, all) => line || all[index - 1]).join("\n");
  }

  function renderProductDetail(product) {
    state.detailProduct = product; $("#product-detail-title").textContent = product.name;
    const measure = product.width ? `${product.width} × ${product.height} cm` : "";
    const variants = product.variants.length ? product.variants : [{ id: "base", label: product.colors.length ? product.colors.map((color) => colorLabels[color]).join(" / ") : "Estándar", price: product.price, colors: product.colors }];
    $("#product-detail-panel").innerHTML = `<div class="detail-image"><img src="${escapeHtml(product.image)}" width="700" height="560" alt="${escapeHtml(product.name)}"></div><div class="detail-copy"><span class="stock-tag is-${escapeHtml(product.availability)}">${escapeHtml(availabilityLabels[product.availability])}</span><p class="product-category">${escapeHtml(product.categoryLabel)}</p><p>${escapeHtml(product.detail)}</p><dl class="detail-specs">${measure ? `<div><dt>Medida</dt><dd>${escapeHtml(measure)}</dd></div>` : ""}<div><dt>Unidad de venta</dt><dd>${escapeHtml(product.unit)}</dd></div><div><dt>Disponibilidad</dt><dd>${escapeHtml(availabilityLabels[product.availability])}</dd></div></dl><label class="detail-variant">Terminación / variante<select id="detail-variant">${variants.map((variant) => `<option value="${escapeHtml(variant.id)}" data-price="${variant.price}">${escapeHtml(variant.label)} — ${money(variant.price)}</option>`).join("")}</select></label><div class="detail-purchase"><div><small>Precio unitario</small><strong id="detail-price">${money(variants[0].price)}</strong></div><label>Cantidad<input id="detail-qty" type="number" min="1" max="99" value="1" inputmode="numeric"></label></div><button class="button primary full" id="detail-add" type="button">Agregar a mi solicitud</button><small class="detail-note">La disponibilidad, despacho y condición de pago se confirman antes de concretar la compra.</small></div>`;
  }
  function addDetailToCart() {
    const product = state.detailProduct; if (!product) return;
    const select = $("#detail-variant"); const variant = product.variants.find((item) => item.id === select.value) || { id: "base", label: product.colors.map((color) => colorLabels[color]).join(" / ") || "Estándar", price: product.price };
    const qty = Math.max(1, Math.min(99, Number($("#detail-qty").value) || 1)); const measure = product.width ? `${product.width} × ${product.height} cm` : "";
    addCart({ id: `${product.id}-${variant.id}`, group: product.group, name: product.name, detail: [measure, product.unit, variant.label, product.detail].filter(Boolean).join(" · "), price: variant.price, image: product.image }, qty);
    const productPanel = $("#product-drawer"); productPanel.style.transition = "none"; closePanels(false); openPanel("cart", $("[data-open-cart]")); requestAnimationFrame(() => { productPanel.style.transition = ""; });
  }

  const pageRegions = () => [$("header"), $("main"), $("footer"), $(".mobile-dock")].filter(Boolean);
  function openPanel(name, trigger = document.activeElement) {
    closePanels(false); lastPanelTrigger = trigger; $("#overlay").hidden = false; document.body.classList.add("is-locked");
    const panels = { cart: $("#cart-drawer"), filters: $("#filters"), sections: $("#sections-drawer"), product: $("#product-drawer") }; const panel = panels[name]; pageRegions().filter((region) => !region.contains(panel)).forEach((region) => { region.inert = true; }); panel.inert = false; panel.classList.add("is-open"); panel.setAttribute("aria-hidden", "false"); setTimeout(() => $(".icon-close", panel)?.focus(), 50);
  }
  function closePanels(returnFocus = true) {
    $("#overlay").hidden = true; document.body.classList.remove("is-locked"); pageRegions().forEach((region) => { region.inert = false; });
    [$("#cart-drawer"), $("#filters"), $("#sections-drawer"), $("#product-drawer")].forEach((panel) => { panel.classList.remove("is-open"); panel.setAttribute("aria-hidden", "true"); panel.inert = true; });
    if (returnFocus && lastPanelTrigger?.isConnected) lastPanelTrigger.focus();
  }
  function trapFocus(event) {
    const panel = [$("#cart-drawer"), $("#filters"), $("#sections-drawer"), $("#product-drawer")].find((item) => item.classList.contains("is-open")); if (!panel || event.key !== "Tab") return;
    const focusable = $$('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])', panel); if (!focusable.length) return;
    const first = focusable[0], last = focusable.at(-1); if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
  let toastTimer; function toast(text) { const element = $("#toast"); element.textContent = text; element.classList.add("show"); clearTimeout(toastTimer); toastTimer = setTimeout(() => element.classList.remove("show"), 2200); }

  function initConfigurator() {
    const rates = window.TARIFAS_CALCULADORA || { minimo: 0, tipos: {}, colores: {} };
    $("#type-options").innerHTML = Object.entries(rates.tipos).map(([key, item], index) => `<div class="choice"><input id="type-${escapeHtml(key)}" type="radio" name="config-type" value="${escapeHtml(key)}" ${index === 0 ? "checked" : ""}><label for="type-${escapeHtml(key)}">${escapeHtml(item.nombre)}</label></div>`).join("");
    const swatches = { blanco: "#f5f3e9", nogal: "#684130", "roble-dorado": "#a8793c", antracita: "#343c40", negro: "#121619" };
    $("#color-options").innerHTML = Object.entries(rates.colores).map(([key, item], index) => `<div class="color-choice"><input id="color-${escapeHtml(key)}" type="radio" name="config-color" value="${escapeHtml(key)}" ${index === 0 ? "checked" : ""}><label for="color-${escapeHtml(key)}"><i style="background:${swatches[key] || "#fff"}"></i>${escapeHtml(item.nombre)}</label></div>`).join(""); updateConfig();
  }
  function currentQuote() { const rates = window.TARIFAS_CALCULADORA; const type = rates.tipos[state.config.type]; const color = rates.colores[state.config.color]; const area = state.config.width * state.config.height / 10000; const rate = typeof type.precioM2 === "object" ? type.precioM2[state.config.color] : type.precioM2 * (color.factor || 1); return { name: type.nombre, color: color.nombre, area, price: Math.max(rates.minimo || 0, Math.round(area * rate)) }; }
  function updateConfig() { const quote = currentQuote(); $("#config-name").textContent = quote.name; $("#config-color").textContent = quote.color; $("#config-measure").textContent = `${state.config.width} × ${state.config.height} cm`; $("#config-area").textContent = `${quote.area.toLocaleString("es-CL", { maximumFractionDigits: 2 })} m²`; $("#config-price").textContent = money(quote.price); const colors = { blanco: "#f3f3ed", nogal: "#684130", "roble-dorado": "#a8793c", antracita: "#343c40", negro: "#121619" }; $("#window-visual").style.borderColor = colors[state.config.color]; $$("#window-visual span").forEach((element) => { element.style.borderColor = colors[state.config.color]; }); }

  function bindEvents() {
    $("#search-form").addEventListener("submit", (event) => event.preventDefault()); $("#search-input").addEventListener("input", (event) => { state.query = event.target.value; $("#search-clear").hidden = !state.query; renderProducts(true); }); $("#search-clear").addEventListener("click", () => { state.query = ""; $("#search-input").value = ""; $("#search-clear").hidden = true; renderProducts(true); });
    document.addEventListener("click", (event) => { const category = event.target.closest("[data-category]"); if (category && !category.closest("#category-filters")) { event.preventDefault(); setCategory(category.dataset.category); } const view = event.target.closest("[data-view]"); if (view) { const product = products.find((item) => item.id === view.dataset.view); if (product) { renderProductDetail(product); openPanel("product", view); } } if (event.target.closest("[data-open-cart]")) openPanel("cart", event.target.closest("[data-open-cart]")); if (event.target.closest("[data-open-sections]")) openPanel("sections", event.target.closest("[data-open-sections]")); if (event.target.closest("[data-focus-search]")) { closePanels(false); $("#search-input").focus(); window.scrollTo({ top: 0, behavior: "smooth" }); } if (event.target.closest("[data-section-link]")) closePanels(false); if (event.target.closest("[data-clear-all]")) resetFilters(); });
    $("#filters").addEventListener("change", (event) => { if (!event.target.matches('input[type="checkbox"]')) return; const map = { category: state.categories, type: state.types, color: state.colors, availability: state.availability }; const set = map[event.target.name]; event.target.checked ? set.add(event.target.value) : set.delete(event.target.value); renderProducts(true); });
    $("#price-range").addEventListener("input", (event) => { state.maxPrice = Number(event.target.value); $("#price-output").textContent = money(state.maxPrice); renderProducts(true); }); [["#width-min", "widthMin"], ["#height-min", "heightMin"]].forEach(([id, key]) => $(id).addEventListener("input", (event) => { state[key] = Number(event.target.value) || 0; renderProducts(true); })); $("#sort-select").addEventListener("change", (event) => { state.sort = event.target.value; renderProducts(true); });
    $("#active-filters").addEventListener("click", (event) => { const button = event.target.closest("[data-remove-filter]"); if (!button) return; if (button.dataset.removeFilter === "query") { state.query = ""; $("#search-input").value = ""; } else { const map = { category: state.categories, type: state.types, color: state.colors, availability: state.availability }; map[button.dataset.removeFilter].delete(button.dataset.value); const input = $(`[name="${button.dataset.removeFilter}"][value="${button.dataset.value}"]`); if (input) input.checked = false; } renderProducts(true); });
    $("#clear-filters").addEventListener("click", resetFilters); $("#load-more").addEventListener("click", () => { state.visibleLimit += pageSize(); renderProducts(); }); $("#open-filters").addEventListener("click", (event) => openPanel("filters", event.currentTarget)); ["#close-filters", "#close-cart", "#close-sections", "#close-product"].forEach((id) => $(id).addEventListener("click", () => closePanels())); $("#overlay").addEventListener("click", () => closePanels()); document.addEventListener("keydown", (event) => { if (event.key === "Escape") closePanels(); trapFocus(event); });
    $("#product-detail-panel").addEventListener("change", (event) => { if (event.target.id === "detail-variant") $("#detail-price").textContent = money(event.target.selectedOptions[0].dataset.price); }); $("#product-detail-panel").addEventListener("click", (event) => { if (event.target.id === "detail-add") addDetailToCart(); });
    $("#cart-items").addEventListener("click", (event) => { const qty = event.target.closest("[data-qty]"), remove = event.target.closest("[data-remove-cart]"); if (qty) { const item = state.cart.find((entry) => entry.id === qty.dataset.cartId); if (item) { item.qty += Number(qty.dataset.qty); if (item.qty < 1) state.cart = state.cart.filter((entry) => entry.id !== item.id); } } if (remove) state.cart = state.cart.filter((entry) => entry.id !== remove.dataset.removeCart); if (qty || remove) { saveCart(); renderCart(); } });
    $("#config-form").addEventListener("input", (event) => { if (event.target.name === "config-type") state.config.type = event.target.value; if (event.target.name === "config-color") state.config.color = event.target.value; if (event.target.id === "config-width") state.config.width = Math.max(30, Math.min(500, Number(event.target.value) || 30)); if (event.target.id === "config-height") state.config.height = Math.max(30, Math.min(500, Number(event.target.value) || 30)); updateConfig(); });
    $("#add-config").addEventListener("click", () => { if (!$("#config-form").reportValidity()) return; const quote = currentQuote(); addCart({ id: `custom-${state.config.type}-${state.config.color}-${state.config.width}-${state.config.height}`, group: "FABRICACIÓN", name: quote.name, detail: `${state.config.width} × ${state.config.height} cm · Color: ${quote.color} · ${quote.area.toLocaleString("es-CL", { maximumFractionDigits: 2 })} m²`, price: quote.price, image: "" }); openPanel("cart", $("#add-config")); });
  }

  renderFilterOptions(); initConfigurator(); bindEvents(); closePanels(false); renderProducts(); renderCart(); $("#year").textContent = new Date().getFullYear();
})();
