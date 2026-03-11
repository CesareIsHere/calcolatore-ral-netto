/**
 * Salary Service — Gross Salary (RAL) → Net Salary
 * 2026 IRPEF Regulations (approximate estimate).
 *
 * Sources:
 *  - TUIR Art. 13 — Deductions for dependent work income
 *  - TUIR Art. 12 — Deductions for family dependents
 *  - DL 3/2020 Art. 1 — Integrated Treatment (refundable credit)
 *  - L. 207/2024 Art. 1 cc. 4-9 — Bonus / Additional Deduction
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
  numPayPeriods: number;
  regionalTaxRate: number;
  municipalTaxRate: number;
  mealVoucher?: MealVoucherInput;
  hasSpouseDependent: boolean;
  dependentChildrenOver21: number;
  /** Portion of children deduction: 100 (single parent/spouse dependent)
   *  or 50 (split between two unmarried parents — Art. 12 note 3). */
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
  // IRPEF (Personal Income Tax)
  irpefGross: number;
  employmentDeduction: number;
  spouseDeduction: number;
  childrenDeduction: number;
  otherDependentsDeduction: number;
  totalDeductions: number;
  additionalDeduction: number;    // L.207/2024 non-refundable (R 20k–40k)
  irpefAfterDeductions: number;   // max(0, irpefGross − deductions − additionalDed.)
  integratedTreatment: number;    // DL 3/2020 — refundable credit
  bonusL207: number;              // L.207/2024 refundable bonus (R ≤ 20k)
  irpefNet: number;               // Final IRPEF (can be negative = cash benefit)
  // Additional taxes
  regionalTax: number;
  municipalTax: number;
  // Totals
  annualSalaryNet: number;        // Net salary (excluding meal vouchers)
  monthlyVoucherBenefit: number;  // Monthly tax-exempt meal voucher benefit
  annualNet: number;              // = annualSalaryNet + annual tax-exempt vouchers
  monthlyNet: number;             // = annualSalaryNet / numPayPeriods + monthlyVoucherBenefit
  effectiveTaxRate: number;
  // Employer costs
  inpsContributionEmployer: number; // INPS employer contribution (~23.81%)
  severanceFund: number;            // Severance fund accrual (6.91% RAL — Art. 2120 c.c.)
  totalEmployerCost: number;        // RAL + INPS employer + severanceFund
  effectiveTaxRateWithEmployer: number; // Total tax burden on employer cost
  mealVoucher?: MealVoucherBreakdown;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Truncates to 4 decimal places (Art. 12 note 5 TUIR). */
