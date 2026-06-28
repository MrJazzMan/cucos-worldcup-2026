/**
 * Agenda TV via OndeBola.com — port de Leopardo/briefing/fontes/ondebola.py
 * Fonte: https://ondebola.com/
 */

import * as cheerio from "cheerio";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { TIMEZONE } from "@/lib/timezone";

const URL = "https://ondebola.com/";
const TIMEOUT_MS = 20_000;
const USER_AGENT = "CucosWC26/1.0 (+uso pessoal; wc26.pt)";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6h

const MESES_PT: Record<string, number> = {
  jan: 1,
  fev: 2,
  mar: 3,
  abr: 4,
  mai: 5,
  jun: 6,
  jul: 7,
  ago: 8,
  set: 9,
  out: 10,
  nov: 11,
  dez: 12,
};

export interface JogoTV {
  equipa_casa: string;
  equipa_fora: string;
  competicao: string;
  inicio_lisboa: Date;
  canais: string;
}

let cacheHtml: { html: string; at: number } | null = null;

function semAcentos(texto: string): string {
  return texto.normalize("NFD").replace(/\p{M}/gu, "");
}

function normalizarEquipa(nome: string): string {
  let n = semAcentos(nome).toLowerCase().trim();
  for (const prefixo of ["fc ", "sl ", "cp ", "sc "]) {
    if (n.startsWith(prefixo)) n = n.slice(prefixo.length);
  }
  return n.trim();
}

function tokensEquipa(nome: string): Set<string> {
  const n = normalizarEquipa(nome);
  return new Set(
    n.split(/[\s.]+/).filter((t) => t.length >= 3)
  );
}

export function equipasCoincidem(a: string, b: string): boolean {
  const na = normalizarEquipa(a);
  const nb = normalizarEquipa(b);
  if (!na || !nb) return false;
  if (na === nb || na.includes(nb) || nb.includes(na)) return true;

  const pa = na.split(" ")[0];
  const pb = nb.split(" ")[0];
  if (pa === pb && pa.length >= 4) return true;

  const ta = tokensEquipa(a);
  const tb = tokensEquipa(b);
  for (const t of ta) {
    if (tb.has(t)) return true;
  }
  return false;
}

function parseDataHora(tdDateHtml: string, ref: Date): Date | null {
  const horaMatch = tdDateHtml.match(/(\d{1,2}):(\d{2})/);
  if (!horaMatch) return null;
  const hora = parseInt(horaMatch[1], 10);
  const minuto = parseInt(horaMatch[2], 10);

  const diaMatch = tdDateHtml.match(/(\d{1,2})\s+([A-Za-zÀ-ÿ]{3})/u);
  if (!diaMatch) return null;

  const dia = parseInt(diaMatch[1], 10);
  const mesTxt = semAcentos(diaMatch[2]).toLowerCase().slice(0, 3);
  const mes = MESES_PT[mesTxt];
  if (!mes) return null;

  const ano = ref.getFullYear();
  let dt = fromZonedTime(
    new Date(ano, mes - 1, dia, hora, minuto),
    TIMEZONE
  );

  const refMs = ref.getTime();
  if (dt.getTime() < refMs - 60 * 24 * 60 * 60 * 1000) {
    dt = fromZonedTime(new Date(ano + 1, mes - 1, dia, hora, minuto), TIMEZONE);
  }
  return dt;
}

/** Normaliza nomes do OndeBola para os presets do site (RTP 1 → RTP1, …). */
export function normalizeCanalNome(nome: string): string {
  const n = nome.trim();
  if (/^rtp\s*1$/i.test(n)) return "RTP1";
  if (/^rtp\s*2$/i.test(n)) return "RTP2";
  if (/^rtp\s*3$/i.test(n)) return "RTP3";
  if (/^livemode\s*tv$/i.test(n)) return "LiveModeTv";
  return n;
}

/** Extrai todos os canais/streamings da célula OndeBola (não só «Detalhes canal»). */
export function parseCanais(tdChannelHtml: string): string {
  const $ = cheerio.load(tdChannelHtml);
  const found = new Set<string>();

  $("a[title='Detalhes canal']").each((_, el) => {
    $(el)
      .text()
      .split("\n")
      .map((p) => p.trim().replace(/,$/, ""))
      .filter(Boolean)
      .forEach((parte) => found.add(normalizeCanalNome(parte)));
  });

  $("a[title='ver online']").each((_, el) => {
    const nome = $(el).text().trim();
    if (nome) found.add(normalizeCanalNome(nome));
  });

  $("span.video-link-text.livemodetv").each(() => {
    found.add("LiveModeTv");
  });

  $("a[title='Betano livestream'] .video-link-text").each((_, el) => {
    const nome = $(el).text().trim();
    if (nome) found.add(normalizeCanalNome(nome));
  });

  return [...found].join(", ");
}

