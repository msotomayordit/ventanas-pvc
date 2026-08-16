// Cambia este número por tu WhatsApp real (código país + número, sin + ni espacios)
const WHATSAPP = "56950187327";

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
}

function initCarts() {
  document.addEventListener("click", (event) => {
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
initAccesorios();
initCalculadora();
initCarts();

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