function truncate4(n: number): number {
  return Math.trunc(n * 10_000) / 10_000;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const INPS_EMPLOYEE_RATE = 0.0919;
/** Employee INPS contributions (pension and other — flat rate). */
const INPS_EMPLOYER_RATE = 0.2381;
/** Severance fund: 6.91% of annual gross salary (Art. 2120 c.c.). */
const SEVERANCE_FUND_RATE = 0.0691;

const MEAL_VOUCHER_EXEMPTION_THRESHOLD: Record<MealVoucherType, number> = {
  electronic: 10, // 2026: increased to €10/day
  paper: 4,
};

// IRPEF Tax Brackets 2026
const TAX_BRACKETS: { limit: number; rate: number }[] = [
  { limit: 28_000, rate: 0.23 },
  { limit: 50_000, rate: 0.33 }, // 2026: reduced from 35% to 33%
  { limit: Infinity, rate: 0.43 },
];

// ─── Gross IRPEF (Personal Income Tax) ────────────────────────────────────────

function calculateGrossIrpef(taxableIncome: number): number {
  let tax = 0;
  let prevLimit = 0;
  for (const { limit, rate } of TAX_BRACKETS) {
    if (taxableIncome <= prevLimit) break;
    tax += (Math.min(taxableIncome, limit) - prevLimit) * rate;
    prevLimit = limit;
  }
  return tax;
}

// ─── Art. 13 TUIR — Employment Income Deduction ──────────────────────────────

function calculateEmploymentDeduction(taxableIncome: number): number {
  if (taxableIncome <= 15_000) return 1_955;

  const coefficientBelow28k = (28_000 - taxableIncome) / 13_000;
  if (taxableIncome <= 25_000) return 1_910 + 1_190 * coefficientBelow28k;
  if (taxableIncome <= 28_000) return 1_975 + 1_190 * coefficientBelow28k; // +65 adjustment

  const coefficientBelow50k = (50_000 - taxableIncome) / 22_000;
  if (taxableIncome <= 35_000) return 65 + 1_910 * coefficientBelow50k; // +65 adjustment
  if (taxableIncome < 50_000) return 1_910 * coefficientBelow50k;
  return 0;
}

// ─── Art. 12 TUIR — Spouse Dependent Deduction ────────────────────────────────

function calculateSpouseDeduction(taxableIncome: number): number {
  if (taxableIncome <= 15_000) return 800 - 110 * (taxableIncome / 15_000);
  if (taxableIncome <= 29_000) return 690;
  if (taxableIncome <= 29_200) return 700;  // +10 adjustment
  if (taxableIncome <= 34_700) return 710;  // +20 adjustment
  if (taxableIncome <= 35_000) return 720;  // +30 adjustment
  if (taxableIncome <= 35_100) return 710;  // +20 adjustment
  if (taxableIncome <= 35_200) return 700;  // +10 adjustment
  if (taxableIncome <= 40_000) return 690;
  if (taxableIncome <= 80_000) return 690 * ((80_000 - taxableIncome) / 40_000);
  return 0;
}

// ─── Art. 12 TUIR — Children Over 21 Dependent Deduction ──────────────────────

function calculateChildrenDeduction(taxableIncome: number, numberOfChildren: number): number {
  if (numberOfChildren <= 0) return 0;
  // C truncated to 4 decimals (Art. 12 note 5)
  const coefficient = truncate4(Math.max(0, (80_000 - taxableIncome + 15_000 * numberOfChildren) / (80_000 + 15_000 * numberOfChildren)));
  return 950 * coefficient * numberOfChildren;
}

// ─── Art. 12 TUIR — Other Family Dependents Deduction ────────────────────────

function calculateOtherDependentsDeduction(taxableIncome: number, numberOfDependents: number): number {
  if (numberOfDependents <= 0) return 0;
  // C truncated to 4 decimals (Art. 12 note 5)
  const coefficient = truncate4(Math.max(0, (80_000 - taxableIncome) / 80_000));
  return 750 * coefficient * numberOfDependents;
}

// ─── DL 3/2020 Art. 1 — Integrated Treatment (Refundable Credit) ──────────────

function calculateIntegratedTreatment(
  taxableIncome: number,
  irpefGross: number,
  employmentDeduction: number,
  totalDeductions: number
): number {
  if (taxableIncome <= 15_000) {
    // Applies if: gross IRPEF − (employment deduction − 75) > 0
    return irpefGross - (employmentDeduction - 75) > 0 ? 1_200 : 0;
  }
  if (taxableIncome <= 28_000) {
    // Applies the portion of deductions exceeding gross IRPEF, max €1,200
    return Math.min(1_200, Math.max(0, totalDeductions - irpefGross));
  }
  return 0;
}

// ─── L. 207/2024 Art. 1 cc. 4-9 — Bonus / Additional Deduction ────────────────

interface BonusL207 {
  refundableCredit: number;    // refundable bonus (taxableIncome ≤ 20k)
  nonRefundableDeduction: number; // non-refundable additional deduction (20k–40k)
}

function calculateBonusL207(taxableIncome: number): BonusL207 {
  if (taxableIncome <= 8_500) return { refundableCredit: taxableIncome * 0.071, nonRefundableDeduction: 0 };
  if (taxableIncome <= 15_000) return { refundableCredit: taxableIncome * 0.053, nonRefundableDeduction: 0 };
  if (taxableIncome <= 20_000) return { refundableCredit: taxableIncome * 0.048, nonRefundableDeduction: 0 };
  if (taxableIncome <= 32_000) return { refundableCredit: 0, nonRefundableDeduction: 1_000 };
  if (taxableIncome <= 40_000) return { refundableCredit: 0, nonRefundableDeduction: 1_000 * ((40_000 - taxableIncome) / 8_000) };
  return { refundableCredit: 0, nonRefundableDeduction: 0 };
}

// ─── Meal Vouchers ────────────────────────────────────────────────────────────

function calculateMealVoucher(input: MealVoucherInput): MealVoucherBreakdown {
  const threshold = MEAL_VOUCHER_EXEMPTION_THRESHOLD[input.type];
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

// ─── Main Export ──────────────────────────────────────────────────────────────

export function calculateSalary(input: SalaryInput): SalaryBreakdown {
  const { ral, numPayPeriods, regionalTaxRate, municipalTaxRate } = input;

  const inpsContributions = ral * INPS_EMPLOYEE_RATE;

  const mealVoucher = input.mealVoucher
    ? calculateMealVoucher(input.mealVoucher)
    : undefined;

  const taxableIncome = ral - inpsContributions + (mealVoucher?.annualTaxable ?? 0);

  // ── Gross IRPEF ──
  const irpefGross = calculateGrossIrpef(taxableIncome);

  // ── Non-refundable deductions (Art. 12-13 TUIR) ──
  const employmentDeduction = calculateEmploymentDeduction(taxableIncome);
  const spouseDeduction = input.hasSpouseDependent ? calculateSpouseDeduction(taxableIncome) : 0;
  // Portion 50% or 100% (Art. 12 note 3 — split between parents)
  const childrenDeduction =
    calculateChildrenDeduction(taxableIncome, input.dependentChildrenOver21) *
    (input.childrenDeductionShare / 100);
  const otherDependentsDeduction = calculateOtherDependentsDeduction(taxableIncome, input.otherDependents);
  const totalDeductions =
    employmentDeduction + spouseDeduction + childrenDeduction + otherDependentsDeduction;

  // ── L.207/2024: additional non-refundable deduction (€20k–40k) ──
  const { refundableCredit: bonusL207, nonRefundableDeduction: additionalDeduction } =
    calculateBonusL207(taxableIncome);

  // After all non-refundable deductions (floor at 0)
  const irpefAfterDeductions = Math.max(0, irpefGross - totalDeductions - additionalDeduction);

  // ── Refundable credits (can make IRPEF negative = cash benefit) ──
  const integratedTreatment = calculateIntegratedTreatment(
    taxableIncome,
    irpefGross,
    employmentDeduction,
    totalDeductions
  );

  // Final IRPEF: can be negative
  const irpefNet = irpefAfterDeductions - integratedTreatment - bonusL207;

  // ── Additional taxes (calculated on taxable income) ──
  const regionalTax = taxableIncome * regionalTaxRate;
  const municipalTax = taxableIncome * municipalTaxRate;

  // Net salary only (excluding meal vouchers)
  const annualSalaryNet = ral - inpsContributions - irpefNet - regionalTax - municipalTax;
  // Monthly tax-exempt meal voucher benefit (not tied to pay periods)
  const monthlyVoucherBenefit = mealVoucher?.monthlyExempt ?? 0;
  // Total net: salary + meal voucher benefit
  const annualNet = annualSalaryNet + monthlyVoucherBenefit * 12;
  const monthlyNet = annualSalaryNet / numPayPeriods + monthlyVoucherBenefit;

  const totalTaxBurden = inpsContributions + irpefNet + regionalTax + municipalTax;
  const effectiveTaxRate = totalTaxBurden / ral;

  const inpsContributionEmployer = ral * INPS_EMPLOYER_RATE;
  const severanceFund = ral * SEVERANCE_FUND_RATE;
  const totalEmployerCost = ral + inpsContributionEmployer + severanceFund;
  const effectiveTaxRateWithEmployer = 1 - annualNet / totalEmployerCost;

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
    additionalDeduction,
    irpefAfterDeductions,
    integratedTreatment,
    bonusL207,
    irpefNet,
    regionalTax,
    municipalTax,
    annualSalaryNet,
    monthlyVoucherBenefit,
    annualNet,
    monthlyNet,
    effectiveTaxRate,
    inpsContributionEmployer,
    severanceFund,
    totalEmployerCost,
    effectiveTaxRateWithEmployer,
    mealVoucher,
  };
}
