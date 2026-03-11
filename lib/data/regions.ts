/**
 * Regional IRPEF surtax rates — tax year 2020 (source: Redditi PF 2021, Fascicolo 1)
 * For regions with progressive brackets, the arithmetic mean of all bracket rates is used.
 */
export interface Region {
  name: string;
  additionalTaxRate: number; // decimal, e.g. 0.0123 = 1.23%
}

export const REGIONS: Region[] = [
  { name: "Abruzzo", additionalTaxRate: 0.0173 },           // flat 1.73%
  { name: "Basilicata", additionalTaxRate: 0.0176 },        // avg (1.23+1.73+2.33)/3
  { name: "Calabria", additionalTaxRate: 0.0203 },          // flat 2.03%
  { name: "Campania", additionalTaxRate: 0.0203 },          // flat 2.03%
  { name: "Emilia-Romagna", additionalTaxRate: 0.0197 },    // avg (1.33+1.93+2.03+2.23+2.33)/5
  { name: "Friuli-Venezia Giulia", additionalTaxRate: 0.00965 }, // avg (0.70+1.23)/2
  { name: "Lazio", additionalTaxRate: 0.0279 },             // avg brackets >35k: (1.73+2.73+2.93+3.23+3.33)/5
  { name: "Liguria", additionalTaxRate: 0.02 },             // avg (1.23+1.81+2.31+2.32+2.33)/5
  { name: "Lombardia", additionalTaxRate: 0.016 },          // avg (1.23+1.58+1.72+1.73+1.74)/5
  { name: "Marche", additionalTaxRate: 0.0158 },            // avg (1.23+1.53+1.70+1.72+1.73)/5
  { name: "Molise", additionalTaxRate: 0.0237 },            // avg (2.03+2.23+2.43+2.53+2.63)/5
  { name: "Piemonte", additionalTaxRate: 0.0263 },          // avg (1.62+2.13+2.75+3.32+3.33)/5
  { name: "Provincia di Bolzano", additionalTaxRate: 0.0099 }, // avg (0+1.23+1.73)/3
  { name: "Provincia di Trento", additionalTaxRate: 0.0143 },  // avg (1.23+1.23+1.23+1.73+1.73)/5
  { name: "Puglia", additionalTaxRate: 0.0158 },            // avg (1.33+1.43+1.71+1.72+1.73)/5
  { name: "Sardegna", additionalTaxRate: 0.0123 },          // flat 1.23%
  { name: "Sicilia", additionalTaxRate: 0.0123 },           // flat 1.23%
  { name: "Toscana", additionalTaxRate: 0.01596 },          // avg (1.42+1.43+1.68+1.72+1.73)/5
  { name: "Umbria", additionalTaxRate: 0.0162 },            // avg (1.23+1.63+1.68+1.73+1.83)/5
  { name: "Valle d'Aosta", additionalTaxRate: 0.00615 },    // avg (0+1.23)/2 (exemption ≤€15k)
  { name: "Veneto", additionalTaxRate: 0.0123 },            // flat 1.23%
];
