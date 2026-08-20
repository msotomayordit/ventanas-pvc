const VISIT_NAMESPACE = "framepvcdepot";
const VISIT_KEY = "visitas";
const SESSION_FLAG = "framepvc-visita-contada";
const COUNTER_API = "https://abacus.jasoncameron.dev";

function formatVisitas(value) {
  return Number(value).toLocaleString("es-CL");
}

function shouldCountHit() {
  try {
    if (sessionStorage.getItem(SESSION_FLAG)) return false;
  } catch {
    return true;
  }
  if (navigator.webdriver) return false;
  if (document.visibilityState === "hidden") return false;
  return true;
}

async function fetchVisitCount(hit) {
  const path = hit ? "hit" : "get";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetch(`${COUNTER_API}/${path}/${VISIT_NAMESPACE}/${VISIT_KEY}`, {
      signal: controller.signal,
    });
    if (!response.ok) throw new Error("No se pudo leer el contador");
    const data = await response.json();
    return Number(data.value) || 0;
  } finally {
    clearTimeout(timer);
  }
}

function renderVisitCount(value) {
  const label = formatVisitas(value);
  document.querySelectorAll("[data-visit-count]").forEach((el) => {
    el.textContent = label;
  });
  document.querySelectorAll(".visit-counter").forEach((el) => {
    el.hidden = false;
  });
}

async function initVisitCounter() {
  const hit = shouldCountHit();
  try {
    const value = await fetchVisitCount(hit);
    if (hit) {
      try {
        sessionStorage.setItem(SESSION_FLAG, "1");
      } catch {
        /* ignore private-mode quota */
      }
    }
    renderVisitCount(value);
  } catch {
    document.querySelectorAll(".visit-counter").forEach((el) => {
      el.hidden = true;
    });
  }
}

initVisitCounter();
