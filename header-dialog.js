(() => {
  "use strict";

  const WHATSAPP = "56950187327";
  const dialogs = {
    factory: {
      eyebrow: "Producción FRAME PVC", title: "¿Qué necesitas fabricar?", intro: "Fabricamos componentes terminados para que tu proyecto llegue listo a obra.",
      options: [
        { tone: "glass", mark: "01", title: "Vidrios termopanel", text: "Doble vidrio con cámara de aire, fabricado a la medida y listo para montar.", action: "Preparar cotización", message: "Hola, quiero cotizar vidrios termopanel fabricados a medida y listos para usar.", fields: ["Medidas aproximadas", "Cantidad", "Comuna"] },
        { tone: "window", mark: "02", title: "Ventanas listas", text: "Ventanas PVC termopanel terminadas: elige, recibe e instala.", action: "Entrar a la tienda", href: "tienda.html" }
      ]
    },
    install: {
      eyebrow: "Instálalo tú mismo", title: "Una ventana lista. Un proceso claro.", intro: "Te ayudamos a elegir la medida correcta y a preparar una instalación segura.",
      steps: ["Revisa la medida del vano", "Elige una ventana disponible", "Confirma antes de instalar"],
      options: [
        { tone: "window", mark: "→", title: "Elegir productos", text: "Compara medidas, disponibilidad y precio antes de decidir.", action: "Ir a la tienda", href: "tienda.html" },
        { tone: "support", mark: "?", title: "Necesito orientación", text: "Envíanos una foto y las medidas aproximadas del vano.", action: "Pedir orientación", message: "Hola, quiero instalar una ventana por mi cuenta y necesito orientación.", fields: ["Medidas aproximadas", "Comuna", "¿Qué necesitas revisar?"] }
      ]
    },
    quote: {
      eyebrow: "Cotiza tu proyecto", title: "Cuéntanos qué quieres resolver", intro: "Elige una ruta. Te pediremos solamente la información necesaria para preparar tu consulta.",
      options: [
        { tone: "window", mark: "V", title: "Ventanas PVC", text: "Crea un listado con cada medida y la cantidad que necesita tu casa.", action: "Crear listado", builder: "windows" },
        { tone: "glass", mark: "T", title: "Vidrio termopanel", text: "Unidades fabricadas a medida para ventanas, puertas o carpintería.", action: "Enviar cotización", message: "Hola, quiero cotizar fabricación de vidrios termopanel a medida.", fields: ["Medidas aproximadas", "Cantidad de vidrios", "Comuna"] },
        { tone: "visit", mark: "M", title: "Visita técnica", text: "Coordinemos medición y revisión del proyecto en terreno.", action: "Solicitar visita", message: "Hola, quiero solicitar una visita técnica para medir y cotizar ventanas PVC termopanel.", fields: ["Comuna", "Cantidad aproximada", "Horario preferido"] }
      ]
    },
    contact: {
      eyebrow: "Contacto directo", title: "Hablemos de tu proyecto", intro: "Escoge el canal que te resulte más cómodo. Te ayudaremos a definir el siguiente paso.",
      options: [
        { tone: "whatsapp", mark: "W", title: "WhatsApp", text: "Comparte fotos, medidas y ubicación del proyecto.", action: "Escribir ahora", message: "Hola, quiero hacer una consulta a FRAME PVC DEPOT.", fields: ["Nombre", "¿En qué podemos ayudarte?"] },
        { tone: "call", mark: "L", title: "Llamar", text: "+56 9 5018 7327", action: "Iniciar llamada", href: "tel:+56950187327" },
        { tone: "mail", mark: "@", title: "Correo", text: "msotomayord@framepvc.com", action: "Enviar correo", href: "mailto:msotomayord@framepvc.com" }
      ]
    }
  };

  const dialog = document.createElement("dialog");
  dialog.className = "nav-dialog";
  dialog.setAttribute("aria-labelledby", "nav-dialog-title");
  dialog.innerHTML = '<div class="nav-dialog-grip" aria-hidden="true"></div><button class="nav-dialog-close" type="button" aria-label="Cerrar ventana">×</button><div class="nav-dialog-content"></div><div class="nav-dialog-live" aria-live="polite"></div>';
  document.body.append(dialog);
  const content = dialog.querySelector(".nav-dialog-content");
  const closeButton = dialog.querySelector(".nav-dialog-close");
  let current = null;
  let lastTrigger = null;
  let closingTimer = 0;
  let windowLines = loadWindowLines();
  let activeWindowLine = Math.max(0, windowLines.length - 1);

  function loadWindowLines() { try { const saved = JSON.parse(sessionStorage.getItem("frame-pvc-window-quote")); return Array.isArray(saved) ? saved : []; } catch { return []; } }
  function saveWindowLines() { try { sessionStorage.setItem("frame-pvc-window-quote", JSON.stringify(windowLines)); } catch { /* La cotización continúa aunque el almacenamiento esté bloqueado. */ } }
  const money = (value) => `$${Number(value || 0).toLocaleString("es-CL")}`;
  const calculateWindow = (type, color, width, height) => {
    const tariffs = window.TARIFAS_CALCULADORA;
    const typeInfo = tariffs?.tipos?.[type], colorInfo = tariffs?.colores?.[color];
    if (!typeInfo || !colorInfo || !(width > 0) || !(height > 0)) return null;
    const rate = typeof typeInfo.precioM2 === "object" ? Number(typeInfo.precioM2[color]) : Number(typeInfo.precioM2) * Number(colorInfo.factor || 1);
    if (!(rate > 0)) return null;
    return { type, color, typeName: typeInfo.nombre, colorName: colorInfo.nombre, width, height, unit: Math.max(Math.round(width * height * rate / 1000) * 1000, Number(tariffs.minimo || 0)) };
  };

  const progressMarkup = (step) => `<div class="nav-dialog-progress" aria-label="Paso ${step} de 2"><span class="is-complete">1</span><i></i><span class="${step === 2 ? "is-complete" : ""}">2</span><small>Paso ${step} de 2</small></div>`;
  const optionMarkup = (option, index) => `<button class="nav-dialog-option nav-dialog-option--${option.tone}" type="button" data-dialog-option="${index}" style="--option-index:${index}"><span class="nav-dialog-visual"><i></i><b class="nav-dialog-mark" aria-hidden="true">${option.mark}</b></span><span class="nav-dialog-option-copy"><strong>${option.title}</strong><small>${option.text}</small><em>Elegir <span aria-hidden="true">→</span></em></span></button>`;
  const animateStage = (direction = 1) => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    content.animate([{ opacity: 0, transform: `translateX(${direction * 1.1}rem)` }, { opacity: 1, transform: "none" }], { duration: 320, easing: "cubic-bezier(.22,1,.36,1)" });
  };
  const closeMenus = () => {
    document.body.classList.remove("menu-open");
    document.querySelectorAll(".nav.is-open").forEach((nav) => nav.classList.remove("is-open"));
    document.querySelectorAll(".menu-toggle[aria-expanded=true]").forEach((button) => button.setAttribute("aria-expanded", "false"));
    document.querySelectorAll(".nav-overlay").forEach((overlay) => { overlay.hidden = true; });
  };
  const renderChoices = (animate = false) => {
    const data = dialogs[current];
    content.innerHTML = `<section class="nav-dialog-stage" data-stage="choices">${progressMarkup(1)}<p class="nav-dialog-eyebrow">${data.eyebrow}</p><h2 id="nav-dialog-title">${data.title}</h2><p class="nav-dialog-intro">${data.intro}</p>${data.steps ? `<ol class="nav-dialog-steps">${data.steps.map((step) => `<li>${step}</li>`).join("")}</ol>` : ""}<div class="nav-dialog-options">${data.options.map(optionMarkup).join("")}</div></section>`;
    if (animate) animateStage(-1);
  };
  const fieldMarkup = (label, index) => `<label>${label}<input type="text" name="field-${index}" autocomplete="off" placeholder="${label === "Comuna" ? "Ej. Concepción" : "Escribe aquí"}"></label>`;
  const renderDecision = (index) => {
    const option = dialogs[current].options[index];
    if (option.builder === "windows") { renderWindowBuilder(); return; }
    const fields = option.fields || [];
    content.innerHTML = `<section class="nav-dialog-stage" data-stage="decision">${progressMarkup(2)}<button class="nav-dialog-back" type="button" data-dialog-back><span aria-hidden="true">←</span> Cambiar opción</button><div class="nav-dialog-selection nav-dialog-option--${option.tone}"><span class="nav-dialog-visual"><i></i><b class="nav-dialog-mark" aria-hidden="true">${option.mark}</b></span><div><p>Seleccionaste</p><h2 id="nav-dialog-title">${option.title}</h2><span>${option.text}</span></div></div>${fields.length ? `<form class="nav-dialog-form" data-dialog-form data-option-index="${index}"><div>${fields.map(fieldMarkup).join("")}</div><button type="submit">${option.action}<span aria-hidden="true">→</span></button><small>Puedes continuar aunque no tengas todos los datos.</small></form>` : `<a class="nav-dialog-primary" href="${option.href}">${option.action}<span aria-hidden="true">→</span></a>`}</section>`;
    animateStage(1);
    content.querySelector("input, .nav-dialog-primary")?.focus();
  };
  const selectOptions = (values) => Object.entries(values || {}).map(([value, item]) => `<option value="${value}">${item.nombre}</option>`).join("");
  const renderWindowBuilder = () => {
    const tariffs = window.TARIFAS_CALCULADORA;
    content.innerHTML = `<section class="nav-dialog-stage nav-dialog-stage--builder" data-stage="window-builder">${progressMarkup(2)}<button class="nav-dialog-back" type="button" data-dialog-back><span aria-hidden="true">←</span> Cambiar opción</button><header class="window-builder-head"><div><p class="nav-dialog-eyebrow">Cotizador de ventanas</p><h2 id="nav-dialog-title">Arma el listado de tu casa</h2></div><div class="window-builder-project-total"><small>Total estimado</small><strong data-window-project-total>${money(0)}</strong></div></header><form class="window-builder-form" data-window-builder-form><label>Tipo<select name="type">${selectOptions(tariffs?.tipos)}</select></label><label>Color<select name="color">${selectOptions(tariffs?.colores)}</select></label><label>Ancho (m)<input name="width" type="number" min="0.4" max="4" step="0.01" value="1.20" inputmode="decimal" required></label><label>Alto (m)<input name="height" type="number" min="0.4" max="3" step="0.01" value="1.20" inputmode="decimal" required></label><label>Cantidad<input name="quantity" type="number" min="1" max="99" step="1" value="1" inputmode="numeric" required></label><div class="window-builder-preview"><span>Valor de esta medida</span><strong data-window-line-price>—</strong></div><button type="submit">+ Agregar medida</button></form><div class="window-project" data-window-project></div><div class="window-project-actions"><label>Comuna<input type="text" data-window-commune placeholder="Ej. Concepción"></label><button type="button" data-window-send disabled>Enviar listado por WhatsApp <span aria-hidden="true">→</span></button></div><p class="window-builder-note">Valor referencial puesto en bodega. Confirmaremos fabricación, descuentos por cantidad, despacho e instalación.</p></section>`;
    renderWindowProject();
    updateWindowPreview();
    animateStage(1);
    content.querySelector(".window-builder-form select")?.focus();
  };
  const currentWindowInput = () => {
    const form = content.querySelector("[data-window-builder-form]");
    if (!form) return null;
    const data = new FormData(form), width = Number(data.get("width")), height = Number(data.get("height")), quantity = Math.max(1, Math.min(99, Number(data.get("quantity")) || 1));
    const calculated = calculateWindow(String(data.get("type")), String(data.get("color")), width, height);
    return calculated ? { ...calculated, quantity, subtotal: calculated.unit * quantity } : null;
  };
  const updateWindowPreview = () => {
    const line = currentWindowInput(), output = content.querySelector("[data-window-line-price]");
    if (output) output.textContent = line ? `${money(line.subtotal)} · ${line.quantity} ${line.quantity === 1 ? "unidad" : "unidades"}` : "Revisa las medidas";
  };
  const renderWindowProject = () => {
    const root = content.querySelector("[data-window-project]");
    if (!root) return;
    const quantity = windowLines.reduce((sum, line) => sum + line.quantity, 0), total = windowLines.reduce((sum, line) => sum + line.subtotal, 0);
    activeWindowLine = Math.max(0, Math.min(activeWindowLine, windowLines.length - 1));
    const line = windowLines[activeWindowLine];
    root.innerHTML = line ? `<header><div><strong>${quantity} ${quantity === 1 ? "ventana" : "ventanas"}</strong><small>${windowLines.length} ${windowLines.length === 1 ? "medida" : "medidas"} en el listado</small></div><nav aria-label="Revisar medidas"><button type="button" data-window-prev aria-label="Medida anterior" ${activeWindowLine === 0 ? "disabled" : ""}>←</button><span>${activeWindowLine + 1} / ${windowLines.length}</span><button type="button" data-window-next aria-label="Medida siguiente" ${activeWindowLine === windowLines.length - 1 ? "disabled" : ""}>→</button></nav></header><article><div><b>${line.typeName}</b><span>${line.colorName} · ${line.width.toLocaleString("es-CL")} × ${line.height.toLocaleString("es-CL")} m</span></div><div><small>${line.quantity} × ${money(line.unit)}</small><strong>${money(line.subtotal)}</strong></div><button type="button" data-window-remove aria-label="Eliminar esta medida">×</button></article>` : '<div class="window-project-empty"><strong>Aún no agregas ventanas</strong><span>Completa los datos y presiona “Agregar medida”.</span></div>';
    content.querySelector("[data-window-project-total]").textContent = money(total);
    content.querySelector("[data-window-send]").disabled = !windowLines.length;
  };
  const addWindowLine = () => {
    const line = currentWindowInput();
    if (!line) return;
    const id = `${line.type}-${line.color}-${line.width}x${line.height}`;
    const existing = windowLines.find((item) => item.id === id);
    if (existing) { existing.quantity += line.quantity; existing.subtotal = existing.unit * existing.quantity; activeWindowLine = windowLines.indexOf(existing); }
    else { windowLines.push({ ...line, id }); activeWindowLine = windowLines.length - 1; }
    saveWindowLines(); renderWindowProject();
    dialog.querySelector(".nav-dialog-live").textContent = `Medida agregada. El proyecto tiene ${windowLines.reduce((sum, item) => sum + item.quantity, 0)} ventanas.`;
  };
  const sendWindowProject = () => {
    if (!windowLines.length) return;
    const commune = content.querySelector("[data-window-commune]")?.value.trim(), total = windowLines.reduce((sum, line) => sum + line.subtotal, 0);
    const lines = windowLines.flatMap((line, index) => [`${index + 1}. ${line.quantity} × ${line.typeName}`, `${line.colorName} · ${line.width.toLocaleString("es-CL")} × ${line.height.toLocaleString("es-CL")} m · ${money(line.subtotal)}`]);
    const message = ["Hola, quiero cotizar este listado de ventanas PVC termopanel:", ...lines, commune ? `Comuna: ${commune}` : "", `Total referencial: ${money(total)}`, "Quiero confirmar fabricación, descuentos, despacho e instalación."].filter(Boolean).join("\n");
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  };
  const openDialog = (name, trigger) => {
    if (!dialogs[name]) return;
    current = name;
    lastTrigger = trigger;
    closeMenus();
    renderChoices();
    dialog.classList.remove("is-closing");
    dialog.showModal();
    document.body.classList.add("nav-dialog-open");
    requestAnimationFrame(() => dialog.classList.add("is-visible"));
    closeButton.focus();
  };
  const finishClose = () => {
    clearTimeout(closingTimer);
    dialog.classList.remove("is-visible", "is-closing");
    if (dialog.open) dialog.close();
    document.body.classList.remove("nav-dialog-open");
    lastTrigger?.focus();
  };
  const closeDialog = () => {
    if (!dialog.open || dialog.classList.contains("is-closing")) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { finishClose(); return; }
    dialog.classList.add("is-closing");
    closingTimer = setTimeout(finishClose, 190);
  };
  const submitDecision = (form) => {
    const option = dialogs[current].options[Number(form.dataset.optionIndex)];
    const details = [...form.querySelectorAll("label")].map((label) => {
      const value = label.querySelector("input").value.trim();
      return value ? `${label.childNodes[0].textContent.trim()}: ${value}` : "";
    }).filter(Boolean);
    const message = [option.message, ...details].join("\n");
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  };

  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-nav-dialog]");
    if (trigger) { event.preventDefault(); openDialog(trigger.dataset.navDialog, trigger); return; }
    const option = event.target.closest("[data-dialog-option]");
    if (option) { renderDecision(Number(option.dataset.dialogOption)); return; }
    if (event.target.closest("[data-dialog-back]")) renderChoices(true);
    if (event.target.closest("[data-window-prev]")) { activeWindowLine -= 1; renderWindowProject(); }
    if (event.target.closest("[data-window-next]")) { activeWindowLine += 1; renderWindowProject(); }
    if (event.target.closest("[data-window-remove]")) { windowLines.splice(activeWindowLine, 1); activeWindowLine = Math.max(0, activeWindowLine - 1); saveWindowLines(); renderWindowProject(); }
    if (event.target.closest("[data-window-send]")) sendWindowProject();
  });
  content.addEventListener("input", (event) => { if (event.target.closest("[data-window-builder-form]")) updateWindowPreview(); });
  content.addEventListener("change", (event) => { if (event.target.closest("[data-window-builder-form]")) updateWindowPreview(); });
  content.addEventListener("submit", (event) => { if (event.target.matches("[data-dialog-form]")) { event.preventDefault(); submitDecision(event.target); } if (event.target.matches("[data-window-builder-form]")) { event.preventDefault(); addWindowLine(); } });
  closeButton.addEventListener("click", closeDialog);
  dialog.addEventListener("click", (event) => { if (event.target === dialog) closeDialog(); });
  dialog.addEventListener("cancel", (event) => { event.preventDefault(); closeDialog(); });
  dialog.addEventListener("close", () => document.body.classList.remove("nav-dialog-open"));
})();
