// «Sobre Solena»: cómo nació la marca y quién la fundó. Se muestra en /sobre-solena y, resumido, en el inicio.
import { exigirAdmin } from "@/lib/auth";
import { obtenerMarca } from "@/lib/marca";
import { FormularioMarca } from "../../_componentes/Formularios";
import { FotoMarca } from "../../_componentes/FotoMarca";

export default async function SobreSolena() {
  await exigirAdmin();
  const { foto, ...textos } = await obtenerMarca();

  return (
    <>
      <div className="encabezado">
        <h1>Sobre Solena</h1>
        <a href="/sobre-solena" target="_blank" rel="noreferrer" className="boton">
          Ver en el catálogo
        </a>
      </div>
      <p className="ayuda">
        Cuéntale a tus clientas cómo nació Solena y quién está detrás. Se muestra en la página «Sobre Solena» del
        catálogo, y un resumen al final del inicio.
      </p>
      <FormularioMarca marca={textos} fotoFundadora={<FotoMarca inicial={foto} />} />
    </>
  );
}
