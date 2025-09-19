// src/lib/analyze.ts
// Motore ATS "cervellone" (IT) con dizionari esterni JSON

import skillsIT from "@/data/skills.it.json";

// ---------- Tipi ----------
export type AnalyzeInput = {
  resume: string;
  jobDescription: string;
  locale?: "it" | "en";
  mode?: "candidate" | "recruiter";
};

export type AnalyzeOutput = {
  score: number;
  missingKeywords: string[];
  suggestions: string[];
  improvedResume: string;
  coverLetter: string;
};

type DomainDef = {
  name: string;
  profile: string;
  signals: string[];
  kpis: string[];
  dict: Record<string, string[]>;
};

type SkillsJson = {
  version: string;
  locale: string;
  domains: DomainDef[];
};

const DOMAINS: DomainDef[] = (skillsIT as SkillsJson).domains;

// ---------- Utils base ----------
function baseNorm(s: string) {
  return (s || "").normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}
// ignora TUTTA la punteggiatura (virgole incluse)
const PUNCT_RE = /[^\p{L}\p{N}\s]/gu;
const norm = (s: string) => baseNorm(s).replace(PUNCT_RE, " ");

function tokenize(text: string): string[] {
  return norm(text)
    .split(/\s+/g)
    .filter((w) => w && !STOP.has(w) && !/^\d+$/.test(w) && w.length >= 3);
}
const uniq = <T,>(arr: T[]) => Array.from(new Set(arr));

function bigrams(tokens: string[]) {
  const out: string[] = [];
  for (let i = 0; i < tokens.length - 1; i++) {
    const a = tokens[i], b = tokens[i + 1];
    if (a && b && !STOP.has(a) && !STOP.has(b)) out.push(`${a} ${b}`);
  }
  return out;
}

function containsAny(text: string, variants: string[]) {
  const hay = " " + norm(text) + " ";
  return variants.some((v) => hay.includes(" " + norm(v) + " "));
}

function jaccard(a: string[], b: string[]) {
  const A = new Set(a), B = new Set(b);
  if (!A.size && !B.size) return 0;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter++;
  return inter / (A.size + B.size - inter);
}

// Soft-match: confronta ignorando punteggiatura/stopword.
function softContainsTokens(hay: string, needle: string): boolean {
  const H = tokenize(hay).join(" ");
  const N = tokenize(needle).join(" ");
  if (!N) return false;
  return (" " + H + " ").includes(" " + N + " ");
}

// ---------- Stopwords & Filtri ----------
const STOP = new Set<string>([
  "a","ad","al","allo","ai","agli","all","alla","alle","col","coi","con",
  "da","dal","dallo","dai","degli","delle","dei","del","della","di","e","ed",
  "in","nel","nello","nei","nelle","dell","dello","dalla","dalle",
  "il","lo","la","i","gli","le","un","uno","una","per","tra","fra","su","sul","sullo","sui","sugli","sulle",
  "ma","o","oppure","non","piu","meno","anche","come","che","se","si","sia","siano","all","l","d","un",
  "ruolo","posizione","offerta","lavoro","ricerchiamo","richiesta","richieste","responsabilita","attivita",
  "requisiti","contratto","orario","full","time","part","turni","team","capace","ottime","buone","ottima",
  "profilo","descrizione","annuncio","azienda","sede","zona","area","ambito","settore","figura",
  "junior","senior","esperto","esperta","esperienza","anni","anno","gradita","preferibile","preferenza","benefit","pacchetto",
  "addetto","addetta","operatore","operatrice","tecnico","tecnica","specialista",
  "collaboratore","collaboratrice","responsabile","cliente","clienti",
  "sappia","sappiamo","sappiano","sapere","sa","fai","fa","faccio","fare",
  "gestisca","gestisce","gestisci","gestire","gestito","gestendo","gestione",
  "utilizzo","uso","usare","usato",
  "nuovo","nuova","vecchio","vecchia","ragazza","ragazzo","uomo","donna"
]);

const LOC = new Set<string>([
  "italia","milano","roma","torino","napoli","bologna","firenze","genova","bari","palermo","catania","verona","venezia",
  "padova","brescia","bergamo","como","monza","lecce","cagliari","pisa","trento","trieste","parma","modena","perugia"
]);

