/**
 * Salary Service — RAL → retribuzione netta
 * Normativa IRPEF 2026 (approssimazione indicativa).
 *
 * Fonti:
 *  - TUIR Art. 13 — Detrazioni per reddito da lavoro dipendente
 *  - TUIR Art. 12 — Detrazioni per carichi di famiglia
 *  - DL 3/2020 Art. 1 — Trattamento Integrativo
 *  - L. 207/2024 Art. 1 commi 4-9 — Bonus / Ulteriore Detrazione
 */

// ─── Input ────────────────────────────────────────────────────────────────────

export type MealVoucherType = "electronic" | "paper";

export interface MealVoucherInput {
  type: MealVoucherType;
  daysPerMonth: number;
  valuePerDay: number;
}

export interface SalaryInput {
  ral: number;
  numMensilita: number;
  regionalTaxRate: number;
  municipalTaxRate: number;
  mealVoucher?: MealVoucherInput;
  hasSpouseDependent: boolean;
  dependentChildrenOver21: number;
  /** Quota della detrazione figli spettante: 100 (genitore unico/coniuge a carico)
   *  o 50 (ripartita tra i due genitori non separati — Art. 12 nota 3). */
  childrenDeductionShare: 50 | 100;
  otherDependents: number;
}

// ─── Output ───────────────────────────────────────────────────────────────────

export interface MealVoucherBreakdown {
  monthlyTotal: number;
  monthlyExempt: number;
  monthlyTaxable: number;
  annualTaxable: number;
}

