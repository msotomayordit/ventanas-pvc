// TARIFAS CALCULADORA — edita estos valores cuando cambien tus precios
// precioM2 puede ser:
//   - un número (precio blanco) × factor de color
//   - un objeto por color (precio exacto por m² según color)

window.TARIFAS_CALCULADORA = {
  minimo: 89000,
  tipos: {
    corredera: {
      nombre: "Ventana corredera",
      precioM2: {
        blanco: 160000,
        nogal: 205000,
        "roble-dorado": 205000,
        antracita: 220000,
        negro: 220000,
      },
    },
    proyectante: {
      nombre: "Ventana proyectante",
      precioM2: {
        blanco: 160000,
        nogal: 205000,
        "roble-dorado": 205000,
        antracita: 220000,
        negro: 220000,
      },
    },
    puerta: {
      nombre: "Ventana puerta",
      precioM2: {
        blanco: 175000,
        nogal: 220000,
        "roble-dorado": 220000,
        antracita: 237000,
        negro: 237000,
      },
    },
    fija: {
      nombre: "Ventana fija",
      precioM2: {
        blanco: 145000,
        nogal: 175000,
        "roble-dorado": 175000,
        antracita: 175000,
        negro: 175000,
      },
    },
  },
  colores: {
    blanco: { nombre: "Blanco", factor: 1 },
    nogal: { nombre: "Nogal", factor: 1 },
    "roble-dorado": { nombre: "Roble dorado", factor: 1 },
    antracita: { nombre: "Antracita", factor: 1 },
    negro: { nombre: "Negro", factor: 1 },
  },
};
