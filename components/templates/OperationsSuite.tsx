"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { sectorOpsPack } from "@/lib/ops/sector/pack";
import {
  applyCrmSnapshot,
  cloneCrmCatalog,
  commitAndPersist,
  crmSessionKey,
  readCrmSession,
  writeCrmSession,
  type CommitResult,
  type CrmEntityState,
} from "@/lib/ops/records";
import type { CapturedRowInput } from "@/lib/assistant/crm-state";
import { compactProfileGuidance } from "@/lib/ops/sector/profile-builder";
import {
  quotaRemaining,
  readOpsChatSession,
  sessionStorageKey,
  SESSION_QUOTA,
  SESSION_REACTIVATE_PASSWORD,
  writeOpsChatSession,
} from "@/lib/assistant/session-quota";
import { workspaceScope } from "@/lib/assistant/workspace";
import { operationsThemeVars } from "@/lib/site/operations-theme";
import type { SiteConfig } from "@/types/site";
import { SectorCrmPanel } from "@/components/templates/SectorCrmPanel";
import { SessionReactivateModal } from "@/components/templates/SessionReactivateModal";
import { TourismAssistantChat } from "@/components/templates/TourismAssistantChat";
import { TourismDashboardPanel } from "@/components/templates/TourismDashboardPanel";
import styles from "./tourism-operations.module.css";

type TabId = "asistente" | "registros" | "tablero";

const TABS: { id: TabId; label: string; desc: string }[] = [
  { id: "asistente", label: "Asistente", desc: "Conversación" },
  { id: "registros", label: "Base de datos", desc: "Registros" },
  { id: "tablero", label: "Dashboard", desc: "Indicadores" },
];

