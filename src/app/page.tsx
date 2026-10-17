// Página provisional: el diseño del catálogo viene en la siguiente etapa.
export default function Inicio() {
  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui" }}>
      <h1>Solena</h1>
      <p>La base de datos y la API del catálogo están listas.</p>
      <p><a href="/admin">Panel de administración</a></p>
      <ul>
        <li><a href="/api/colecciones">/api/colecciones</a></li>
        <li><a href="/api/prendas">/api/prendas</a></li>
        <li><a href="/api/categorias">/api/categorias</a></li>
      </ul>
    </main>
  );
}
