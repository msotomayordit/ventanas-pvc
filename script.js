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
  const items = window.STOCK_VENTANAS;

  if (!root || !Array.isArray(items)) return;

  root.innerHTML = items
    .map((item) => {
      const medida = formatMedida(item.ancho, item.alto);
      const precio = formatPrecio(item.precio);

      const mismaFoto = item.id >= 1 && item.id <= 13;
      const fotoCortada = [3, 4, 5, 7, 8, 10].includes(item.id);
      const fotoVertical = [11, 12, 13].includes(item.id);
      const photoClass = [
        "stock-photo",
        mismaFoto ? "stock-photo--small" : "",
        fotoCortada ? "stock-photo--full" : "",
        fotoVertical ? "stock-photo--portrait" : "",
      ]
        .filter(Boolean)
        .join(" ");
      const itemClass = mismaFoto ? "stock-item stock-item--compact" : "stock-item";

      return `
        <article class="${itemClass}">
          <div class="${photoClass}">
            <img src="${item.imagen}" alt="${item.modelo} ${medida}" width="640" height="480" loading="lazy" />
          </div>
          <div class="stock-info">
            <h3>${item.modelo}</h3>
            <p class="stock-size">${medida}</p>
            <p class="stock-price">${precio}</p>
            <button
              type="button"
              class="stock-buy"
              data-add-cart="stock"
              data-id="${item.id}"
              data-nombre="${item.modelo}"
              data-detalle="${medida}"
              data-precio="${item.precio}"
            >Agregar al carro</button>
            <img class="pay-logo" src="img/transbank.png" alt="Transbank" width="160" height="48" loading="lazy" />
          </div>
        </article>
      `;
    })
    .join("");
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
    allCards[target].scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest", inline: "start" });
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
