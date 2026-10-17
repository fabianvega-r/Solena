import { redirect } from "next/navigation";
import { sesionActiva } from "@/lib/auth";
import { FormularioLogin } from "../_componentes/Formularios";

export default async function Login() {
  if (await sesionActiva()) redirect("/admin");
  return (
    <main className="centrado">
      <FormularioLogin />
    </main>
  );
}