const EXCLUDE_FROM_MISSING = new Set<string>([
  ...LOC, "zona","area","sede","luogo","italia",
  "addetto","addetta","operatore","operatrice","tecnico","tecnica","specialista",
  "collaboratore","collaboratrice","responsabile","cliente","clienti",
  "nuovo","nuova","vecchio","vecchia","paese","uso","utilizzo","gestione","gestire","fare",
  "ragazza","ragazzo","uomo","donna","esperta","esperto",
  "dati" // troppo generico
]);

// ---------- Domain helpers ----------
function detectDomain(jd: string): string {
  const J = norm(jd);
  let best = { name: "generic", score: 0 };
  for (const dom of DOMAINS) {
    let score = 0;
    for (const s of dom.signals) if (J.includes(norm(s))) score += 2;
    for (const vars of Object.values(dom.dict)) if (containsAny(J, vars)) score += 1;
    if (score > best.score) best = { name: dom.name, score };
  }
  return best.score >= 2 ? best.name : "generic";
}
function getDomainDef(name: string) {
  return DOMAINS.find((d) => d.name === name);
}

function sanitizeDynamic(phrase: string, domain: string): string | null {
  const p = phrase.toLowerCase().trim();
  const BAD = new Set([
    "ragazza","ragazzo","uomo","donna","nuovo","nuova","paese",
    "esperta","esperto","fare","sappia","gestisca","gestisce","gestisci","gestire",
    "utilizzo","uso","usare"
  ]);
  if (BAD.has(p)) return null;

  const m1 = p.match(/^gestione\s+(.+)$/);
  if (m1) return m1[1];

  if (domain === "hospitality") {
    if (/caffetteria/.test(p)) return "caffetteria";
    if (/cocktail|mixolog|miscelaz/.test(p)) return "cocktail";
    if (/bancone/.test(p)) return "bancone";
    if (/coperti/.test(p)) return "coperti";
    if (/mise\s*en\s*place|mise-en-place/.test(p)) return "mise en place";
    if (/(uso|utilizzo|usa).*(pos|cassa)/.test(p)) return "cassa";
    if (/prenotazioni|booking|tavoli/.test(p)) return "prenotazioni";
  }

  return p;
}

// ---------- Estrazione skill dalla JD ----------
type RankedSkill = { key: string; weight: number; source: "dict" | "dynamic" };

function extractSkillsFromJD(jd: string) {
  const domain = detectDomain(jd);
  const def = getDomainDef(domain);
  const J = norm(jd);

  const ranked: RankedSkill[] = [];

  // dizionario (peso alto)
  if (def) {
    for (const [canon, vars] of Object.entries(def.dict)) {
      if (containsAny(J, vars)) ranked.push({ key: canon, weight: 5, source: "dict" });
    }
  }

  // dinamiche: uni + bi
  const toks = tokenize(jd);
  const bi = bigrams(toks);
  const uniFreq = new Map<string, number>();
  toks.forEach((t) => uniFreq.set(t, (uniFreq.get(t) || 0) + 1));
  const biFreq = new Map<string, number>();
  bi.forEach((b) => biFreq.set(b, (biFreq.get(b) || 0) + 1));

  const badBiParts = ["nella","nello","alla","alla ricerca","zona","area","sede","in possesso"];
  const topUni = Array.from(uniFreq.entries())
    .filter(([w]) => !EXCLUDE_FROM_MISSING.has(w))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 14);

  const topBi = Array.from(biFreq.entries())
    .filter(([w]) => !badBiParts.some((bp) => w.includes(bp)))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 14);

  const dynamicRaw = [...topBi, ...topUni].map(([w, f]) => ({ w, f, len: w.length }));

  function canonize(phrase: string): string {
    if (!def) return phrase;
    for (const [canon, vars] of Object.entries(def.dict)) {
      if (containsAny(phrase, vars)) return canon;
    }
    return phrase;
  }

  for (const { w, f, len } of dynamicRaw) {
    let key = canonize(w);
    const clean = sanitizeDynamic(key, domain);
    if (!clean) continue;
    key = clean;

    if (EXCLUDE_FROM_MISSING.has(key) || STOP.has(key)) continue;

    const already = ranked.find((r) => r.key === key);
    const weight = 1 + Math.min(2, f) + Math.min(2, Math.floor(len / 8));
    if (already) {
      already.weight = Math.max(already.weight, weight);
    } else {
      ranked.push({ key, weight, source: "dynamic" });
    }
  }

  const merged = uniq(ranked.sort((a, b) => b.weight - a.weight).map((r) => r.key)).slice(0, 18);
  const weights = new Map(ranked.map((r) => [r.key, r.weight]));
  return { domain, skills: merged, weights };
}