/** Tres vistas sobre el mismo estado. La industria entra por configuración, no por otro motor. */
export function OperationsSuite({ config }: { config: SiteConfig }) {
  const pack = useMemo(() => sectorOpsPack(config), [config]);
  const sector = pack.sector;
  const [tab, setTab] = useState<TabId>("asistente");
  /** Una empresa = un espacio: mismo código RAD, o industria+actividad si es demo. */
  const scope = workspaceScope(pack.industryId, pack.activityId);
  const crmKey = crmSessionKey(config.recordCode, scope);
  const chatKey = sessionStorageKey(config.recordCode, scope);
  const [crmEntities, setCrmEntities] = useState<CrmEntityState[]>(() => cloneCrmCatalog(pack.crmCatalog));
  /** Última versión guardada: las escrituras parten de aquí, no de un render antiguo. */
  const crmRef = useRef<CrmEntityState[]>(crmEntities);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [focusLabel, setFocusLabel] = useState<string | null>(null);
  const [quotaUsed, setQuotaUsed] = useState(0);
  const [reactivateOpen, setReactivateOpen] = useState(false);
  const [pendingStarter, setPendingStarter] = useState<string | null>(null);
  const remaining = quotaRemaining(quotaUsed);
  const quotaPct = Math.min(100, Math.round((quotaUsed / SESSION_QUOTA) * 100));
  const quotaTone = remaining <= 0 ? "empty" : remaining <= 40 ? "low" : "ok";

  useEffect(() => {
    const saved = readOpsChatSession(chatKey);
    setQuotaUsed(saved ? saved.used : 0);
  }, [chatKey]);

  const loadFromStorage = useCallback(() => {
    const base = cloneCrmCatalog(pack.crmCatalog);
    const saved = readCrmSession(crmKey);
    const next = saved ? applyCrmSnapshot(base, saved) : base;
    crmRef.current = next;
    setCrmEntities(next);
  }, [crmKey, pack.crmCatalog]);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  /** Otra pestaña de la misma empresa guardó algo: se recarga la misma fuente de verdad. */
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === crmKey) loadFromStorage();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [crmKey, loadFromStorage]);

  /** Cambios de la base de datos (celdas, filas manuales): se guarda primero, se muestra después. */
  const saveEntities = useCallback(
    (next: CrmEntityState[]): boolean => {
      if (!writeCrmSession(crmKey, next)) {
        setStorageError("No se pudo guardar en este navegador. El cambio no quedó registrado.");
        return false;
      }
      setStorageError(null);
      crmRef.current = next;
      setCrmEntities(next);
      return true;
    },
    [crmKey],
  );

  /** Registro desde el asistente: validar → guardar → recién entonces confirmar. */
  const recordCaptured = useCallback(
    (row: CapturedRowInput, opId: string): CommitResult => {
      const result = commitAndPersist(crmRef.current, row, { key: crmKey, opId });
      if (result.ok && result.status === "created") {
        setStorageError(null);
        crmRef.current = result.entities;
        setCrmEntities(result.entities);
        setFocusLabel(result.tableLabel);
      } else if (!result.ok && result.reason === "storage") {
        setStorageError(result.message);
      }
      return result;
    },
    [crmKey],
  );

  const tryInAssistant = useCallback((starter: string) => {
    setPendingStarter(starter);
    setTab("asistente");
  }, []);

  const profileGuidance = useMemo(() => compactProfileGuidance(sector.profile, 580), [sector.profile]);

  return (
    <div className={styles.operations} id={sector.anchorId} style={operationsThemeVars(config.templateId)}>
      <header className={styles.introCompact}>
        <p className={styles.introLabel}>{sector.introLabel}</p>
      </header>

      <div className={styles.triple}>
        <div className={styles.tabs} role="tablist" aria-label="Vistas del asistente empresarial">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              className={`${styles.tab}${tab === item.id ? ` ${styles.tabOn}` : ""}`}
              onClick={() => setTab(item.id)}
            >
              {item.label}
              <span className={styles.tabDesc}>{item.desc}</span>
            </button>
          ))}
        </div>

        <div
          className={`${styles.quota}${quotaTone === "low" ? ` ${styles.quotaLow}` : ""}${quotaTone === "empty" ? ` ${styles.quotaEmpty}` : ""}`}
          aria-live="polite"
        >
          <div className={styles.quotaCopy}>
            <span className={styles.quotaLabel}>Cupo de esta sesión</span>
            <strong className={styles.quotaValue}>
              {remaining <= 0 ? "Agotado" : `${remaining} de ${SESSION_QUOTA}`}
            </strong>
          </div>
          <div className={styles.quotaTrack} role="meter" aria-valuemin={0} aria-valuemax={SESSION_QUOTA} aria-valuenow={remaining} aria-label="Cupo restante de esta sesión">
            <span className={styles.quotaFill} style={{ width: `${100 - quotaPct}%` }} />
          </div>
        </div>

        <div className={styles.panelArea}>
          {storageError ? (
            <p className={styles.storageError} role="alert">
              {storageError}
            </p>
          ) : null}
          <div hidden={tab !== "asistente"}>
            <TourismAssistantChat
              spec={pack.assistant}
              site={config}
              entities={crmEntities}
              sectorLabel={sector.sectorLabel}
              locked={remaining <= 0}
              quotaUsed={quotaUsed}
              starters={sector.starters}
              placeholder={sector.composerPlaceholder}
              companyFallback={sector.companyFallback}
              inputId={sector.inputId}
              opsProfileGuidance={profileGuidance}
              orientationLine={sector.profile.mainActivities.slice(0, 2).join(" · ")}
              onSpend={(cost) => setQuotaUsed((used) => Math.min(SESSION_QUOTA, used + cost))}
              onQuotaHydrate={(used) => setQuotaUsed(used)}
              onRecord={recordCaptured}
              scope={scope}
              onReactivate={() => setReactivateOpen(true)}
              pendingStarter={pendingStarter}
              onPendingStarterHandled={() => setPendingStarter(null)}
            />
          </div>
          <div hidden={tab !== "registros"} className={styles.panel}>
            <SectorCrmPanel
              catalog={pack.crmCatalog}
              entities={crmEntities}
              onEntitiesChange={saveEntities}
              focusLabel={focusLabel}
              profile={sector.profile}
              onTryInAssistant={tryInAssistant}
            />
          </div>
          <div hidden={tab !== "tablero"} className={`${styles.panel} ${styles.panelDash}`}>
            <div className={styles.panelDashScroll}>
              <TourismDashboardPanel
                entities={crmEntities}
                sectorLabel={sector.sectorLabel}
                binding={sector.dashboard}
                copy={sector.copy}
                exampleOperations={sector.profile.initialQuestions}
                onTryInAssistant={tryInAssistant}
              />
            </div>
          </div>
        </div>
      </div>

      <SessionReactivateModal
        open={reactivateOpen}
        onClose={() => setReactivateOpen(false)}
        onConfirm={(password) => {
          if (password.trim() !== SESSION_REACTIVATE_PASSWORD) return false;
          const saved = readOpsChatSession(chatKey);
          writeOpsChatSession(chatKey, { used: 0, thread: saved?.thread ?? [] });
          setQuotaUsed(0);
          setReactivateOpen(false);
          return true;
        }}
      />
    </div>
  );
}
