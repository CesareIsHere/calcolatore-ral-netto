# Calcolatore RAL → Netto 2026

Un semplice strumento per calcolare la retribuzione netta annua e mensile da una RAL (Retribuzione Annua Lorda) in Italia, applicando la normativa IRPEF 2026.

## 🎯 Funzionalità

- **Calcolo IRPEF 2026** con scaglioni aggiornati (23% / 33% / 43%)
- **Detrazioni per carichi di famiglia** (Art. 12 TUIR): coniuge, figli >21 anni, altri familiari
- **Crediti rimborsabili**: Trattamento Integrativo (DL 3/2020) e Bonus L.207/2024
- **Buoni pasto** (esenzione €10/gg elettronici, €4/gg cartacei)
- **Addizionali regionali e comunali** per tutte le 21 regioni italiane
- **Costo aziendale**: calcolo del totale con INPS datoriale (~23,81%) e TFR (6,91%)
- **Layout responsivo** a due colonne (desktop) / una colonna (mobile)
- **Dark mode support**

## 📊 Input

1. **RAL** — retribuzione annua lorda
2. **Mensilità** — 12, 13 (tredicesima) o 14 (quattordicesima)
3. **Regione** — per applicare addizionale regionale
4. **Addizionale comunale** — personalizzabile (default: 0,80% Milano)
5. **Buoni pasto** — opzionali (tipo, giorni/mese, valore)
6. **Familiari a carico**:
   - Coniuge
   - Figli >21 anni (con quota ripartizione 50%/100%)
   - Altri familiari

## 📈 Output

- **Netto annuale e mensile** (incl. benefit buoni pasto)
- **Breakdown completo IRPEF**: IRPEF lorda, detrazioni, crediti
- **Addizionali regionali e comunali**
- **Pressione fiscale** (sul dipendente e con INPS datoriale)
- **Costo aziendale lordo**
- **TFR accantonato**

## 🔧 Stack Tecnico

- **Framework**: Next.js 14 (App Router)
- **Linguaggio**: TypeScript
- **Styling**: Tailwind CSS
- **UI**: Componenti custom con supporto dark mode

## 📁 Struttura

```
app/
├── page.tsx              # Homepage con form e risultati
├── layout.tsx            # Layout root con footer
└── globals.css

lib/
├── services/
│   └── salary.service.ts # Logica calcolo (IRPEF, detrazioni, crediti)
└── data/
    └── regions.ts        # Dati regioni (aliquote addizionali)
```

## ⚠️ Limitazioni e Assunzioni

- **Rapporto dipendente full-time** per l'intero anno (nessun riproporzionamento)
- **Solo reddito dipendente** (nessun cumulo con altri redditi)
- **Aliquota INPS dipendente**: 9,19% flat
- **Addizionali regionali**: approssimazione flat (alcune regioni applicano aliquote progressive)
- **Trattamento Integrativo**: €1.200/anno per R ≤ €15k (crea discontinuità a ~RAL €9k)
- **Costo aziendale**: include solo INPS datoriale (23,81%) e TFR (6,91%), non include INAIL, previdenza complementare, fondi bilaterali
- **Buoni pasto**: calcolati su 12 mesi (non tiene conto di ferie/malattia/assenze)

## 🚀 Esecuzione

```bash
# Installare dipendenze
npm install

# Avviare dev server
npm run dev

# Build produzione
npm run build

# Avviare server produzione
npm start
```

Apri [http://localhost:3000](http://localhost:3000) nel browser.

## 📝 Normativa Implementata

- **Art. 13 TUIR** — Detrazioni per lavoro dipendente (con correttivi 2026)
- **Art. 12 TUIR** — Detrazioni per carichi di famiglia (coniuge, figli, altri)
- **DL 3/2020 Art. 1** — Trattamento Integrativo (credito rimborsabile)
- **L. 207/2024 Art. 1 cc. 4-9** — Bonus e Ulteriore Detrazione (2026)
- **Addizionali IRPEF** — Regionali e comunali 2026

## ⚡ Performance e Qualità

- **Clean Architecture**: separazione logica calcolo (service) da UI (React)
- **TypeScript**: type safety su input/output
- **Validazione input**: controlli lato client per RAL e aliquote
- **Accessibilità**: form semantico con label e tooltip
- **Test**: calcolati su normativa ufficiale 2026

---

**Ultimo aggiornamento**: 11 marzo 2026
**⚠️ Nota**: Questo calcolatore fornisce una **stima approssimativa**. Per calcoli ufficiali e dichiarazioni fiscali, consultare un commercialista.
