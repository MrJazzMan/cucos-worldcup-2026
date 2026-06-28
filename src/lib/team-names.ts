// Tradução dos nomes das equipas (API-Football → Português de Portugal).
// As selecções na API-Football vêm em inglês; aqui mapeamos para pt-PT.
// Apenas se traduz quando há entrada no mapa — caso contrário fica o original.

/** Normaliza variantes da API («Bosnia & Herzegovina» → «Bosnia and Herzegovina»). */
export function normalizeApiTeamName(name: string): string {
  return name.trim().replace(/\s*&\s*/g, " and ");
}

const TEAM_NAMES_PT: Record<string, string> = {
  // Anfitriões
  "USA": "Estados Unidos",
  "United States": "Estados Unidos",
  "Canada": "Canadá",
  "Mexico": "México",

  // Europa
  "Portugal": "Portugal",
  "Spain": "Espanha",
  "France": "França",
  "England": "Inglaterra",
  "Germany": "Alemanha",
  "Italy": "Itália",
  "Netherlands": "Países Baixos",
  "Belgium": "Bélgica",
  "Croatia": "Croácia",
  "Switzerland": "Suíça",
  "Austria": "Áustria",
  "Denmark": "Dinamarca",
  "Poland": "Polónia",
  "Serbia": "Sérvia",
  "Ukraine": "Ucrânia",
  "Scotland": "Escócia",
  "Wales": "País de Gales",
  "Turkey": "Turquia",
  "Türkiye": "Turquia",
  "Sweden": "Suécia",
  "Norway": "Noruega",
  "Czech Republic": "República Checa",
  "Czechia": "Chéquia",
  "Hungary": "Hungria",
  "Greece": "Grécia",
  "Romania": "Roménia",
  "Republic of Ireland": "Irlanda",
  "Ireland": "Irlanda",
  "Slovakia": "Eslováquia",
  "Slovenia": "Eslovénia",
  "Russia": "Rússia",
  "Iceland": "Islândia",
  "Finland": "Finlândia",
  "Albania": "Albânia",
  "North Macedonia": "Macedónia do Norte",
  "Bosnia and Herzegovina": "Bósnia e Herzegovina",
  "Georgia": "Geórgia",

  // América do Sul
  "Brazil": "Brasil",
  "Argentina": "Argentina",
  "Uruguay": "Uruguai",
  "Colombia": "Colômbia",
  "Chile": "Chile",
  "Peru": "Peru",
  "Ecuador": "Equador",
  "Paraguay": "Paraguai",
  "Bolivia": "Bolívia",
  "Venezuela": "Venezuela",

  // África
  "Morocco": "Marrocos",
  "Senegal": "Senegal",
  "Tunisia": "Tunísia",
  "Algeria": "Argélia",
  "Egypt": "Egito",
  "Nigeria": "Nigéria",
  "Ghana": "Gana",
  "Cameroon": "Camarões",
  "Ivory Coast": "Costa do Marfim",
  "Côte d'Ivoire": "Costa do Marfim",
  "South Africa": "África do Sul",
  "Mali": "Mali",
  "Burkina Faso": "Burquina Faso",
  "DR Congo": "RD Congo",
  "Congo DR": "RD Congo",
  "Cape Verde": "Cabo Verde",
  "Cape Verde Islands": "Cabo Verde",

  // Ásia / Oceânia
  "Japan": "Japão",
  "South Korea": "Coreia do Sul",
  "Korea Republic": "Coreia do Sul",
  "Australia": "Austrália",
  "Iran": "Irão",
  "IR Iran": "Irão",
  "Saudi Arabia": "Arábia Saudita",
  "Qatar": "Catar",
  "Iraq": "Iraque",
  "United Arab Emirates": "Emirados Árabes Unidos",
  "Uzbekistan": "Uzbequistão",
  "Jordan": "Jordânia",
  "China": "China",
  "China PR": "China",
  "New Zealand": "Nova Zelândia",

  // CONCACAF
  "Costa Rica": "Costa Rica",
  "Panama": "Panamá",
  "Honduras": "Honduras",
  "Jamaica": "Jamaica",
  "Curacao": "Curaçau",
  "Curaçao": "Curaçau",
  "Haiti": "Haiti",
};

/** Devolve o nome da equipa em Português de Portugal (ou o original se não houver tradução). */
export function ptTeam(name: string | null | undefined): string {
  if (!name) return "";
  const key = normalizeApiTeamName(name);
  return TEAM_NAMES_PT[key] ?? name;
}
