"use client";

import { useActionState } from "react";
import { loginConsultor, type LoginState } from "@/app/actions/radar";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginConsultor, {});
  return (
    <form action={action} className="card consultor-login">
      <p className="micro accent">Radar IA · acceso restringido</p>
      <h1 className="display">Panel de consultores</h1>
      <p className="fine">Solo para el equipo del proyecto. Aquí están los diagnósticos guardados de todas las empresas.</p>
      <div className="field">
        <label className="q-help" htmlFor="password">Contraseña del equipo</label>
        <input id="password" name="password" type="password" className="text-in sm" autoComplete="current-password" required />
      </div>
      <p className="err" role="alert">{state.error ?? ""}</p>
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Verificando…" : "Entrar"}
      </button>
    </form>
  );
}