// ---------- Match CV <-> JD ----------
function matchSkillsInCV(cv: string, jdSkills: string[], domain: string) {
  const def = getDomainDef(domain);
  const present: string[] = [];
  const missing: string[] = [];

  const rawText = norm(cv);

  for (const s of jdSkills) {
    let ok = false;

    if (def && def.dict[s]) {
      const variants = def.dict[s];
      ok = variants.some((v) => softContainsTokens(rawText, v));
    } else {
      ok = softContainsTokens(rawText, s);
    }

    (ok ? present : missing).push(s);
  }
  return { present, missing };
}

// ---------- Suggerimenti / Rewrite / Cover ----------
function suggestionsFor(domain: string, present: string[], missing: string[]) {
  const def = getDomainDef(domain);
  const sug: string[] = [];

  if (missing.length) {
    const top = missing.slice(0, 10).map((m) => m[0].toUpperCase() + m.slice(1));
    sug.push(`Integra competenze richieste nella JD: ${top.join(", ")}.`);
  }

  if (def?.kpis?.length) {
    sug.push(`Quantifica i risultati con KPI rilevanti (${def.kpis.slice(0, 4).join(", ")}).`);
  }

  if (domain === "logistics") {
    if (present.includes("picking")) sug.push("Indica righe/ora e % errori nel picking.");
    if (present.includes("consegne")) sug.push("Riporta puntualità, km/giorno e feedback clienti.");
    if (present.includes("muletto")) sug.push("Specifica patentino e tipologia carrelli (frontale/retrattile).");
  } else if (domain === "it_software") {
    if (present.includes("dev")) sug.push("Evidenzia pipeline CI/CD e copertura test.");
    if (present.includes("cloud")) sug.push("Indica servizi cloud (es. AWS S3/EC2/RDS).");
    if (present.includes("db")) sug.push("Riporta ottimizzazioni query e indici.");
  } else if (domain === "marketing") {
    if (present.includes("sem")) sug.push("Inserisci ROAS/CPA per le campagne principali.");
    if (present.includes("seo")) sug.push("Cita keyword principali e crescita organica.");
  } else if (domain === "retail") {
    if (present.includes("vendite")) sug.push("Riporta conversion rate e scontrino medio.");
    if (present.includes("visual")) sug.push("Impatto allestimenti su rotazione stock.");
  } else if (domain === "accounting") {
    if (present.includes("riconciliazioni")) sug.push("Indica frequenza e tempi medi di riconciliazione.");
    if (present.includes("iva")) sug.push("Evidenzia scadenze gestite e audit senza rilievi.");
  }

  if (!sug.length) sug.push("Rafforza i risultati con indicatori misurabili (%, €, tempo).");
  return uniq(sug).slice(0, 8);
}

function rewriteCV(domain: string, present: string[], missing: string[]) {
  const def = getDomainDef(domain);
  const keep = present.slice(0, 8).map((k) => `• Esperienza in ${k}.`).join("\n");
  const add = missing.slice(0, 8).map((k) => `• Allineamento/attestato da sviluppare in ${k}.`).join("\n");

  const kpiBlock = def?.kpis?.length
    ? "RISULTATI (esempi)\n• " + def.kpis.slice(0, 4).join("\n• ")
    : "RISULTATI (esempi)\n• Aggiungi numeri concreti (%, €, tempo).";

  return [
    "PROFILO (ottimizzato)",
    def?.profile ?? "Professionista orientato/a a qualità, tempi e collaborazione.",
    "",
    "COMPETENZE RILEVANTI",
    keep || "• Competenze trasversali e organizzative.",
    "",
    kpiBlock,
    add ? "\nAREE DA POTENZIARE\n" + add : ""
  ].join("\n");
}