export interface SalaryBreakdown {
  ral: number;
  inpsContributions: number;
  taxableIncome: number;
  // IRPEF
  irpefGross: number;
  employmentDeduction: number;
  spouseDeduction: number;
  childrenDeduction: number;
  otherDependentsDeduction: number;
  totalDeductions: number;
  ulterioreDeduzione: number;    // L.207/2024 non-rimborsabile (R 20k–40k)
  irpefAfterDeductions: number;  // max(0, irpefGross − detrazioni − ulterioreDed.)
  trattamentoIntegrativo: number; // DL 3/2020 — credito rimborsabile
  bonusL207: number;             // L.207/2024 bonus rimborsabile (R ≤ 20k)
  irpefNet: number;              // IRPEF finale (può essere negativa = beneficio cash)
  // Addizionali
  regionalTax: number;
  municipalTax: number;
  // Totali
  annualSalaryNet: number;       // netto retribuzione pura (senza buoni pasto)
  monthlyVoucherBenefit: number; // benefit mensile buoni pasto esenti
  annualNet: number;             // = annualSalaryNet + buoni pasto esenti annui
  monthlyNet: number;            // = annualSalaryNet / numMensilita + monthlyVoucherBenefit
  effectiveTaxRate: number;
  // Costo aziendale
  inpsContributionsDatoriali: number; // INPS a carico datore (~23.81%)
  tfr: number;                        // TFR accantonato (6.91% RAL — Art. 2120 c.c.)
  costoAziendale: number;             // RAL + INPS datoriale + TFR
  effectiveTaxRateWithEmployer: number; // pressione fiscale sul costo aziendale
  mealVoucher?: MealVoucherBreakdown;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Tronca a 4 cifre decimali (Art. 12 nota 5 TUIR). */
function truncate4(n: number): number {
  return Math.trunc(n * 10_000) / 10_000;
}

// ─── Costanti ─────────────────────────────────────────────────────────────────

const INPS_RATE = 0.0919;
/** Contributi INPS a carico del datore di lavoro (quota IVS + altri — approssimazione). */
const INPS_RATE_DATORIALE = 0.2381;
/** TFR: 6,91% della retribuzione utile annua (Art. 2120 c.c.). */
const TFR_RATE = 0.0691;

const MEAL_VOUCHER_EXEMPTION: Record<MealVoucherType, number> = {
  electronic: 10, // 2026: soglia elevata a €10/gg
  paper: 4,
};

// Scaglioni IRPEF 2026
const TAX_BRACKETS: { limit: number; rate: number }[] = [
  { limit: 28_000, rate: 0.23 },
  { limit: 50_000, rate: 0.33 }, // 2026: ridotto da 35% a 33%
  { limit: Infinity, rate: 0.43 },
];

// ─── IRPEF lorda ──────────────────────────────────────────────────────────────

function calculateIrpef(R: number): number {
  let tax = 0;
  let prev = 0;
  for (const { limit, rate } of TAX_BRACKETS) {
    if (R <= prev) break;
    tax += (Math.min(R, limit) - prev) * rate;
    prev = limit;
  }
  return tax;
}

// ─── Art. 13 TUIR — Detrazione lavoro dipendente ─────────────────────────────

function calculateEmploymentDeduction(R: number): number {
  if (R <= 15_000) return 1_955;

  const C28 = (28_000 - R) / 13_000;
  if (R <= 25_000) return 1_910 + 1_190 * C28;
  if (R <= 28_000) return 1_975 + 1_190 * C28; // +65 correttivo

  const C50 = (50_000 - R) / 22_000;
  if (R <= 35_000) return 65 + 1_910 * C50; // +65 correttivo
  if (R < 50_000) return 1_910 * C50;
  return 0;
}

// ─── Art. 12 TUIR — Detrazione coniuge a carico ──────────────────────────────

function calculateSpouseDeduction(R: number): number {
  if (R <= 15_000) return 800 - 110 * (R / 15_000);
  if (R <= 29_000) return 690;
  if (R <= 29_200) return 700;  // +10 correttivo
  if (R <= 34_700) return 710;  // +20 correttivo
  if (R <= 35_000) return 720;  // +30 correttivo
  if (R <= 35_100) return 710;  // +20 correttivo
  if (R <= 35_200) return 700;  // +10 correttivo
  if (R <= 40_000) return 690;
  if (R <= 80_000) return 690 * ((80_000 - R) / 40_000);
  return 0;
}

// ─── Art. 12 TUIR — Detrazione figli > 21 a carico ──────────────────────────

function calculateChildrenDeduction(R: number, n: number): number {
  if (n <= 0) return 0;
  // C troncato a 4 decimali (Art. 12 nota 5)
  const C = truncate4(Math.max(0, (80_000 - R + 15_000 * n) / (80_000 + 15_000 * n)));
  return 950 * C * n;
}

// ─── Art. 12 TUIR — Detrazione altri familiari a carico ──────────────────────

function calculateOtherDependentsDeduction(R: number, n: number): number {
  if (n <= 0) return 0;
  // C troncato a 4 decimali (Art. 12 nota 5)
  const C = truncate4(Math.max(0, (80_000 - R) / 80_000));
  return 750 * C * n;
}

// ─── DL 3/2020 Art. 1 — Trattamento Integrativo (credito rimborsabile) ───────

function calculateTrattamentoIntegrativo(
  R: number,
  irpefGross: number,
  employmentDeduction: number,
  totalDeductions: number
): number {
  if (R <= 15_000) {
    // Spetta se: IRPEF lorda − (detr. lavoro − 75) > 0
    return irpefGross - (employmentDeduction - 75) > 0 ? 1_200 : 0;
  }
  if (R <= 28_000) {
    // Spetta la quota di detrazioni che eccede l'IRPEF lorda, max 1.200
    return Math.min(1_200, Math.max(0, totalDeductions - irpefGross));
  }
  return 0;
}

// ─── L. 207/2024 Art. 1 commi 4-9 — Bonus / Ulteriore Detrazione ─────────────

interface BonusL207 {
  refundableCredit: number;      // bonus rimborsabile (R ≤ 20k)
  nonRefundableDeduction: number; // ulteriore detrazione non-rimborsabile (R 20k–40k)
}

function calculateBonusL207(R: number): BonusL207 {
  if (R <= 8_500) return { refundableCredit: R * 0.071, nonRefundableDeduction: 0 };
  if (R <= 15_000) return { refundableCredit: R * 0.053, nonRefundableDeduction: 0 };
  if (R <= 20_000) return { refundableCredit: R * 0.048, nonRefundableDeduction: 0 };
  if (R <= 32_000) return { refundableCredit: 0, nonRefundableDeduction: 1_000 };
  if (R <= 40_000) return { refundableCredit: 0, nonRefundableDeduction: 1_000 * ((40_000 - R) / 8_000) };
  return { refundableCredit: 0, nonRefundableDeduction: 0 };
}

// ─── Buoni pasto ──────────────────────────────────────────────────────────────

function calculateMealVoucher(input: MealVoucherInput): MealVoucherBreakdown {
  const threshold = MEAL_VOUCHER_EXEMPTION[input.type];
  const monthlyTotal = input.daysPerMonth * input.valuePerDay;
  const monthlyExempt = input.daysPerMonth * Math.min(input.valuePerDay, threshold);
  const monthlyTaxable = input.daysPerMonth * Math.max(0, input.valuePerDay - threshold);
  return {
    monthlyTotal,
    monthlyExempt,
    monthlyTaxable,
    annualTaxable: monthlyTaxable * 12,
  };
}

// ─── Export principale ────────────────────────────────────────────────────────

export function calculateSalary(input: SalaryInput): SalaryBreakdown {
  const { ral, numMensilita, regionalTaxRate, municipalTaxRate } = input;

  const inpsContributions = ral * INPS_RATE;

  const mealVoucher = input.mealVoucher
    ? calculateMealVoucher(input.mealVoucher)
    : undefined;

  const taxableIncome = ral - inpsContributions + (mealVoucher?.annualTaxable ?? 0);
  const R = taxableIncome;

  // ── IRPEF lorda ──
  const irpefGross = calculateIrpef(R);

  // ── Detrazioni non-rimborsabili (Art. 12-13 TUIR) ──
  const employmentDeduction = calculateEmploymentDeduction(R);
  const spouseDeduction = input.hasSpouseDependent ? calculateSpouseDeduction(R) : 0;
  // Quota 50% o 100% (Art. 12 nota 3 — ripartizione tra genitori)
  const childrenDeduction =
    calculateChildrenDeduction(R, input.dependentChildrenOver21) *
    (input.childrenDeductionShare / 100);
  const otherDependentsDeduction = calculateOtherDependentsDeduction(R, input.otherDependents);
  const totalDeductions =
    employmentDeduction + spouseDeduction + childrenDeduction + otherDependentsDeduction;

  // ── L.207/2024: ulteriore detrazione non-rimborsabile (R 20k–40k) ──
  const { refundableCredit: bonusL207, nonRefundableDeduction: ulterioreDeduzione } =
    calculateBonusL207(R);

  // Dopo tutte le detrazioni non-rimborsabili (floor a 0)
  const irpefAfterDeductions = Math.max(0, irpefGross - totalDeductions - ulterioreDeduzione);

  // ── Crediti rimborsabili (possono portare IRPEF in negativo = beneficio cash) ──
  const trattamentoIntegrativo = calculateTrattamentoIntegrativo(
    R,
    irpefGross,
    employmentDeduction,
    totalDeductions
  );

  // IRPEF finale: può essere negativa
  const irpefNet = irpefAfterDeductions - trattamentoIntegrativo - bonusL207;

  // ── Addizionali (calcolate sull'imponibile) ──
  const regionalTax = R * regionalTaxRate;
  const municipalTax = R * municipalTaxRate;

  // Netto retribuzione pura (esclusi buoni pasto)
  const annualSalaryNet = ral - inpsContributions - irpefNet - regionalTax - municipalTax;
  // Benefit mensile buoni pasto esenti (non legato alle mensilità)
  const monthlyVoucherBenefit = mealVoucher?.monthlyExempt ?? 0;
  // Netto totale: retribuzione + benefit buoni pasto
  const annualNet = annualSalaryNet + monthlyVoucherBenefit * 12;
  const monthlyNet = annualSalaryNet / numMensilita + monthlyVoucherBenefit;

  const totalTaxBurden = inpsContributions + irpefNet + regionalTax + municipalTax;
  const effectiveTaxRate = totalTaxBurden / ral;

  const inpsContributionsDatoriali = ral * INPS_RATE_DATORIALE;
  const tfr = ral * TFR_RATE;
  const costoAziendale = ral + inpsContributionsDatoriali + tfr;
  const effectiveTaxRateWithEmployer = 1 - annualNet / costoAziendale;

  return {
    ral,
    inpsContributions,
    taxableIncome,
    irpefGross,
    employmentDeduction,
    spouseDeduction,
    childrenDeduction,
    otherDependentsDeduction,
    totalDeductions,
    ulterioreDeduzione,
    irpefAfterDeductions,
    trattamentoIntegrativo,
    bonusL207,
    irpefNet,
    regionalTax,
    municipalTax,
    annualSalaryNet,
    monthlyVoucherBenefit,
    annualNet,
    monthlyNet,
    effectiveTaxRate,
    inpsContributionsDatoriali,
    tfr,
    costoAziendale,
    effectiveTaxRateWithEmployer,
    mealVoucher,
  };
}
