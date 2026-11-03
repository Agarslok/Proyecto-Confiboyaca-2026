"use client";

import { useState } from "react";
import { requestFollowUp, saveRadarDiagnosis } from "@/app/actions/radar";
import { useSite } from "@/components/site/useSite";
import { getSiteSnapshot } from "@/lib/session/site-session";
import { patchRadar, radarOf } from "@/lib/radar/store";

/** Teléfono personal al final del informe → columna contact_phone (independiente de phone). */
export function InterestButton({ plan }: { plan: string }) {
  const radar = radarOf(useSite());
  const contactPhone = radar.contactPhone;
  const [state, setState] = useState<"idle" | "saving" | "error">("idle");
  const [savedMsg, setSavedMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const digits = contactPhone.replace(/\D/g, "");
  const phoneOk = digits.length >= 10 && digits.length <= 13;
  const canSave = Boolean(radar.recordId && radar.editToken && phoneOk);

  function setContactPhone(value: string) {
    setSavedMsg("");
    setErrorMsg("");
    patchRadar({ contactPhone: value.replace(/[^\d+ ]/g, "") });
  }

  async function persist(requestContact: boolean) {
    if (!radar.recordId || !radar.editToken || !phoneOk) return false;
    setState("saving");
    setErrorMsg("");
    const snapshot = radarOf(getSiteSnapshot());
    const saved = await saveRadarDiagnosis(snapshot);
    if (!saved.ok) {
      setState("error");
      setErrorMsg(saved.error || "No se pudo guardar el número.");
      return false;
    }
    if (requestContact) {
      const token = snapshot.editToken || saved.editToken;
      if (!token) {
        setState("error");
        setErrorMsg("No se pudo confirmar el contacto. Recargue la página e intente de nuevo.");
        return false;
      }
      const ok = await requestFollowUp(saved.id, token);
      if (!ok) {
        setState("error");
        setErrorMsg("El número quedó guardado, pero no se pudo registrar la solicitud de contacto. Intente otra vez.");
        return false;
      }
      patchRadar({ followUpRequested: true });
      setSavedMsg(`Listo. Nos contactaremos al ${contactPhone.trim()} para la primera visita del ${plan}.`);
    } else {
      setSavedMsg("Número de contacto actualizado en su registro.");
    }
    setState("idle");
    return true;
  }

  return (
    <div className="radar-interest">
      <label className="radar-interest-label" htmlFor="radar-contact-phone">
        Su celular o WhatsApp (persona de contacto)
      </label>
      <input
        id="radar-contact-phone"
        name="contactPhone"
        type="tel"
        className="radar-interest-phone"
        autoComplete="tel-national"
        placeholder="300 123 4567"
        value={contactPhone}
        onChange={(event) => setContactPhone(event.target.value)}
        onBlur={() => {
          if (canSave) void persist(false);
        }}
      />
      <button
        type="button"
        className="btn btn-primary btn-lg"
        disabled={!canSave || state === "saving"}
        onClick={() => void persist(true)}
      >
        {state === "saving" ? "Guardando…" : "Enviar"}
      </button>
      {!radar.recordId || !radar.editToken ? (
        <p className="fine">Disponible cuando el diagnóstico quede guardado (código RAD en la parte superior).</p>
      ) : !phoneOk ? (
        <p className="fine">Escriba un número de al menos 10 dígitos.</p>
      ) : null}
      {savedMsg ? (
        <p className="radar-interest-done" role="status">
          ✓ {savedMsg}
        </p>
      ) : null}
      {errorMsg ? (
        <p className="err" role="alert">
          {errorMsg}
        </p>
      ) : null}
    </div>
  );
}
