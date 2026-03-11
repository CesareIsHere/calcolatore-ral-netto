/**
 * Addizionali IRPEF regionali 2024 — aliquota base (approssimazione flat)
 * Fonte: normativa regionale vigente. Alcune regioni applicano aliquote progressive.
 */
export interface Region {
  name: string;
  additionalTaxRate: number; // in decimal, es. 0.0123 = 1.23%
}

export const REGIONS: Region[] = [
  { name: "Abruzzo", additionalTaxRate: 0.0173 },
  { name: "Basilicata", additionalTaxRate: 0.0123 },
  { name: "Calabria", additionalTaxRate: 0.0203 },
  { name: "Campania", additionalTaxRate: 0.0203 },
  { name: "Emilia-Romagna", additionalTaxRate: 0.0193 },
  { name: "Friuli-Venezia Giulia", additionalTaxRate: 0.0123 },
  { name: "Lazio", additionalTaxRate: 0.0173 },
  { name: "Liguria", additionalTaxRate: 0.0123 },
  { name: "Lombardia", additionalTaxRate: 0.0123 },
  { name: "Marche", additionalTaxRate: 0.0173 },
  { name: "Molise", additionalTaxRate: 0.0203 },
  { name: "Piemonte", additionalTaxRate: 0.0162 },
  { name: "Provincia di Bolzano", additionalTaxRate: 0.0123 },
  { name: "Provincia di Trento", additionalTaxRate: 0.0123 },
  { name: "Puglia", additionalTaxRate: 0.0203 },
  { name: "Sardegna", additionalTaxRate: 0.0123 },
  { name: "Sicilia", additionalTaxRate: 0.0123 },
  { name: "Toscana", additionalTaxRate: 0.0142 },
  { name: "Umbria", additionalTaxRate: 0.0123 },
  { name: "Valle d'Aosta", additionalTaxRate: 0.0050 },
  { name: "Veneto", additionalTaxRate: 0.0123 },
];
