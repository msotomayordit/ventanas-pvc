// Cambia este número por tu WhatsApp real (código país + número, sin + ni espacios)
const WHATSAPP = "56950187327";

const menuToggle = document.getElementById("menu-toggle");
const mainNav = document.getElementById("main-nav");
const navOverlay = document.getElementById("nav-overlay");

function closeMobileMenu() {
  if (!menuToggle || !mainNav || !navOverlay) return;
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Abrir menú");
  mainNav.classList.remove("is-open");
  navOverlay.hidden = true;
  document.body.classList.remove("menu-open");
}

if (menuToggle && mainNav && navOverlay) {
  menuToggle.addEventListener("click", () => {
    const opening = menuToggle.getAttribute("aria-expanded") !== "true";
    menuToggle.setAttribute("aria-expanded", String(opening));
    menuToggle.setAttribute("aria-label", opening ? "Cerrar menú" : "Abrir menú");
    mainNav.classList.toggle("is-open", opening);
    navOverlay.hidden = !opening;
    document.body.classList.toggle("menu-open", opening);
  });
  navOverlay.addEventListener("click", closeMobileMenu);
  mainNav.addEventListener("click", (event) => { if (event.target.closest("a")) closeMobileMenu(); });
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeMobileMenu(); });
  window.addEventListener("resize", () => { if (window.innerWidth >= 720) closeMobileMenu(); });
}

function initHeroCompare() {
  const compare = document.getElementById("hero-compare");
  const control = document.getElementById("hero-compare-control");
  if (!compare || !control) return;

  let animationFrame = 0;
  let userInteracted = false;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const setPosition = (value) => {
    const position = Math.min(100, Math.max(0, Number(value)));
    compare.style.setProperty("--compare-position", `${position}%`);
    control.value = String(position);
  };
  const stopDemo = () => {
    userInteracted = true;
    compare.classList.add("is-interacted");
    if (animationFrame) cancelAnimationFrame(animationFrame);
  };

  control.addEventListener("input", () => {
    stopDemo();
    setPosition(control.value);
  });
  control.addEventListener("pointerdown", stopDemo);
  control.addEventListener("keydown", stopDemo);

  if (reduceMotion) {
    setPosition(50);
    return;
  }

  const start = performance.now();
  const animate = (now) => {
    if (userInteracted) return;
    const elapsed = now - start;
    let position;
    if (elapsed < 1800) {
      const progress = elapsed / 1800;
      position = 70 - 40 * (1 - Math.pow(1 - progress, 3));
    } else if (elapsed < 2200) {
      position = 30;
    } else if (elapsed < 2900) {
      const progress = (elapsed - 2200) / 700;
      position = 30 + 20 * (1 - Math.pow(1 - progress, 3));
    } else {
      setPosition(50);
      return;
    }
    setPosition(position);
    animationFrame = requestAnimationFrame(animate);
  };
  animationFrame = requestAnimationFrame(animate);
}

function formatMedida(ancho, alto) {
  const a = Number(ancho).toLocaleString("es-CL", {
    minimumFractionDigits: Number.isInteger(Number(ancho)) ? 0 : 1,
    maximumFractionDigits: 2,
  });
  const h = Number(alto).toLocaleString("es-CL", {
    minimumFractionDigits: Number.isInteger(Number(alto)) ? 0 : 1,
    maximumFractionDigits: 2,
  });
  return `${a} × ${h} m`;
}

function formatPrecio(precio) {
  return `$${Number(precio).toLocaleString("es-CL")}`;
}

