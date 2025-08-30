// Données des parfums importées du tableau
export interface ParfumData {
  marque: string;
  famille: string;
  description: string;
  quantite: number;
  prix: number;
}

export const parfumsData: ParfumData[] = [
  { marque: "DIOR", famille: "PARFUMERIE", description: "JOY EDP INTENSE 90ML", quantite: 1, prix: 95000 },
  { marque: "CARTIER", famille: "PARFUMERIE", description: "LA PANTHERE EDP 75ML", quantite: 1, prix: 90000 },
  { marque: "NARCISO RODRIGUEZ", famille: "PARFUMERIE", description: "NARCISO EDP ROUGE 90ML", quantite: 1, prix: 83000 },
  { marque: "XERJOFF", famille: "PARFUMERIE", description: "ALEXANDRIA II EDP 50ML", quantite: 1, prix: 198000 },
  { marque: "NARCISO RODRIGUEZ", famille: "PARFUMERIE", description: "FOR HIM EDP 100ML", quantite: 1, prix: 65000 },
  { marque: "GIVENCHY", famille: "PARFUMERIE", description: "NEW GENTLEMAN EDP 100ML", quantite: 1, prix: 72000 },
  { marque: "GIORGIO ARMANI", famille: "PARFUMERIE", description: "STRONGER WITH YOU EDT 100ML", quantite: 1, prix: 87000 },
  { marque: "FRANCIS KURKDJIAN", famille: "PARFUMERIE", description: "OUD SATIN MOOD EDP 70ML", quantite: 1, prix: 198000 },
  { marque: "GUERLAIN", famille: "PARFUMERIE", description: "AQUA ALLEGORIA GRANADA SALVIA EDT 75ML", quantite: 1, prix: 60000 },
  { marque: "HUGO BOSS", famille: "PARFUMERIE", description: "BOSS BOTTLED INTENSE EDP 50ML", quantite: 1, prix: 52000 },
  { marque: "VERSACE", famille: "PARFUMERIE", description: "CRYSTAL NOIR EDP 90ML", quantite: 1, prix: 75000 },
  { marque: "GIORGIO ARMANI", famille: "PARFUMERIE", description: "SI PASSIONE EDP 100ML", quantite: 1, prix: 83000 },
  { marque: "AZZARO", famille: "PARFUMERIE", description: "WANTED BY NIGHT EDP 100ML", quantite: 1, prix: 60000 },
  { marque: "GUERLAIN", famille: "PARFUMERIE", description: "BOIS MYSTERIEUX EDP 125ML", quantite: 1, prix: 115000 },
  { marque: "DIOR", famille: "PARFUMERIE", description: "FAHRENHEIT EDT 100ML", quantite: 1, prix: 70000 },
  { marque: "LANCOME", famille: "PARFUMERIE", description: "LA NUIT TRESOR EDP CARESSE 75ML", quantite: 1, prix: 69000 },
  { marque: "YVES SAINT LAURENT", famille: "PARFUMERIE", description: "LIBRE EDP 90ML", quantite: 1, prix: 95000 },
  { marque: "GUERLAIN", famille: "PARFUMERIE", description: "ENCENS MYTHIQUE EDP 125ML", quantite: 1, prix: 115000 },
  { marque: "HERMES", famille: "PARFUMERIE", description: "COFFEE TERRE D'HERMES PURE PARFUM", quantite: 1, prix: 80000 },
  { marque: "LANCOME", famille: "PARFUMERIE", description: "IDOLES EDP L'INTENSE 75ML", quantite: 1, prix: 77000 },
  { marque: "PACO RABANE", famille: "PARFUMERIE", description: "INVICTUS EDT 100ML", quantite: 1, prix: 60000 },
  { marque: "DIOR", famille: "PARFUMERIE", description: "J'ADORE DEO PARFUME 100ML", quantite: 1, prix: 50000 },
  { marque: "DIOR", famille: "PARFUMERIE", description: "J'ADORE EDP INFINISSIME 50ML", quantite: 1, prix: 70000 },
  { marque: "GIVENCHY", famille: "PARFUMERIE", description: "L'INTERDIT EDP 50ML", quantite: 1, prix: 65000 },
  { marque: "DIOR", famille: "PARFUMERIE", description: "MISS DIOR EDP 100ML", quantite: 1, prix: 90000 },
  { marque: "MAUBOUSSIN", famille: "PARFUMERIE", description: "POUR LUI EDP 100ML", quantite: 1, prix: 66000 },
  { marque: "TRUSSARDI", famille: "PARFUMERIE", description: "SOUND OF DONNA EDP 100ML", quantite: 1, prix: 77000 }
];

// Extraire les marques uniques
export const uniqueMarques = Array.from(new Set(parfumsData.map(item => item.marque)));

// Extraire les familles uniques
export const uniqueFamilles = Array.from(new Set(parfumsData.map(item => item.famille)));
