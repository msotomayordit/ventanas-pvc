(() => {
  "use strict";

  const WHATSAPP = "56950187327";
  const whatsapp = (message) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`;
  const dialogs = {
    factory: {
      eyebrow: "Producción FRAME PVC",
      title: "¿Qué necesitas fabricar?",
      intro: "Fabricamos componentes terminados para que tu proyecto llegue listo a obra.",
      options: [
        { mark: "01", title: "Vidrios termopanel", text: "Doble vidrio con cámara de aire, fabricado a la medida y listo para montar.", action: "Cotizar termopanel", href: whatsapp("Hola, quiero cotizar vidrios termopanel fabricados a medida y listos para usar.") },
        { mark: "02", title: "Ventanas listas", text: "Ventanas PVC termopanel terminadas: elige, recibe e instala.", action: "Ver ventanas", href: "tienda.html", local: true }
      ]
    },
    install: {
      eyebrow: "Instálalo tú mismo",
      title: "Una ventana lista. Un proceso claro.",
      intro: "Te ayudamos a elegir la medida correcta y a preparar una instalación segura.",
      steps: ["Revisa la medida del vano", "Elige una ventana disponible", "Recibe orientación antes de instalar"],
      options: [
        { mark: "→", title: "Elegir productos", text: "Compara medidas, disponibilidad y precio antes de decidir.", action: "Ir a la tienda", href: "tienda.html", local: true },
        { mark: "?", title: "Necesito orientación", text: "Envíanos una foto y las medidas aproximadas del vano.", action: "Consultar por WhatsApp", href: whatsapp("Hola, quiero instalar una ventana por mi cuenta. Necesito ayuda para elegir el producto y revisar las medidas.") }
      ]
    },
    quote: {
      eyebrow: "Cotiza tu proyecto",
      title: "Cuéntanos qué quieres resolver",
      intro: "Elige una ruta y abre una consulta preparada. No necesitas recorrer toda la página.",
      options: [
        { mark: "V", title: "Ventanas PVC", text: "Ventanas a medida o productos listos para instalar.", action: "Cotizar ventanas", href: whatsapp("Hola, quiero cotizar un proyecto de ventanas PVC termopanel. Estas son mis medidas y cantidades:") },
        { mark: "T", title: "Vidrio termopanel", text: "Unidades fabricadas a medida para ventanas, puertas o carpintería.", action: "Cotizar termopanel", href: whatsapp("Hola, quiero cotizar fabricación de vidrios termopanel a medida. Estas son mis medidas y cantidades:") },
        { mark: "M", title: "Visita técnica", text: "Coordinemos medición y revisión del proyecto en terreno.", action: "Solicitar visita", href: whatsapp("Hola, quiero solicitar una visita técnica a domicilio para medir y cotizar ventanas PVC termopanel.") }
      ]
    },
    contact: {
      eyebrow: "Contacto directo",
      title: "Hablemos de tu proyecto",
      intro: "Escoge el canal que te resulte más cómodo. Te ayudaremos a definir el siguiente paso.",
      options: [
        { mark: "W", title: "WhatsApp", text: "Comparte fotos, medidas y ubicación del proyecto.", action: "Escribir ahora", href: whatsapp("Hola, quiero hacer una consulta a FRAME PVC DEPOT.") },
        { mark: "L", title: "Llamar", text: "+56 9 5018 7327", action: "Iniciar llamada", href: "tel:+56950187327", local: true },
        { mark: "@", title: "Correo", text: "msotomayord@framepvc.com", action: "Enviar correo", href: "mailto:msotomayord@framepvc.com", local: true }
      ]
    }
  };

  const dialog = document.createElement("dialog");
  dialog.className = "nav-dialog";
  dialog.setAttribute("aria-labelledby", "nav-dialog-title");
  dialog.innerHTML = '<button class="nav-dialog-close" type="button" aria-label="Cerrar ventana">×</button><div class="nav-dialog-content"></div>';
  document.body.append(dialog);
  const content = dialog.querySelector(".nav-dialog-content");
  const closeButton = dialog.querySelector(".nav-dialog-close");
  let lastTrigger = null;

  const optionMarkup = (option) => `<article class="nav-dialog-option"><span class="nav-dialog-mark" aria-hidden="true">${option.mark}</span><div><h3>${option.title}</h3><p>${option.text}</p><a href="${option.href}"${option.local ? "" : ' target="_blank" rel="noopener noreferrer"'}>${option.action}<span aria-hidden="true">→</span></a></div></article>`;
  const closeMenus = () => {
    document.body.classList.remove("menu-open");
    document.querySelectorAll(".nav.is-open").forEach((nav) => nav.classList.remove("is-open"));
    document.querySelectorAll(".menu-toggle[aria-expanded=true]").forEach((button) => button.setAttribute("aria-expanded", "false"));
    document.querySelectorAll(".nav-overlay").forEach((overlay) => { overlay.hidden = true; });
  };
  const openDialog = (name, trigger) => {
    const data = dialogs[name];
    if (!data) return;
    lastTrigger = trigger;
    closeMenus();
    content.innerHTML = `<p class="nav-dialog-eyebrow">${data.eyebrow}</p><h2 id="nav-dialog-title">${data.title}</h2><p class="nav-dialog-intro">${data.intro}</p>${data.steps ? `<ol class="nav-dialog-steps">${data.steps.map((step) => `<li>${step}</li>`).join("")}</ol>` : ""}<div class="nav-dialog-options">${data.options.map(optionMarkup).join("")}</div>`;
    dialog.showModal();
    document.body.classList.add("nav-dialog-open");
    closeButton.focus();
  };
  const closeDialog = () => {
    if (!dialog.open) return;
    dialog.close();
    document.body.classList.remove("nav-dialog-open");
    lastTrigger?.focus();
  };

  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-nav-dialog]");
    if (trigger) { event.preventDefault(); openDialog(trigger.dataset.navDialog, trigger); }
  });
  closeButton.addEventListener("click", closeDialog);
  dialog.addEventListener("click", (event) => { if (event.target === dialog) closeDialog(); });
  dialog.addEventListener("close", () => document.body.classList.remove("nav-dialog-open"));
})();
