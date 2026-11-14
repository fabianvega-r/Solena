"use client";
// Elegir talla y color y preguntar por WhatsApp. El mensaje se arma solo con lo elegido.
// En el celular, una barra fija abajo repite el botón cuando el principal no está a la vista,
// con el mismo mensaje (talla y color incluidos).
import { useEffect, useRef, useState } from "react";
import { muestraDeColor } from "@/lib/colores";
import { Corazon } from "./Corazon";
import { EnlaceWhatsapp } from "./Seguimiento";

type Props = {
  prendaId: string;
  nombre: string;
  precio: string | null; // ya con formato, p. ej. "$ 189.000"
  medidasModelo: string | null; // «La modelo mide 1,70 y usa talla S»: ayuda a elegir talla
  tallas: string[];
  colores: string[];
  disponible: boolean;
};

function Opciones({ titulo, nombre, opciones, valor, cambiar, muestra }: {
  titulo: string;
  nombre: string;
  opciones: string[];
  valor: string;
  cambiar: (v: string) => void;
  // Solo para colores: el círculo con el color real junto al nombre.
  muestra?: (opcion: string) => string | null;
}) {
  if (opciones.length === 0) return null;
  return (
    <fieldset className="opciones">
      <legend>{titulo}</legend>
      <div>
        {opciones.map((o) => {
          const color = muestra?.(o);
          return (
            <label key={o}>
              <input type="radio" name={nombre} value={o} checked={valor === o} onChange={() => cambiar(o)} />
              <span>
                {color && <i className="muestra-color" style={{ background: color }} aria-hidden />}
                {o}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function SelectorCompra({ prendaId, nombre, precio, medidasModelo, tallas, colores, disponible }: Props) {
  const [talla, setTalla] = useState(tallas.length === 1 ? tallas[0] : "");
  const [color, setColor] = useState(colores.length === 1 ? colores[0] : "");
  const [enlace, setEnlace] = useState("");
  const [verBarra, setVerBarra] = useState(false);
  const acciones = useRef<HTMLDivElement>(null);

  // La dirección de la página solo se conoce en el navegador.
  useEffect(() => setEnlace(window.location.origin + window.location.pathname), []);

  // La barra fija aparece solo mientras el botón principal está fuera de la pantalla.
  useEffect(() => {
    const el = acciones.current;
    if (!el) return;
    const observador = new IntersectionObserver(([e]) => setVerBarra(!e.isIntersecting));
    observador.observe(el);
    return () => observador.disconnect();
  }, []);

  let mensaje: string;
  if (disponible) {
    const detalles = [talla && `talla ${talla}`, color && `color ${color}`].filter(Boolean).join(", ");
    mensaje = `Hola, me interesa ${nombre}${detalles ? ` (${detalles})` : ""}. ¿Está disponible?`;
  } else {
    mensaje = `Hola, vi ${nombre} en el catálogo y aparece agotada. ¿Va a volver a estar disponible?`;
  }

  const faltaElegir = disponible && ((tallas.length > 1 && !talla) || (colores.length > 1 && !color));
  const mensajeCompleto = enlace ? `${mensaje}\n${enlace}` : mensaje;
  const textoBoton = disponible ? "Preguntar por WhatsApp" : "Preguntar si vuelve";

  return (
    <div className="compra">
      {disponible && (
        <>
          <Opciones titulo="Talla" nombre="talla" opciones={tallas} valor={talla} cambiar={setTalla} />
          {medidasModelo && <p className="medidas-modelo">{medidasModelo}</p>}
          <Opciones titulo="Color" nombre="color" opciones={colores} valor={color} cambiar={setColor} muestra={muestraDeColor} />
        </>
      )}

      <div className="compra-acciones" ref={acciones}>
        <EnlaceWhatsapp className="boton" mensaje={mensajeCompleto}>
          {textoBoton}
        </EnlaceWhatsapp>
        <Corazon prendaId={prendaId} nombre={nombre} grande />
      </div>

      {/* Una línea corta en vez del mensaje completo: repetía el nombre de la prenda otra vez. */}
      <p className="mensaje-previo">
        {faltaElegir
          ? "Elige talla y color y se escribirán solos en el mensaje de WhatsApp."
          : disponible
            ? "Se abrirá WhatsApp con la prenda, tu talla y tu color ya escritos."
            : "Se abrirá WhatsApp para preguntar si vuelve a estar disponible."}
      </p>

      {/* Barra fija del celular (en computador queda oculta por CSS). aria-hidden mientras no se ve,
          para que el lector de pantalla no anuncie el botón dos veces. */}
      <div className="barra-compra" data-visible={verBarra || undefined} aria-hidden={!verBarra}>
        <div className="barra-compra-texto">
          <span className="barra-compra-nombre">{nombre}</span>
          {precio && <span className="barra-compra-precio">{precio}</span>}
        </div>
        <EnlaceWhatsapp className="boton" mensaje={mensajeCompleto} tabIndex={verBarra ? undefined : -1}>
          {disponible ? "WhatsApp" : "Preguntar"}
        </EnlaceWhatsapp>
      </div>
    </div>
  );
}
