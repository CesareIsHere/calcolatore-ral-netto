"use client";

import { useState } from "react";
import { REGIONS } from "@/lib/data/regions";
import {
  calculateSalary,
  MealVoucherType,
  SalaryBreakdown,
} from "@/lib/services/salary.service";

// ─── Formatter ────────────────────────────────────────────────────────────────

const EUR = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" });
const pct = (n: number) => `${(n * 100).toFixed(2)}%`;

// ─── Form state ───────────────────────────────────────────────────────────────

interface FormState {
  ral: string;
  numMensilita: string;
  region: string;
  municipalTaxRate: string;
  hasMealVouchers: boolean;
  mealVoucherType: MealVoucherType;
  mealVoucherDays: string;
  mealVoucherValue: string;
  hasSpouseDependent: boolean;
  dependentChildrenOver21: string;
  childrenDeductionShare: "50" | "100";
  otherDependents: string;
}

const DEFAULT_FORM: FormState = {
  ral: "",
  numMensilita: "13",
  region: "Lombardia",
  municipalTaxRate: "0.80",
  hasMealVouchers: false,
  mealVoucherType: "electronic",
  mealVoucherDays: "20",
  mealVoucherValue: "8",
  hasSpouseDependent: false,
  dependentChildrenOver21: "0",
  childrenDeductionShare: "100",
  otherDependents: "0",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [result, setResult] = useState<SalaryBreakdown | null>(null);
  const [error, setError] = useState("");

  const set = (patch: Partial<FormState>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();

    const ral = Number.parseFloat(form.ral.replace(",", "."));
    if (Number.isNaN(ral) || ral <= 0) {
      setError("Inserisci un valore RAL valido.");
      setResult(null);
      return;
    }

    const municipalRate = Number.parseFloat(form.municipalTaxRate.replace(",", "."));
    if (Number.isNaN(municipalRate) || municipalRate < 0) {
      setError("Inserisci un'aliquota comunale valida.");
      setResult(null);
      return;
    }

    const region = REGIONS.find((r) => r.name === form.region);
    if (!region) {
      setError("Seleziona una regione.");
      return;
    }

    setError("");
    setResult(
      calculateSalary({
        ral,
        numMensilita: Number.parseInt(form.numMensilita, 10),
        regionalTaxRate: region.additionalTaxRate,
        municipalTaxRate: municipalRate / 100,
        mealVoucher: form.hasMealVouchers
          ? {
              type: form.mealVoucherType,
              daysPerMonth: Number.parseInt(form.mealVoucherDays, 10) || 0,
              valuePerDay: Number.parseFloat(form.mealVoucherValue.replace(",", ".")) || 0,
            }
          : undefined,
        hasSpouseDependent: form.hasSpouseDependent,
        dependentChildrenOver21: Number.parseInt(form.dependentChildrenOver21, 10) || 0,
        // Se il coniuge è a carico, la detrazione figli spetta per intero (nota 3)
        childrenDeductionShare: form.hasSpouseDependent ? 100 : Number.parseInt(form.childrenDeductionShare, 10) as 50 | 100,
        otherDependents: Number.parseInt(form.otherDependents, 10) || 0,
      })
    );
  }

  return (
    <div className="px-4 py-12">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Calcolatore RAL → Netto
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Stima della retribuzione netta annua e mensile.{" "}
            <span className="italic">Calcolo approssimativo — IRPEF 2026.</span>
          </p>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* Left: Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Sezione 1: Reddito */}
            <Section title="Reddito">
              <div className="grid grid-cols-2 gap-4">
                <Field label="RAL (€)" htmlFor="ral">
                  <input
                    id="ral"
                    type="number"
                    min="1"
                    placeholder="es. 35000"
                    value={form.ral}
                    onChange={(e) => set({ ral: e.target.value })}
                    className={inputCls}
                  />
                </Field>

                <Field label="N. mensilità" htmlFor="mensilita">
                  <select
                    id="mensilita"
                    value={form.numMensilita}
                    onChange={(e) => set({ numMensilita: e.target.value })}
                    className={inputCls}
                  >
                    <option value="12">12</option>
                    <option value="13">13 (con tredicesima)</option>
                    <option value="14">14 (con quattordicesima)</option>
                  </select>
                </Field>
              </div>
            </Section>

            {/* Sezione 2: Fiscalità locale */}
            <Section title="Fiscalità locale">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Regione di residenza" htmlFor="region">
                  <select
                    id="region"
                    value={form.region}
                    onChange={(e) => set({ region: e.target.value })}
                    className={inputCls}
                  >
                    {REGIONS.map((r) => (
                      <option key={r.name} value={r.name}>
                        {r.name} ({pct(r.additionalTaxRate)})
                      </option>
                    ))}
                  </select>
                </Field>

                <Field
                  label="Addizionale comunale (%)"
                  htmlFor="municipal"
                  tooltip={{
                    text: "L'aliquota varia per comune. Il default (0.80%) è quello di Milano. Consulta il sito dell'Agenzia delle Entrate per trovare quella del tuo comune.",
                    linkUrl:
                      "https://www1.finanze.gov.it/finanze2/dipartimentopolitichefiscali/fiscalitalocale/nuova_addcomirpef/sceltaregione.htm",
                    linkLabel: "Cerca la tua aliquota →",
                  }}
                >
                  <input
                    id="municipal"
                    type="number"
                    min="0"
                    max="1"
                    step="0.01"
                    value={form.municipalTaxRate}
                    onChange={(e) => set({ municipalTaxRate: e.target.value })}
                    className={inputCls}
                  />
                </Field>
              </div>
            </Section>

            {/* Sezione 3: Buoni pasto */}
            <Section title="Buoni pasto">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.hasMealVouchers}
                  onChange={(e) => set({ hasMealVouchers: e.target.checked })}
                  className={checkboxCls}
                />
                <span className="text-sm text-zinc-700 dark:text-zinc-300">
                  Ho i buoni pasto
                </span>
              </label>

              {form.hasMealVouchers && (
                <div className="mt-4 grid grid-cols-3 gap-4">
                  <Field label="Tipo" htmlFor="voucherType">
                    <select
                      id="voucherType"
                      value={form.mealVoucherType}
                      onChange={(e) =>
                        set({ mealVoucherType: e.target.value as MealVoucherType })
                      }
                      className={inputCls}
                    >
                      <option value="electronic">Elettronico (esente ≤ €10/gg)</option>
                      <option value="paper">Cartaceo (esente ≤ €4/gg)</option>
                    </select>
                  </Field>

                  <Field label="Giorni/mese" htmlFor="voucherDays">
                    <input
                      id="voucherDays"
                      type="number"
                      min="1"
                      max="31"
                      value={form.mealVoucherDays}
                      onChange={(e) => set({ mealVoucherDays: e.target.value })}
                      className={inputCls}
                    />
                  </Field>

                  <Field label="Valore buono (€)" htmlFor="voucherValue">
                    <input
                      id="voucherValue"
                      type="number"
                      min="0"
                      step="0.50"
                      value={form.mealVoucherValue}
                      onChange={(e) => set({ mealVoucherValue: e.target.value })}
                      className={inputCls}
                    />
                  </Field>
                </div>
              )}
            </Section>

            {/* Sezione 4: Familiari a carico */}
            <Section title="Familiari a carico">
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.hasSpouseDependent}
                    onChange={(e) => set({ hasSpouseDependent: e.target.checked })}
                    className={checkboxCls}
                  />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">
                    Coniuge a carico
                  </span>
                </label>

                <div className="grid grid-cols-2 gap-4 pt-1">
                  <Field
                    label="Figli > 21 anni a carico"
                    htmlFor="children"
                    tooltip={{
                      text: "Figli under 21: coperti dall'Assegno Unico (INPS), nessuna detrazione IRPEF. Figli 21–24 anni: devono avere reddito < €4.000. Figli > 24 anni: reddito < €2.840,51. Detrazione: €950 × coefficiente per figlio.",
                    }}
                  >
                    <input
                      id="children"
                      type="number"
                      min="0"
                      value={form.dependentChildrenOver21}
                      onChange={(e) =>
                        set({ dependentChildrenOver21: e.target.value })
                      }
                      className={inputCls}
                    />
                  </Field>

                  {/* Quota ripartizione figli — solo se coniuge NON a carico e figli > 0 */}
                  {Number.parseInt(form.dependentChildrenOver21, 10) > 0 && !form.hasSpouseDependent && (
                    <Field
                      label="Quota detrazione figli"
                      htmlFor="childrenShare"
                      tooltip={{
                        text: "Per legge la detrazione si ripartisce al 50% tra i genitori non separati. Il 100% spetta al genitore unico, separato/affidatario, o quando il coniuge è a carico (Art. 12 nota 3).",
                      }}
                    >
                      <select
                        id="childrenShare"
                        value={form.childrenDeductionShare}
                        onChange={(e) =>
                          set({ childrenDeductionShare: e.target.value as "50" | "100" })
                        }
                        className={inputCls}
                      >
                        <option value="100">100% — genitore unico / separato</option>
                        <option value="50">50% — entrambi i genitori lavorano</option>
                      </select>
                    </Field>
                  )}

                  <Field
                    label="Altri familiari a carico"
                    htmlFor="others"
                    tooltip={{ text: "Detrazione di €750 per ogni altro familiare fiscalmente a carico (es. genitori, fratelli/sorelle)." }}
                  >
                    <input
                      id="others"
                      type="number"
                      min="0"
                      value={form.otherDependents}
                      onChange={(e) => set({ otherDependents: e.target.value })}
                      className={inputCls}
                    />
                  </Field>
                </div>
              </div>
            </Section>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button type="submit" className={btnCls}>
              Calcola
            </button>
          </form>

          {/* Right: Results */}
          <div className="lg:sticky lg:top-8">
            {result ? (
              <Results result={result} numMensilita={Number.parseInt(form.numMensilita, 10)} />
            ) : (
              <div className="flex items-center justify-center rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700 py-20">
                <p className="text-sm text-zinc-400 dark:text-zinc-500">
                  Inserisci i dati e premi Calcola
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Results ──────────────────────────────────────────────────────────────────

function Results({
  result,
  numMensilita,
}: {
  readonly result: SalaryBreakdown;
  readonly numMensilita: number;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Highlight */}
      <div className="grid grid-cols-2 gap-6 bg-zinc-900 dark:bg-zinc-50 px-6 py-5">
        <Highlight
          label="Netto annuo"
          value={EUR.format(result.annualNet)}
        />
        <Highlight
          label={`Netto mensile (su ${numMensilita})`}
          value={EUR.format(result.monthlyNet)}
        />
      </div>

      {/* Breakdown */}
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800 px-6">
        <BreakdownSection title="Base imponibile">
          <Row label="RAL lorda" value={EUR.format(result.ral)} />
          <Row
            label="Contributi INPS (9.19%)"
            value={`−${EUR.format(result.inpsContributions)}`}
            muted
          />
          <Row label="Imponibile IRPEF" value={EUR.format(result.taxableIncome)} bold />
        </BreakdownSection>

        <BreakdownSection title="IRPEF">
          <Row label="IRPEF lorda" value={`−${EUR.format(result.irpefGross)}`} muted />
          <Row
            label="Det. lavoro dipendente (Art. 13)"
            value={`+${EUR.format(result.employmentDeduction)}`}
          />
          {result.spouseDeduction > 0 && (
            <Row
              label="Det. coniuge a carico (Art. 12)"
              value={`+${EUR.format(result.spouseDeduction)}`}
            />
          )}
          {result.childrenDeduction > 0 && (
            <Row
              label="Det. figli > 21 a carico (Art. 12)"
              value={`+${EUR.format(result.childrenDeduction)}`}
            />
          )}
          {result.otherDependentsDeduction > 0 && (
            <Row
              label="Det. altri familiari (Art. 12)"
              value={`+${EUR.format(result.otherDependentsDeduction)}`}
            />
          )}
          {result.ulterioreDeduzione > 0 && (
            <Row
              label="Ulteriore detrazione (L.207/2024)"
              value={`+${EUR.format(result.ulterioreDeduzione)}`}
            />
          )}
          <Row
            label="IRPEF dopo detrazioni"
            value={`−${EUR.format(result.irpefAfterDeductions)}`}
            bold
          />
          {result.trattamentoIntegrativo > 0 && (
            <Row
              label="Trattamento integrativo (DL 3/2020)"
              value={`+${EUR.format(result.trattamentoIntegrativo)}`}
              credit
            />
          )}
          {result.bonusL207 > 0 && (
            <Row
              label="Bonus L.207/2024"
              value={`+${EUR.format(result.bonusL207)}`}
              credit
            />
          )}
          <Row
            label="IRPEF finale"
            value={
              result.irpefNet < 0
                ? `+${EUR.format(Math.abs(result.irpefNet))} (credito)`
                : `−${EUR.format(result.irpefNet)}`
            }
            bold
            credit={result.irpefNet < 0}
          />
        </BreakdownSection>

        <BreakdownSection title="Addizionali">
          <Row
            label="Addizionale regionale"
            value={`−${EUR.format(result.regionalTax)}`}
            muted
          />
          <Row
            label="Addizionale comunale"
            value={`−${EUR.format(result.municipalTax)}`}
            muted
          />
        </BreakdownSection>

        {result.mealVoucher && (
          <BreakdownSection title="Buoni pasto">
            <Row
              label="Valore mensile totale"
              value={EUR.format(result.mealVoucher.monthlyTotal)}
            />
            {result.mealVoucher.monthlyTaxable > 0 && (
              <Row
                label="Quota imponibile (mensile)"
                value={`−${EUR.format(result.mealVoucher.monthlyTaxable)}`}
                muted
              />
            )}
            <Row
              label="Benefit mensile netto (esente)"
              value={`+${EUR.format(result.monthlyVoucherBenefit)}`}
              credit
            />
          </BreakdownSection>
        )}

        <div className="py-2 flex items-center justify-between">
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            Pressione fiscale effettiva (sul dipendente)
          </span>
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {pct(result.effectiveTaxRate)}
          </span>
        </div>
        <div className="py-2 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800">
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            TFR accantonato{" "}
            <span className="text-xs text-zinc-400 dark:text-zinc-600">
              (6,91% RAL — Art. 2120 c.c.)
            </span>
          </span>
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {EUR.format(result.tfr)}
          </span>
        </div>
        <div className="py-2 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800">
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            Costo aziendale{" "}
            <span className="text-xs text-zinc-400 dark:text-zinc-600">
              (RAL + INPS datoriale ~23,81% + TFR 6,91%)
            </span>
          </span>
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {EUR.format(result.costoAziendale)}
          </span>
        </div>
        <div className="py-2 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800">
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            Pressione fiscale totale{" "}
            <span className="text-xs text-zinc-400 dark:text-zinc-600">
              (incluso INPS datoriale)
            </span>
          </span>
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {pct(result.effectiveTaxRateWithEmployer)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── UI primitives ────────────────────────────────────────────────────────────

function Section({ title, children }: { readonly title: string; readonly children: React.ReactNode }) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

interface TooltipProps {
  text: string;
  linkUrl?: string;
  linkLabel?: string;
}

function Field({
  label,
  htmlFor,
  tooltip,
  children,
}: {
  readonly label: string;
  readonly htmlFor: string;
  readonly tooltip?: TooltipProps;
  readonly children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={htmlFor}
        className="flex items-center gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300"
      >
        {label}
        {tooltip && <InfoTooltip {...tooltip} />}
      </label>
      {children}
    </div>
  );
}

function InfoTooltip({ text, linkUrl, linkLabel }: Readonly<TooltipProps>) {
  return (
    <span className="group relative inline-flex items-center">
      <span className="flex h-4 w-4 cursor-help items-center justify-center rounded-full bg-zinc-200 text-[10px] font-bold text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400">
        i
      </span>
      <span className="pointer-events-none absolute bottom-6 left-1/2 z-10 w-64 -translate-x-1/2 rounded-lg bg-zinc-800 px-3 py-2.5 text-xs leading-relaxed text-white opacity-0 shadow-xl transition-opacity group-hover:opacity-100 dark:bg-zinc-950">
        {text}
        {linkUrl && (
          <a
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1.5 block text-blue-300 hover:underline"
            style={{ pointerEvents: "auto" }}
          >
            {linkLabel ?? linkUrl}
          </a>
        )}
      </span>
    </span>
  );
}

function BreakdownSection({ title, children }: { readonly title: string; readonly children: React.ReactNode }) {
  return (
    <div className="py-1">
      <p className="pb-1 pt-3 text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
        {title}
      </p>
      {children}
    </div>
  );
}

function Row({
  label,
  value,
  muted = false,
  bold = false,
  credit = false,
}: {
  readonly label: string;
  readonly value: string;
  readonly muted?: boolean;
  readonly bold?: boolean;
  readonly credit?: boolean;
}) {
  const base = "flex items-center justify-between py-2 text-sm";

  let labelCls = "text-zinc-600 dark:text-zinc-300";
  if (credit) labelCls = "text-emerald-600 dark:text-emerald-400";
  else if (muted) labelCls = "text-zinc-400 dark:text-zinc-500";

  let valueCls = "text-zinc-900 dark:text-zinc-50";
  if (credit) valueCls = bold ? "font-semibold text-emerald-600 dark:text-emerald-400" : "text-emerald-600 dark:text-emerald-400";
  else if (bold) valueCls = "font-semibold text-zinc-900 dark:text-zinc-50";
  else if (muted) valueCls = "text-zinc-400 dark:text-zinc-500";

  return (
    <div className={base}>
      <span className={labelCls}>{label}</span>
      <span className={valueCls}>{value}</span>
    </div>
  );
}

function Highlight({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold text-white dark:text-zinc-900">{value}</p>
    </div>
  );
}

// ─── Shared class strings ─────────────────────────────────────────────────────

const inputCls =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:ring-zinc-100";

const checkboxCls =
  "h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 dark:border-zinc-600 dark:bg-zinc-800";

const btnCls =
  "w-full rounded-lg bg-zinc-900 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200";
