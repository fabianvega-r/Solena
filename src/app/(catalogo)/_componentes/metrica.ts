// Avisa al servidor de una visita o de un clic en WhatsApp. Nunca interrumpe al
// visitante: si falla, se ignora. `keepalive` deja terminar el envío aunque cambie de página.
export function enviarMetrica(tipo: "visita" | "whatsapp", ruta = window.location.pathname) {
  fetch("/api/metricas", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ tipo, ruta }),
    keepalive: true,
  }).catch(() => {});
}
