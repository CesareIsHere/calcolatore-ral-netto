# Gross Salary → Net Salary Calculator 2026

A simple tool to calculate annual and monthly net compensation from gross salary (RAL) in Italy, applying 2026 IRPEF regulations.

## 🎯 Features

- **2026 IRPEF Calculation** with updated tax brackets (23% / 33% / 43%)
- **Family dependents deductions** (Art. 12 TUIR): spouse, children over 21, other relatives
- **Refundable credits**: Integrated Treatment (DL 3/2020) and Bonus L.207/2024
- **Meal vouchers** (tax-exempt: €10/day electronic, €4/day paper)
- **Regional and municipal additional taxes** for all 21 Italian regions
- **Employer cost**: calculation with INPS employer contribution (~23.81%) and severance fund (6.91%)
- **Responsive two-column layout** (desktop) / single column (mobile)
- **Dark mode support**

## 📊 Inputs

1. **Gross Salary (RAL)** — annual gross compensation
2. **Pay Periods** — 12, 13 (with 13th month), or 14 (with 14th month)
3. **Region** — for regional additional tax
4. **Municipal tax rate** — customizable (default: 0.80% Milan)
5. **Meal vouchers** — optional (type, days/month, value)
6. **Family dependents**:
   - Spouse
   - Children over 21 (with 50%/100% deduction split option)
   - Other dependents

## 📈 Outputs

- **Net annual and monthly salary** (incl. meal voucher benefits)
- **Complete IRPEF breakdown**: gross IRPEF, deductions, credits
- **Regional and municipal additional taxes**
- **Effective tax rate** (employee and employer burden)
- **Gross employer cost**
- **Severance fund accrual**

## 🔧 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI**: Custom components with dark mode support

## 📁 Structure

```
app/
├── page.tsx              # Homepage with form and results
├── layout.tsx            # Root layout with footer
└── globals.css

lib/
├── services/
│   └── salary.service.ts # Calculation logic (IRPEF, deductions, credits)
└── data/
    └── regions.ts        # Region data (regional tax rates)
```

## ⚠️ Limitations and Assumptions

- **Full-time employment** for entire year (no prorating)
- **Only employment income** (no cumulation with other income types)
- **INPS employee rate**: 9.19% flat
- **Regional additional taxes**: flat rate approximation (some regions use progressive rates)
- **Integrated Treatment**: €1,200/year for R ≤ €15k (creates discontinuity at ~€9k RAL)
- **Employer cost**: includes only INPS employer (23.81%) and severance (6.91%), excludes INAIL, supplementary pensions, bilateral funds
- **Meal vouchers**: calculated on 12 months (doesn't account for vacation/sick leave/absences)

## 🚀 Running the Application

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📝 Implemented Regulations

- **Art. 13 TUIR** — Deductions for employment income (with 2026 adjustments)
- **Art. 12 TUIR** — Deductions for family dependents (spouse, children, others)
- **DL 3/2020 Art. 1** — Integrated Treatment (refundable credit)
- **L. 207/2024 Art. 1 cc. 4-9** — Bonus and Additional Deduction (2026)
- **IRPEF Additional Taxes** — Regional and municipal 2026

## ⚡ Quality & Performance

- **Clean Architecture**: separation of calculation logic (service) from UI (React)
- **TypeScript**: type safety on inputs/outputs
- **Input validation**: client-side checks for gross salary and tax rates
- **Accessibility**: semantic form with labels and tooltips
- **Testing**: calculations verified against official 2026 regulations

## 📚 Fonti

- [Normattiva – Legge 30 dicembre 2025, n. 199 (Legge di Bilancio 2026)](https://www.normattiva.it/atto/caricaDettaglioAtto?atto.dataPubblicazioneGazzetta=2025-12-30&atto.codiceRedazionale=25G00212&atto.articolo.numero=0&atto.articolo.sottoArticolo=1&atto.articolo.sottoArticolo1=0&qId=72c221d4-b312-4a5e-94c3-70d6212dd759&tabID=0.9587533112297261&title=lbl.dettaglioAtto&generaTabId=true)
- [Normattiva – D.P.R. 22 dicembre 1986, n. 917 (TUIR)](https://www.normattiva.it/atto/caricaDettaglioAtto?atto.dataPubblicazioneGazzetta=1986-12-31&atto.codiceRedazionale=086U0917&atto.articolo.numero=0&atto.articolo.sottoArticolo=1&atto.articolo.sottoArticolo1=0&qId=0ea2fa30-61e7-4185-b886-e57490d0687b&tabID=0.8612997169888713&title=lbl.dettaglioAtto)

---

**Last Update**: March 11, 2026

**⚠️ Note**: This calculator provides an **approximate estimate**. For official calculations and tax declarations, consult a tax professional.
