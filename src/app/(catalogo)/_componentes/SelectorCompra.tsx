"use client";
// Elegir talla y color y preguntar por WhatsApp. El mensaje se arma solo y se muestra
// antes de enviarlo, para que la persona sepa exactamente qué va a escribir.
import { useEffect, useState } from "react";
import { Corazon } from "./Corazon";
import { EnlaceWhatsapp } from "./Seguimiento";

type Props = {
  prendaId: string;
  nombre: string;
  tallas: string[];
  colores: string[];
  disponible: boolean;
};

function Opciones({ titulo, nombre, opciones, valor, cambiar }: {
  titulo: string;
  nombre: string;
  opciones: string[];
  valor: string;
  cambiar: (v: string) => void;
}) {
  if (opciones.length === 0) return null;
  return (
    <fieldset className="opciones">
      <legend>{titulo}</legend>
      <div>
        {opciones.map((o) => (
          <label key={o}>
            <input type="radio" name={nombre} value={o} checked={valor === o} onChange={() => cambiar(o)} />
            <span>{o}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function SelectorCompra({ prendaId, nombre, tallas, colores, disponible }: Props) {
  const [talla, setTalla] = useState(tallas.length === 1 ? tallas[0] : "");
  const [color, setColor] = useState(colores.length === 1 ? colores[0] : "");
  const [enlace, setEnlace] = useState("");

  // La dirección de la página solo se conoce en el navegador.
  useEffect(() => setEnlace(window.location.origin + window.location.pathname), []);

  let mensaje: string;
  if (disponible) {
    const detalles = [talla && `talla ${talla}`, color && `color ${color}`].filter(Boolean).join(", ");
    mensaje = `Hola, me interesa ${nombre}${detalles ? ` (${detalles})` : ""}. ¿Está disponible?`;
  } else {
    mensaje = `Hola, vi ${nombre} en el catálogo y aparece agotada. ¿Va a volver a estar disponible?`;
  }

  const faltaElegir = disponible && ((tallas.length > 1 && !talla) || (colores.length > 1 && !color));

  return (
    <div className="compra">
      {disponible && (
        <>
          <Opciones titulo="Talla" nombre="talla" opciones={tallas} valor={talla} cambiar={setTalla} />
          <Opciones titulo="Color" nombre="color" opciones={colores} valor={color} cambiar={setColor} />
        </>
      )}

      <div className="compra-acciones">
        <EnlaceWhatsapp className="boton" mensaje={enlace ? `${mensaje}\n${enlace}` : mensaje}>
          {disponible ? "Preguntar por WhatsApp" : "Preguntar si vuelve"}
        </EnlaceWhatsapp>
        <Corazon prendaId={prendaId} nombre={nombre} grande />
      </div>

      <p className="mensaje-previo">
        {faltaElegir ? "Elige talla y color para incluirlos en el mensaje. " : ""}
        Se abrirá WhatsApp con este mensaje: <q>{mensaje}</q>
      </p>
    </div>
  );
}