function waUrl(texto) {
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`;
}

const carts = {
  stock: [],
  acc: [],
  calc: [],
};

function findCartItem(cartName, id) {
  return carts[cartName].find((item) => String(item.id) === String(id));
}

function addToCart(cartName, product) {
  const existing = findCartItem(cartName, product.id);
  if (existing) {
    existing.qty += 1;
  } else {
    carts[cartName].push({ ...product, qty: 1 });
  }
  renderCart(cartName);
}

function changeCartQty(cartName, id, delta) {
  const item = findCartItem(cartName, id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    carts[cartName] = carts[cartName].filter((entry) => String(entry.id) !== String(id));
  }
  renderCart(cartName);
}

function removeFromCart(cartName, id) {
  carts[cartName] = carts[cartName].filter((entry) => String(entry.id) !== String(id));
  renderCart(cartName);
}

function cartTotal(cartName) {
  return carts[cartName].reduce((sum, item) => sum + item.precio * item.qty, 0);
}

function cartCount(cartName) {
  return carts[cartName].reduce((sum, item) => sum + item.qty, 0);
}

function cartRootId(cartName) {
  if (cartName === "stock") return "cart-stock";
  if (cartName === "acc") return "cart-acc";
  return "cart-calc";
}

function buildCartMessage(cartName) {
  const items = carts[cartName];
  if (!items.length) return "";

  const titulo =
    cartName === "stock"
      ? "Hola, quiero pedir estas ventanas en stock FRAME PVC DEPOT:"
      : cartName === "acc"
        ? "Hola, quiero pedir estos accesorios y perfiles FRAME PVC DEPOT:"
        : "Hola, cotizo con la calculadora de FRAME PVC DEPOT:";

  const lineas = items.map((item) => {
    const detalle = item.detalle ? ` (${item.detalle})` : "";
    return `- ${item.qty} × ${item.nombre}${detalle}: ${formatPrecio(item.precio * item.qty)}`;
  });

  return [titulo, ...lineas, `Total: ${formatPrecio(cartTotal(cartName))}`].join("\n");
}

function unifiedCartCount() {
  return Object.keys(carts).reduce((sum, name) => sum + cartCount(name), 0);
}

function unifiedCartTotal() {
  return Object.keys(carts).reduce((sum, name) => sum + cartTotal(name), 0);
}

function buildUnifiedCartMessage() {
  const labels = { stock: "VENTANAS EN STOCK", calc: "VENTANAS PERSONALIZADAS", acc: "ACCESORIOS Y PERFILES" };
  const lines = ["Hola, quiero solicitar estos productos en FRAME PVC DEPOT:", ""];
  ["stock", "calc", "acc"].forEach((name) => {
    if (!carts[name].length) return;
    lines.push(labels[name]);
    carts[name].forEach((item) => lines.push(`- ${item.qty} × ${item.nombre}${item.detalle ? ` (${item.detalle})` : ""}: ${formatPrecio(item.precio * item.qty)}`));
    lines.push("");
  });
  lines.push(`TOTAL REFERENCIAL: ${formatPrecio(unifiedCartTotal())}`, "Quiero confirmar stock, fabricación, despacho y valor final.");
  return lines.join("\n");
}

function renderUnifiedCart() {
  const body = document.getElementById("unified-cart-body");
  if (!body) return;
  const labels = { stock: ["Ventanas en stock", "Disponibles para entrega"], calc: ["Ventanas personalizadas", "Calculadas según tus medidas"], acc: ["Accesorios y perfiles", "Componentes para fabricación e instalación"] };
  const count = unifiedCartCount();
  document.querySelectorAll("[data-unified-count]").forEach((element) => { element.textContent = count; });
  document.getElementById("unified-cart-total").textContent = formatPrecio(unifiedCartTotal());
  if (!count) body.innerHTML = '<div class="unified-cart-empty"><svg class="cart-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.1 10.1a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 1.9-1.4L21 7H6"/><circle cx="9.5" cy="19" r="1.25"/><circle cx="17.5" cy="19" r="1.25"/></svg><h3>Tu carrito está vacío</h3><p>Agrega una ventana disponible, calcula una personalizada o incorpora sus accesorios.</p><button type="button" data-close-unified-cart>Volver a ver productos</button></div>';
  else body.innerHTML = ["stock", "calc", "acc"].filter((name) => carts[name].length).map((name) => `<section class="unified-cart-group"><header><div><h3>${labels[name][0]}</h3><p>${labels[name][1]}</p></div><strong>${cartCount(name)} ${cartCount(name) === 1 ? "ítem" : "ítems"}</strong></header><ul>${carts[name].map((item) => `<li><div><b>${item.nombre}</b><span>${item.detalle || ""}</span><small>${formatPrecio(item.precio)} c/u</small></div><div class="unified-item-actions"><button type="button" data-cart-action="dec" data-cart="${name}" data-id="${item.id}" aria-label="Quitar uno">−</button><strong>${item.qty}</strong><button type="button" data-cart-action="inc" data-cart="${name}" data-id="${item.id}" aria-label="Agregar uno">+</button><button type="button" class="unified-remove" data-cart-action="remove" data-cart="${name}" data-id="${item.id}" aria-label="Eliminar ${item.nombre}">×</button></div><strong class="unified-line-total">${formatPrecio(item.precio * item.qty)}</strong></li>`).join("")}</ul></section>`).join("");
  const wa = document.getElementById("unified-cart-wa");
  wa.href = count ? waUrl(buildUnifiedCartMessage()) : "#"; wa.classList.toggle("is-disabled", !count); wa.setAttribute("aria-disabled", String(!count));
}

function renderCart(cartName) {
  const root = document.getElementById(cartRootId(cartName));
  if (!root) return;

  const list = root.querySelector("[data-cart-list]");
  const countEl = root.querySelector("[data-cart-count]");
  const totalEl = root.querySelector("[data-cart-total]");
  const waLink = root.querySelector("[data-cart-wa]");
  const items = carts[cartName];
  const count = cartCount(cartName);

  root.classList.toggle("is-empty", count === 0);
  if (countEl) countEl.textContent = count === 1 ? "1 ítem" : `${count} ítems`;
  if (totalEl) totalEl.textContent = formatPrecio(cartTotal(cartName));

  if (list) {
    const emptyText =
      cartName === "calc"
        ? "Tu carro está vacío. Calcula una ventana y agrégala."
        : "Tu carro está vacío. Agrega productos desde la galería.";
    if (!items.length) {
      list.innerHTML = `<li class="shop-cart-empty">${emptyText}</li>`;
    } else {
      list.innerHTML = items
        .map(
          (item) => `
        <li class="shop-cart-item" data-id="${item.id}">
          <div class="shop-cart-item-info">
            <strong>${item.nombre}</strong>
            <span>${item.detalle || ""}</span>
            <span>${formatPrecio(item.precio)} c/u</span>
          </div>
          <div class="shop-cart-item-actions">
            <button type="button" class="shop-qty" data-cart-action="dec" data-cart="${cartName}" data-id="${item.id}" aria-label="Quitar uno">−</button>
            <span class="shop-qty-val">${item.qty}</span>
            <button type="button" class="shop-qty" data-cart-action="inc" data-cart="${cartName}" data-id="${item.id}" aria-label="Agregar uno">+</button>
            <button type="button" class="shop-remove" data-cart-action="remove" data-cart="${cartName}" data-id="${item.id}" aria-label="Eliminar">✕</button>
          </div>
          <p class="shop-cart-item-total">${formatPrecio(item.precio * item.qty)}</p>
        </li>`
        )
        .join("");
    }
  }

  if (waLink) {
    const mensaje = buildCartMessage(cartName);
    if (mensaje) {
      waLink.href = waUrl(mensaje);
      waLink.removeAttribute("aria-disabled");
      waLink.classList.remove("is-disabled");
    } else {
      waLink.href = "#";
      waLink.setAttribute("aria-disabled", "true");
      waLink.classList.add("is-disabled");
    }
  }
  renderUnifiedCart();
}

function initCarts() {
  const drawer = document.getElementById("unified-cart");
  const overlay = document.getElementById("cart-overlay");
  const closeButton = document.getElementById("unified-cart-close");
  let cartTrigger = null;
  const closeUnifiedCart = () => { drawer.classList.remove("is-open"); drawer.setAttribute("aria-hidden", "true"); overlay.hidden = true; document.body.classList.remove("cart-open"); if (cartTrigger?.isConnected) cartTrigger.focus(); };
  const openUnifiedCart = (trigger) => { closeMobileMenu(); cartTrigger = trigger; renderUnifiedCart(); drawer.classList.add("is-open"); drawer.setAttribute("aria-hidden", "false"); overlay.hidden = false; document.body.classList.add("cart-open"); setTimeout(() => closeButton.focus(), 60); };
  document.addEventListener("click", (event) => {
    const openCart = event.target.closest("[data-open-unified-cart]");
    if (openCart) { openUnifiedCart(openCart); return; }
    if (event.target.closest("[data-close-unified-cart]")) { closeUnifiedCart(); return; }
    const addBtn = event.target.closest("[data-add-cart]");
    if (addBtn) {
      event.preventDefault();
      const cartName = addBtn.dataset.addCart;
      const id = addBtn.dataset.id;
      const nombre = addBtn.dataset.nombre || "";
      const detalle = addBtn.dataset.detalle || "";
      const precio = Number(addBtn.dataset.precio);
      if (!cartName || !(precio > 0)) return;
      addToCart(cartName, { id, nombre, detalle, precio });
      return;
    }

    const actionBtn = event.target.closest("[data-cart-action]");
    if (!actionBtn) return;

    event.preventDefault();
    const cartName = actionBtn.dataset.cart;
    const id = actionBtn.dataset.id;
    const action = actionBtn.dataset.cartAction;

    if (action === "inc") changeCartQty(cartName, id, 1);
    if (action === "dec") changeCartQty(cartName, id, -1);
    if (action === "remove") removeFromCart(cartName, id);
  });

  closeButton.addEventListener("click", closeUnifiedCart);
  overlay.addEventListener("click", closeUnifiedCart);
  document.addEventListener("keydown", (event) => { if (event.key === "Escape" && drawer.classList.contains("is-open")) closeUnifiedCart(); });

  renderCart("stock");
  renderCart("acc");
  renderCart("calc");
}

function renderStock() {
  const root = document.getElementById("stock-gallery");
  const search = document.getElementById("marketplace-query");
  if (!root || !search) return;

  const clean = (value = "") => String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  const safe = (value = "") => String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
  const colorLabels = { blanco: "Blanco", nogal: "Nogal", roble: "Roble dorado", antracita: "Antracita", negro: "Negro", cafe: "Café" };
  const categoryLabels = { ventanas: "Ventanas", perfiles: "Perfiles PVC", manillas: "Manillas", cremonas: "Cremonas", refuerzos: "Refuerzos", accesorios: "Accesorios" };
  const availabilityLabels = { confirmado: "Stock confirmado", consultar: "Consultar disponibilidad" };
  const typeOf = (text) => ["corredera", "proyectante", "fija", "puerta"].find((type) => clean(text).includes(type)) || "";
  const accessoryCategory = (item) => { const category = clean(item.categoria); if (category.includes("perfil")) return "perfiles"; if (category.includes("manilla")) return "manillas"; if (category.includes("cremona")) return "cremonas"; if (category.includes("refuerzo") || category.includes("cerradero")) return "refuerzos"; return "accesorios"; };
  const variantColors = (item) => [...new Set(Object.keys(item.precios || {}).flatMap((key) => Object.keys(colorLabels).filter((color) => clean(key).includes(color))))];
  const products = [
    ...(window.STOCK_VENTANAS || []).map((item) => ({ id: `window-${item.id}`, cart: "stock", sourceId: item.id, category: "ventanas", type: typeOf(item.modelo), name: item.modelo, detail: "Ventana PVC termopanel lista para entrega", price: Number(item.precio), image: item.imagen, width: Math.round(Number(item.ancho) * 100), height: Math.round(Number(item.alto) * 100), colors: ["blanco"], availability: "confirmado", unit: "Unidad", variants: 0 })),
    ...(window.STOCK_ACCESORIOS || []).map((item) => { const category = accessoryCategory(item); const prices = Object.values(item.precios || {}).map(Number).filter(Number.isFinite); return { id: `accessory-${item.id}`, cart: "acc", sourceId: item.id, category, type: typeOf(`${item.categoria} ${item.nombre}`), name: item.nombre, detail: item.detalle, price: prices.length ? Math.min(...prices) : Number(item.precio), image: item.imagen, width: null, height: null, colors: variantColors(item), availability: "consultar", unit: clean(item.detalle).includes("tira") || category === "perfiles" ? "Tira" : clean(item.nombre).includes("juego") ? "Juego" : "Unidad", variants: prices.length } }),
  ];
  const state = { query: "", category: "todos", types: new Set(), colors: new Set(), availability: new Set(), maxPrice: 400000, width: 0, height: 0, sort: "relevance", limit: window.innerWidth < 720 ? 8 : 12 };
  const aliases = { corredera: ["corredera", "corrediza"], corrediza: ["corrediza", "corredera"], ventana: ["ventana", "ventanas"], ventanas: ["ventana", "ventanas"], perfil: ["perfil", "perfiles", "marco"], tirador: ["tirador", "manilla"], manija: ["manija", "manilla"], cierre: ["cierre", "cerradero", "cremona"] };
  const searchable = (product) => clean([product.name, product.detail, categoryLabels[product.category], product.type, product.unit, product.width && `${product.width}x${product.height}`, ...product.colors.map((color) => colorLabels[color])].filter(Boolean).join(" "));
  const matches = (product) => clean(state.query).replace(/(\d)\s*[x×]\s*(\d)/g, "$1x$2").split(/\s+/).filter(Boolean).every((term) => (aliases[term] || [term]).some((candidate) => searchable(product).includes(candidate)));
  const filtered = () => products.filter((product) => matches(product) && (state.category === "todos" || product.category === state.category) && (!state.types.size || state.types.has(product.type)) && (!state.colors.size || [...state.colors].some((color) => product.colors.includes(color))) && (!state.availability.size || state.availability.has(product.availability)) && product.price <= state.maxPrice && (!state.width || (product.width && product.width >= state.width)) && (!state.height || (product.height && product.height >= state.height))).sort((a, b) => state.sort === "price-asc" ? a.price - b.price : state.sort === "price-desc" ? b.price - a.price : state.sort === "name" ? a.name.localeCompare(b.name, "es") : state.sort === "measure" ? (a.width || Infinity) - (b.width || Infinity) : products.indexOf(a) - products.indexOf(b));
  const filterMarkup = (name, values, labels) => values.map((value) => `<label><input type="checkbox" name="market-${name}" value="${safe(value)}">${safe(labels[value] || value)}</label>`).join("");
  document.getElementById("marketplace-types").innerHTML = filterMarkup("type", ["corredera", "proyectante", "fija", "puerta"], { corredera: "Corredera", proyectante: "Proyectante", fija: "Fija", puerta: "Puerta" });
  document.getElementById("marketplace-colors").innerHTML = filterMarkup("color", Object.keys(colorLabels), colorLabels);
  document.getElementById("marketplace-availability").innerHTML = filterMarkup("availability", Object.keys(availabilityLabels), availabilityLabels);

  const renderSuggestions = () => {
    const panel = document.getElementById("marketplace-suggestions"), value = search.value.trim();
    if (value.length < 2) { panel.hidden = true; return; }
    const previous = state.query; state.query = value; const suggestions = products.filter(matches).slice(0, 6); state.query = previous;
    panel.innerHTML = suggestions.length ? suggestions.map((product) => `<button type="button" data-market-suggestion="${safe(product.name)}"><img src="${safe(product.image)}" alt="" width="46" height="46"><span><b>${safe(product.name)}</b><small>${safe(categoryLabels[product.category])} · ${formatPrecio(product.price)}</small></span></button>`).join("") : "<p>No encontramos coincidencias.</p>";
    panel.hidden = false;
  };
  const renderActive = () => {
    const active = []; if (state.query) active.push(`“${state.query}”`); if (state.category !== "todos") active.push(categoryLabels[state.category]); active.push(...state.types, ...[...state.colors].map((color) => colorLabels[color]), ...[...state.availability].map((value) => availabilityLabels[value]));
    document.getElementById("marketplace-active").innerHTML = active.map((label) => `<span>${safe(label)}</span>`).join(""); document.getElementById("marketplace-filter-count").textContent = active.length;
  };
  const render = (reset = false) => {
    if (reset) state.limit = window.innerWidth < 720 ? 8 : 12;
    const results = filtered(), shown = results.slice(0, state.limit);
    root.innerHTML = shown.map((product) => { const measure = product.width ? `${product.width} × ${product.height} cm` : ""; const detail = [measure, product.unit, product.variants ? `${product.variants} variantes` : ""].filter(Boolean).join(" · "); return `<article class="market-card"><div class="market-card-photo"><img src="${safe(product.image)}" alt="${safe(product.name)}" width="420" height="336" loading="lazy"><span>${safe(availabilityLabels[product.availability])}</span></div><div class="market-card-body"><small>${safe(categoryLabels[product.category])}</small><h3>${safe(product.name)}</h3><p>${safe(product.detail)}</p><div class="market-card-specs">${detail ? `<span>${safe(detail)}</span>` : ""}</div><div class="market-card-price"><strong>${product.variants > 1 ? "Desde " : ""}${formatPrecio(product.price)}</strong><small>12 cuotas ref. de ${formatPrecio(Math.ceil(product.price / 12))}</small></div><button type="button" data-add-cart="${product.cart}" data-id="${safe(product.sourceId)}" data-nombre="${safe(product.name)}" data-detalle="${safe(detail || product.detail)}" data-precio="${product.price}">Agregar al carrito</button></div></article>`; }).join("");
    document.getElementById("marketplace-results").textContent = `${results.length} productos · mostrando ${shown.length}`; document.getElementById("marketplace-empty").hidden = results.length !== 0; document.getElementById("marketplace-more").hidden = shown.length >= results.length; renderActive();
  };
  document.getElementById("marketplace-search").addEventListener("submit", (event) => { event.preventDefault(); state.query = search.value.trim(); document.getElementById("marketplace-suggestions").hidden = true; render(true); });
  search.addEventListener("input", () => { state.query = search.value; renderSuggestions(); render(true); });
  document.querySelector(".marketplace-categories").addEventListener("click", (event) => { const button = event.target.closest("[data-market-category]"); if (!button) return; state.category = button.dataset.marketCategory; document.querySelectorAll("[data-market-category]").forEach((item) => item.classList.toggle("is-active", item === button)); render(true); });
  document.getElementById("marketplace-filters").addEventListener("change", (event) => { const maps = { "market-type": state.types, "market-color": state.colors, "market-availability": state.availability }; const set = maps[event.target.name]; if (set) event.target.checked ? set.add(event.target.value) : set.delete(event.target.value); render(true); });
  document.getElementById("marketplace-price").addEventListener("input", (event) => { state.maxPrice = Number(event.target.value); document.getElementById("marketplace-price-output").textContent = formatPrecio(state.maxPrice); render(true); });
  document.getElementById("marketplace-width").addEventListener("input", (event) => { state.width = Number(event.target.value) || 0; render(true); }); document.getElementById("marketplace-height").addEventListener("input", (event) => { state.height = Number(event.target.value) || 0; render(true); });
  document.getElementById("marketplace-sort").addEventListener("change", (event) => { state.sort = event.target.value; render(); }); document.getElementById("marketplace-more").addEventListener("click", () => { state.limit += window.innerWidth < 720 ? 8 : 12; render(); });
  const clear = () => { state.query = ""; state.category = "todos"; state.types.clear(); state.colors.clear(); state.availability.clear(); state.maxPrice = 400000; state.width = 0; state.height = 0; search.value = ""; document.querySelectorAll('#marketplace-filters input[type="checkbox"]').forEach((input) => { input.checked = false; }); document.getElementById("marketplace-price").value = 400000; document.getElementById("marketplace-price-output").textContent = formatPrecio(400000); document.getElementById("marketplace-width").value = ""; document.getElementById("marketplace-height").value = ""; document.querySelectorAll("[data-market-category]").forEach((item) => item.classList.toggle("is-active", item.dataset.marketCategory === "todos")); render(true); };
  document.getElementById("marketplace-clear").addEventListener("click", clear); document.querySelector("[data-market-clear]").addEventListener("click", clear); document.getElementById("marketplace-filter-toggle").addEventListener("click", (event) => { const filters = document.getElementById("marketplace-filters"), open = !filters.classList.contains("is-open"); filters.classList.toggle("is-open", open); event.currentTarget.setAttribute("aria-expanded", String(open)); });
  document.getElementById("marketplace-suggestions").addEventListener("click", (event) => { const button = event.target.closest("[data-market-suggestion]"); if (!button) return; search.value = button.dataset.marketSuggestion; state.query = search.value; event.currentTarget.hidden = true; render(true); });
  render();
}

function renderHeroBestsellers() {
  const root = document.getElementById("hero-bestsellers-list");
  const items = window.STOCK_VENTANAS;
  if (!root || !Array.isArray(items)) return;

  root.innerHTML = items.map((item) => {
    const medida = formatMedida(item.ancho, item.alto);
    return `
      <article class="hero-bestseller">
        <img src="${item.imagen}" alt="${item.modelo}" width="180" height="180" loading="eager" />
        <div class="hero-bestseller-info">
          <h3>${item.modelo}</h3>
          <p>${medida}</p>
          <strong>${formatPrecio(item.precio)}</strong>
          <button type="button" data-add-cart="stock" data-id="${item.id}" data-nombre="${item.modelo}" data-detalle="${medida}" data-precio="${item.precio}">Agregar</button>
        </div>
      </article>`;
  }).join("");

  initHeroBestsellersCarousel(root);
}

function initHeroBestsellersCarousel(root) {
  const previous = document.querySelector("[data-bestsellers-prev]");
  const next = document.querySelector("[data-bestsellers-next]");
  const status = document.getElementById("hero-bestsellers-status");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let timer = 0;

  const cards = () => Array.from(root.querySelectorAll(".hero-bestseller"));
  const visibleCount = () => window.innerWidth < 720 ? 1 : 3;
  const currentIndex = () => {
    const first = cards()[0];
    if (!first) return 0;
    const step = first.getBoundingClientRect().width + parseFloat(getComputedStyle(root).columnGap || 0);
    return Math.max(0, Math.round(root.scrollLeft / step));
  };
  const updateStatus = () => {
    if (!status) return;
    const total = cards().length;
    const start = Math.min(currentIndex() + 1, total);
    const end = Math.min(start + visibleCount() - 1, total);
    status.textContent = start === end ? `${start} de ${total}` : `${start}–${end} de ${total}`;
  };
  const goTo = (index) => {
    const allCards = cards();
    if (!allCards.length) return;
    const maximum = Math.max(0, allCards.length - visibleCount());
    const target = index > maximum ? 0 : index < 0 ? maximum : index;
    root.scrollTo({
      left: allCards[target].offsetLeft - root.offsetLeft,
      behavior: reduceMotion ? "auto" : "smooth",
    });
    window.setTimeout(updateStatus, reduceMotion ? 0 : 380);
  };
  const stop = () => window.clearInterval(timer);
  const start = () => {
    stop();
    if (reduceMotion || document.hidden) return;
    timer = window.setInterval(() => goTo(currentIndex() + 1), 4500);
  };

  previous?.addEventListener("click", () => { goTo(currentIndex() - 1); start(); });
  next?.addEventListener("click", () => { goTo(currentIndex() + 1); start(); });
  root.addEventListener("scroll", () => window.requestAnimationFrame(updateStatus), { passive: true });
  root.addEventListener("pointerenter", stop);
  root.addEventListener("pointerleave", start);
  root.addEventListener("focusin", stop);
  root.addEventListener("focusout", start);
  root.addEventListener("touchstart", stop, { passive: true });
  root.addEventListener("touchend", start, { passive: true });
  document.addEventListener("visibilitychange", () => document.hidden ? stop() : start());
  window.addEventListener("resize", updateStatus);
  updateStatus();
  start();
}

function parseMedida(valor) {
  const n = Number(String(valor).replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
}

function calcularPrecio(tipo, color, ancho, alto) {
  const tarifas = window.TARIFAS_CALCULADORA;
  const tipoInfo = tarifas?.tipos?.[tipo];
  const colorInfo = tarifas?.colores?.[color];

  if (!tipoInfo || !colorInfo) return null;

  const area = ancho * alto;
  let precioM2;

  if (tipoInfo.precioM2 && typeof tipoInfo.precioM2 === "object") {
    precioM2 = Number(tipoInfo.precioM2[color]);
  } else {
    precioM2 = Number(tipoInfo.precioM2) * colorInfo.factor;
  }

  if (!(precioM2 > 0)) return null;

  const bruto = area * precioM2;
  const total = Math.max(Math.round(bruto / 1000) * 1000, tarifas.minimo || 0);

  return {
    tipo: tipoInfo.nombre,
    color: colorInfo.nombre,
    ancho,
    alto,
    area,
    total,
  };
}

function initCalculadora() {
  const form = document.getElementById("form-calculadora");
  const summary = document.getElementById("calc-summary");
  const totalEl = document.getElementById("calc-total");
  const addBtn = document.getElementById("calc-add-cart");
  const ventanaImg = document.getElementById("calc-ventana-img");

  if (!form || !summary || !totalEl || !addBtn) return;

  let ultimoResultado = null;

  const ventanasPorColor = {
    blanco: "img/ventana-blanco.jpg",
    nogal: "img/ventana-nogal.jpg",
    "roble-dorado": "img/ventana-roble-dorado.jpg",
    antracita: "img/ventana-antracita.jpg",
    negro: "img/ventana-negro.jpg",
  };

  const actualizarVentana = (color) => {
    if (!ventanaImg) return;
    const src = ventanasPorColor[color] || ventanasPorColor.blanco;
    if (ventanaImg.getAttribute("src") !== src) {
      ventanaImg.setAttribute("src", src);
    }
    ventanaImg.alt = `Ventana corredera PVC color ${color.replace("-", " ")}`;
  };

  const actualizar = () => {
    const data = new FormData(form);
    const tipo = String(data.get("tipo") || "");
    const color = String(data.get("color") || "");
    const ancho = parseMedida(data.get("ancho"));
    const alto = parseMedida(data.get("alto"));

    actualizarVentana(color);

    if (!(ancho > 0) || !(alto > 0)) {
      summary.textContent = "Ingresa ancho y alto válidos en metros.";
      totalEl.textContent = "—";
      ultimoResultado = null;
      addBtn.disabled = true;
      return;
    }

    const resultado = calcularPrecio(tipo, color, ancho, alto);
    if (!resultado) {
      summary.textContent = "No se pudo calcular con los datos ingresados.";
      totalEl.textContent = "—";
      ultimoResultado = null;
      addBtn.disabled = true;
      return;
    }

    const medida = formatMedida(resultado.ancho, resultado.alto);
    const areaTxt = resultado.area.toLocaleString("es-CL", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    summary.textContent = `${resultado.tipo} · ${resultado.color} · ${medida} (${areaTxt} m²)`;
    totalEl.textContent = formatPrecio(resultado.total);
    ultimoResultado = {
      id: `${tipo}-${color}-${ancho}x${alto}-${resultado.total}`,
      nombre: resultado.tipo,
      detalle: `${resultado.color} · ${medida}`,
      precio: resultado.total,
    };
    addBtn.disabled = false;
  };

  addBtn.addEventListener("click", () => {
    if (!ultimoResultado) return;
    addToCart("calc", ultimoResultado);
  });

  form.addEventListener("input", actualizar);
  form.addEventListener("change", actualizar);
  actualizar();
}

function preciosColorRows(precios) {
  const rows = [];
  if (precios.blanco != null) {
    rows.push({ keys: ["blanco"], label: "Blanco", precio: precios.blanco });
  }
  if (precios["roble-nogal"] != null) {
    rows.push({ keys: ["roble", "nogal"], label: "Roble – Nogal", precio: precios["roble-nogal"] });
  }
  if (precios["antracita-negro"] != null) {
    rows.push({ keys: ["antracita", "negro"], label: "Antracita – Negro", precio: precios["antracita-negro"] });
  }
  if (precios["negro-cafe"] != null) {
    rows.push({ keys: ["negro", "cafe"], label: "Negro – Café", precio: precios["negro-cafe"] });
  }
  if (precios["blanco-negro-cafe"] != null) {
    rows.push({ keys: ["blanco", "negro", "cafe"], label: "Blanco – Negro – Café", precio: precios["blanco-negro-cafe"] });
  }
  return rows;
}

function renderAccesorios(filtro = "todos") {
  const root = document.getElementById("acc-gallery");
  const items = window.STOCK_ACCESORIOS;

  if (!root || !Array.isArray(items)) return;

  const lista =
    filtro === "todos" ? items : items.filter((item) => item.categoria === filtro);

  if (!lista.length) {
    root.innerHTML = `<p class="stock-note">No hay productos en esta categoría.</p>`;
    return;
  }

  root.innerHTML = lista
    .map((item) => {
      const colorRows = item.precios ? preciosColorRows(item.precios) : [];
      const precioHtml = colorRows.length
        ? colorRows
            .map(
              (row) => `
            <span class="stock-price-line">
              <span class="acc-swatches" aria-label="${row.label}">
                ${row.keys.map((k) => `<i class="acc-swatch acc-swatch--${k}" aria-hidden="true"></i>`).join("")}
              </span>
              <span class="acc-swatch-price">${formatPrecio(row.precio)}</span>
            </span>`
            )
            .join("")
        : formatPrecio(item.precio);

      return `
        <article class="stock-item" data-categoria="${item.categoria}">
          <div class="stock-photo${item.id === 2 ? " stock-photo--acc-lg" : item.id === 1 ? " stock-photo--acc-md" : item.id === 32 ? " stock-photo--acc-foto8" : [3, 4, 5].includes(item.id) ? " stock-photo--acc-sm" : [6, 31].includes(item.id) ? " stock-photo--acc-xs" : [12, 33].includes(item.id) ? " stock-photo--acc-sm2" : ""}">
            <img src="${item.imagen}" alt="${item.nombre}" width="640" height="480" loading="lazy" />
          </div>
          <div class="stock-info">
            <p class="acc-cat">${item.categoria}</p>
            <h3>${item.nombre}</h3>
            <p class="stock-size">${item.detalle}</p>
            <p class="stock-price${colorRows.length ? " stock-price--multi" : ""}">${precioHtml}</p>
            <button
              type="button"
              class="stock-buy"
              data-add-cart="acc"
              data-id="${item.id}"
              data-nombre="${item.nombre.replace(/"/g, "&quot;")}"
              data-detalle="${String(item.detalle || "").replace(/"/g, "&quot;")}"
              data-precio="${item.precio}"
            >Agregar al carro</button>
            <img class="pay-logo" src="img/transbank.png" alt="Transbank" width="160" height="48" loading="lazy" />
          </div>
        </article>
      `;
    })
    .join("");
}

function initAccesorios() {
  const filters = document.getElementById("acc-filters");
  if (!filters) return;

  renderAccesorios("todos");

  filters.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-filter]");
    if (!btn) return;

    filters.querySelectorAll(".acc-filter").forEach((el) => {
      el.classList.toggle("is-active", el === btn);
    });

    renderAccesorios(btn.dataset.filter || "todos");
  });
}

renderStock();
renderHeroBestsellers();
initAccesorios();
initCalculadora();
initCarts();
initHeroCompare();

const formContacto = document.getElementById("form-contacto");

if (formContacto) {
  formContacto.addEventListener("submit", (event) => {
    event.preventDefault();

    const data = new FormData(formContacto);
    const nombre = String(data.get("nombre") || "").trim();
    const telefono = String(data.get("telefono") || "").trim();
    const mensaje = String(data.get("mensaje") || "").trim();

    if (!nombre || !telefono || !mensaje) {
      formContacto.reportValidity();
      return;
    }

    const texto = [
      "Hola, quiero cotizar ventanas PVC termopanel.",
      `Nombre: ${nombre}`,
      `Teléfono: ${telefono}`,
      `Mensaje: ${mensaje}`,
    ].join("\n");

    window.open(waUrl(texto), "_blank", "noopener,noreferrer");
  });
}