export function parseAgendaHtml(html: string, ref = new Date()): JogoTV[] {
  const $ = cheerio.load(html);
  const tabela = $("table.table-games");
  if (!tabela.length) return [];

  const jogos: JogoTV[] = [];
  tabela.find("tbody > tr").each((_, tr) => {
    const row = $(tr);
    if (row.find("td.td-game-table-ad").length) return;

    const tds = row.find("> td");
    if (tds.length < 3) return;

    const inicio = parseDataHora(tds.eq(0).html() ?? "", ref);
    if (!inicio) return;

    const teams = tds.eq(1).find("span.team");
    if (teams.length < 2) return;

    const casa = teams.eq(0).text().trim();
    const fora = teams.eq(1).text().trim();
    const competicao = tds.eq(1).find("span.extra").text().trim();
    const canais = parseCanais(tds.eq(2).html() ?? "");

    if (!canais) return;

    jogos.push({
      equipa_casa: casa,
      equipa_fora: fora,
      competicao,
      inicio_lisboa: inicio,
      canais,
    });
  });

  return jogos;
}

async function fetchHtml(): Promise<string | null> {
  try {
    const res = await fetch(URL, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return null;
    return res.text();
  } catch {
    return null;
  }
}

export async function carregarAgenda(forcar = false): Promise<JogoTV[]> {
  const now = Date.now();
  if (!forcar && cacheHtml && now - cacheHtml.at < CACHE_TTL_MS) {
    return parseAgendaHtml(cacheHtml.html);
  }

  const html = await fetchHtml();
  if (!html) return cacheHtml ? parseAgendaHtml(cacheHtml.html) : [];

  cacheHtml = { html, at: now };
  return parseAgendaHtml(html);
}

function competicaoEhJunior(competicao: string): boolean {
  const c = competicao.toLowerCase().replace(/\./g, "");
  if (/sub\s*\d+/.test(c) || /\bu\d{1,2}\b/.test(c)) return true;
  return ["juvenil", "juniores", "júnior", "junior"].some((x) => c.includes(x));
}

function competicaoEhFutsalOuFeminino(competicao: string): boolean {
  const c = competicao.toLowerCase();
  return c.includes("futsal") || c.includes("femin");
}

export function jogoSeniorHomens(jogo: JogoTV): boolean {
  const texto = `${jogo.equipa_casa} ${jogo.equipa_fora}`.toLowerCase();
  if (texto.includes("cerimónia") || texto.includes("cerimonia")) return false;
  return (
    !competicaoEhJunior(jogo.competicao) &&
    !competicaoEhFutsalOuFeminino(jogo.competicao)
  );
}

export function jogoMundialSenior(jogo: JogoTV): boolean {
  if (!jogoSeniorHomens(jogo)) return false;
  const c = jogo.competicao.toLowerCase();
  return c.includes("mundial") || c.includes("fifa");
}

export function jogosDoDia(agenda: JogoTV[], dia?: Date): JogoTV[] {
  const ref = dia ?? new Date();
  const diaStr = formatInTimeZone(ref, TIMEZONE, "yyyy-MM-dd");
  return agenda
    .filter(
      (j) =>
        formatInTimeZone(j.inicio_lisboa, TIMEZONE, "yyyy-MM-dd") === diaStr
    )
    .sort((a, b) => a.inicio_lisboa.getTime() - b.inicio_lisboa.getTime());
}

export function canalParaJogo(
  agenda: JogoTV[],
  equipaCasa: string,
  equipaFora: string,
  kickoff: Date,
  toleranciaMinutos = 180
): string | null {
  const jogo = findJogoNaAgenda(
    agenda,
    equipaCasa,
    equipaFora,
    kickoff,
    toleranciaMinutos
  );
  return jogo?.canais ?? null;
}

/** Melhor entrada OndeBola para um jogo da BD (mesmo dia civil + equipas). */
export function findJogoNaAgenda(
  agenda: JogoTV[],
  equipaCasa: string,
  equipaFora: string,
  kickoff: Date,
  toleranciaMinutos = 180
): JogoTV | null {
  const kickoffDay = formatInTimeZone(kickoff, TIMEZONE, "yyyy-MM-dd");
  let melhor: { diff: number; jogo: JogoTV } | null = null;

  for (const jogo of agenda) {
    if (!jogoSeniorHomens(jogo)) continue;

    const jogoDay = formatInTimeZone(jogo.inicio_lisboa, TIMEZONE, "yyyy-MM-dd");
    if (jogoDay !== kickoffDay) continue;

    const casaOk = equipasCoincidem(equipaCasa, jogo.equipa_casa);
    const foraOk = equipasCoincidem(equipaFora, jogo.equipa_fora);
    const casaForaOk = equipasCoincidem(equipaCasa, jogo.equipa_fora);
    const foraCasaOk = equipasCoincidem(equipaFora, jogo.equipa_casa);

    if (!((casaOk && foraOk) || (casaForaOk && foraCasaOk))) continue;

    const diff = Math.abs(jogo.inicio_lisboa.getTime() - kickoff.getTime());
    if (diff > toleranciaMinutos * 60 * 1000) continue;

    if (!melhor || diff < melhor.diff) {
      melhor = { diff, jogo };
    }
  }

  return melhor?.jogo ?? null;
}

/** "RTP1, Sport.Tv1" → ["RTP1", "Sport.Tv1"] normalizado */
export function parseCanaisLista(canais: string): string[] {
  return canais
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
}

export function limparCacheOndeBola(): void {
  cacheHtml = null;
}
