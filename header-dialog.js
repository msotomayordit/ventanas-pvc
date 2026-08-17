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
        { tone: "window", mark: "V", title: "Ventanas PVC", text: "Ventanas a medida o productos listos para instalar.", action: "Enviar cotización", message: "Hola, quiero cotizar un proyecto de ventanas PVC termopanel.", fields: ["Medidas aproximadas", "Cantidad de ventanas", "Comuna"] },
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
    const fields = option.fields || [];
    content.innerHTML = `<section class="nav-dialog-stage" data-stage="decision">${progressMarkup(2)}<button class="nav-dialog-back" type="button" data-dialog-back><span aria-hidden="true">←</span> Cambiar opción</button><div class="nav-dialog-selection nav-dialog-option--${option.tone}"><span class="nav-dialog-visual"><i></i><b class="nav-dialog-mark" aria-hidden="true">${option.mark}</b></span><div><p>Seleccionaste</p><h2 id="nav-dialog-title">${option.title}</h2><span>${option.text}</span></div></div>${fields.length ? `<form class="nav-dialog-form" data-dialog-form data-option-index="${index}"><div>${fields.map(fieldMarkup).join("")}</div><button type="submit">${option.action}<span aria-hidden="true">→</span></button><small>Puedes continuar aunque no tengas todos los datos.</small></form>` : `<a class="nav-dialog-primary" href="${option.href}">${option.action}<span aria-hidden="true">→</span></a>`}</section>`;
    animateStage(1);
    content.querySelector("input, .nav-dialog-primary")?.focus();
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
  });
  content.addEventListener("submit", (event) => { if (event.target.matches("[data-dialog-form]")) { event.preventDefault(); submitDecision(event.target); } });
  closeButton.addEventListener("click", closeDialog);
  dialog.addEventListener("click", (event) => { if (event.target === dialog) closeDialog(); });
  dialog.addEventListener("cancel", (event) => { event.preventDefault(); closeDialog(); });
  dialog.addEventListener("close", () => document.body.classList.remove("nav-dialog-open"));
})();