function coverLetter(domain: string, present: string[], _missing: string[]) {
  const def = getDomainDef(domain);
  const hi = (k: string) => present.includes(k);
  const intro = "Gentile Recruiter,";
  const close = "Cordiali saluti,\nNome Cognome";

  if (domain === "logistics") {
    const hasConsegne = hi("consegne");
    const hasPicking = hi("picking");
    const hasPacking = present.includes("packing");
    const pickingPackingLine = (hasPicking || hasPacking)
      ? "Gestione " + [hasPicking ? "picking" : null, hasPacking ? "packing" : null].filter(Boolean).join("/") + " con palmari e controllo qualità."
      : "";
    return [
      intro,
      "mi candido per la posizione in area logistica/consegne. Porto attenzione a sicurezza, puntualità e ordine.",
      hasConsegne ? "Esperienza su consegne locali con gestione DDT e rapporto con i clienti." : "",
      pickingPackingLine,
      "Sono pronto/a ad allinearmi rapidamente a WMS e procedure interne.",
      close
    ].filter(Boolean).join("\n");
  }

  if (domain === "hospitality") {
    return [
      intro,
      "sono interessato/a al ruolo in sala/cucina, con attenzione al servizio e agli standard HACCP.",
      hi("cameriere") ? "Esperienza in servizio ai tavoli e gestione coperti/turni." : "",
      hi("cucina linea") ? "Supporto in linea, pass e impiattamento con tempi rapidi." : "",
      hi("cassa") ? "Dimestichezza con POS/cassa e gestione resi." : "",
      close
    ].filter(Boolean).join("\n");
  }

  if (domain === "it_software") {
    return [
      intro,
      "mi propongo come Software Engineer con attenzione a qualità del codice e delivery continua.",
      hi("frontend") ? "Esperienza su React/SPA e performance lato client." : "",
      hi("backend") ? "Sviluppo API REST/GraphQL e microservizi." : "",
      hi("dev") ? "Pipeline CI/CD e containerizzazione per rilasci frequenti." : "",
      close
    ].filter(Boolean).join("\n");
  }

  if (domain === "marketing") {
    return [
      intro,
      "candidato/a con approccio data-driven tra SEO/SEM, adv e analytics.",
      hi("sem") ? "Gestione budget su Google/Meta Ads con focus su ROAS/CPA." : "",
      hi("seo") ? "Ottimizzazione tecnica e contenuti con crescita organica." : "",
      close
    ].filter(Boolean).join("\n");
  }

  return [
    intro,
    def?.profile ?? "posso contribuire con organizzazione, affidabilità e attenzione ai risultati.",
    "Disponibile ad allineamento rapido su processi e strumenti interni.",
    close
  ].join("\n");
}

// ---------- Core ----------
export async function analyzeATS(input: AnalyzeInput): Promise<AnalyzeOutput> {
  const resume = input.resume || "";
  const jd = input.jobDescription || "";

  // 1) Estrai skill JD
  const { domain, skills, weights } = extractSkillsFromJD(jd);

  // 2) Match col CV
  const { present, missing } = matchSkillsInCV(resume, skills, domain);

  // 3) Score pesato + overlap
  const rTok = tokenize(resume), jTok = tokenize(jd);
  const totalWeight = skills.reduce((acc, k) => acc + (weights.get(k) || 1), 0) || 1;
  const presentWeight = present.reduce((acc, k) => acc + (weights.get(k) || 1), 0);
  const coverage = presentWeight / totalWeight;
  const overlap = jaccard(rTok, jTok);
  let score = Math.round((0.85 * coverage + 0.15 * overlap) * 100);
  if (rTok.length && jTok.length && rTok.join(" ") === jTok.join(" ")) score = 100;

  // 4) Suggerimenti / riscrittura / cover
  const suggestions = suggestionsFor(domain, present, missing);
  const improvedResume = rewriteCV(domain, present, missing);
  const letter = coverLetter(domain, present, missing);

  // 5) Missing pulite (ed empty se match perfetto)
  const missingClean = missing
    .map((k) => k.trim())
    .filter((k) => k && !EXCLUDE_FROM_MISSING.has(k) && !STOP.has(k));
  const perfect = coverage >= 0.999 || score >= 100 || (coverage > 0.98 && overlap > 0.98);
  const finalMissing = perfect ? [] : uniq(missingClean).slice(0, 15);

  return {
    score,
    missingKeywords: finalMissing,
    suggestions,
    improvedResume,
    coverLetter: letter
  };
}

export default analyzeATS;
