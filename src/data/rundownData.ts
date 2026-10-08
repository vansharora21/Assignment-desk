// ─── Rundown desk data model (mirrors the Octopus rundown grid) ────────────────
export type RowKind = "story" | "break" | "segment";
export type MosStatus = "" | "READY" | "NOT READY" | "PLAY" | "END";
export type ScriptStatus = "NO SCRIPT" | "SCRIPTED" | "CHECKED" | "VISUALS";

export interface VoVtBlock {
  id: string;
  name: string;
  clipId: string;
  /** m:ss */
  dur: string;
  ready: boolean;
}

export interface RundownRow {
  id: string;
  kind: RowKind;
  ready: "" | "READY" | "NOT READY";
  scripted: boolean;
  checked: boolean;
  visuals: boolean;
  page: string;
  locked: boolean;
  mos: MosStatus;
  format: string;
  name: string;
  /** seconds */
  duration: number;
  /** seconds */
  planDur: number;
  createdBy: string;
  skipped: boolean;
  scriptText: string;
  voVt: VoVtBlock[];
  reporters: string;
  locations: string;
  tags: string;
  producer: string;
  editors: string;
}

export interface Rundown {
  /** HH:MM — also the rundown key */
  time: string;
  channel: string;
  /** planned length in seconds */
  planned: number;
  onAir: boolean;
  archived: boolean;
  rows: RundownRow[];
}

export interface RowTiming {
  hit: number | null;
  segSum: number;
  segPlan: number;
}

export const CHANNEL = "1st India";

export const TEMPLATES = [
  { label: "LINK + PKG", format: "LINK/PKG", blocks: 0 },
  { label: "LINK + VO/VT", format: "LINK/VO/VT", blocks: 1 },
  { label: "LINK + VO/VT + VO/VT", format: "LINK/VO/VT/VO/VT", blocks: 2 },
  { label: "PKG", format: "PKG", blocks: 0 },
  { label: "LINK", format: "LINK", blocks: 0 },
  { label: "VO/VT", format: "VO/VT", blocks: 1 },
];

export const LOCATIONS = [
  "Ajmer", "Alwar", "Balotra", "Banswara", "Baran", "Barmer", "Beawar", "Bharatpur", "Bhilwara",
  "Bikaner", "Bundi", "Chittorgarh", "Churu", "Dausa", "Deeg", "Delhi", "Dholpur", "Didwana-Kuchaman",
  "Dudu", "Dungarpur", "Hanumangarh", "Jaipur", "Jaipur Rural", "Jaisalmer", "Jalore", "Jhalawar",
  "Jhunjhunu", "Jodhpur", "Karauli", "Khairthal-Tijara", "Kota", "Kotputli-Behror", "Nagaur", "Neemkathana",
];

/** News 23:30 … News 00:00, newest first, as in the sidebar. */
export const BULLETIN_SLOTS: string[] = Array.from({ length: 48 }, (_, i) => {
  const mins = (47 - i) * 30;
  return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
let seq = 0;
export const newId = (prefix: string) => `${prefix}-${++seq}`;

export const fmtDur = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;

export const fmtClock = (sec: number) => {
  const s = ((sec % 86400) + 86400) % 86400;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(Math.floor(s / 3600))}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}`;
};

/** hh:mm:ss:ff timecode as shown in the script editor. */
export const fmtTimecode = (sec: number) => `${fmtClock(sec)}:00`;

export const parseDur = (text: string) => {
  const parts = text.trim().split(":").map((p) => parseInt(p, 10) || 0);
  return parts.reduce((total, part) => total * 60 + part, 0);
};

export const scriptStatus = (row: RundownRow): ScriptStatus =>
  row.visuals ? "VISUALS" : row.checked ? "CHECKED" : row.scripted ? "SCRIPTED" : "NO SCRIPT";

/** Anchor read time: roughly three words a second. */
export const readTime = (text: string) => {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.round(words / 3);
};

export const voVtTotal = (blocks: VoVtBlock[]) => blocks.reduce((sum, b) => sum + parseDur(b.dur), 0);

export const makeVoVt = (p: Partial<VoVtBlock> = {}): VoVtBlock => ({
  id: newId("vo"),
  name: "",
  clipId: "",
  dur: "0:00",
  ready: false,
  ...p,
});

export function makeRow(p: Partial<RundownRow> = {}): RundownRow {
  return {
    id: newId("row"),
    kind: "story",
    ready: "READY",
    scripted: false,
    checked: false,
    visuals: false,
    page: "",
    locked: false,
    mos: "",
    format: "LINK/PKG",
    name: "",
    duration: 0,
    planDur: 0,
    createdBy: "Director1",
    skipped: false,
    scriptText: "",
    voVt: [],
    reporters: "",
    locations: "",
    tags: "",
    producer: "",
    editors: "",
    ...p,
  };
}

export function computeTimings(rundown: Rundown): Record<string, RowTiming> {
  const [h, m] = rundown.time.split(":").map(Number);
  let clock = h * 3600 + m * 60;
  const out: Record<string, RowTiming> = {};
  let segment: RowTiming | null = null;
  for (const row of rundown.rows) {
    const timing: RowTiming = { hit: row.skipped ? null : clock, segSum: 0, segPlan: 0 };
    out[row.id] = timing;
    if (row.kind === "segment") {
      segment = timing;
      continue;
    }
    if (row.skipped) continue;
    clock += row.duration;
    if (segment) {
      segment.segSum += row.duration;
      segment.segPlan += row.planDur;
    }
  }
  return out;
}

export const totalDuration = (rundown: Rundown) =>
  rundown.rows.reduce((sum, r) => (r.kind === "segment" || r.skipped ? sum : sum + r.duration), 0);

// ─── Demo rundowns ────────────────────────────────────────────────────────────
const seg = (name: string) => makeRow({ kind: "segment", ready: "", format: "", name });
const brk = (name: string, dur = 120) =>
  makeRow({ kind: "break", ready: "", format: "", name, duration: dur, planDur: dur });
const st = (format: string, name: string, duration: number, p: Partial<RundownRow> = {}) =>
  makeRow({ format, name, duration, ...p });

const GURUGRAM_SCRIPT =
  "गुरुग्राम में दीपक नांदल गैंग के 4 बदमाश एनकाउंटर में ढेर....मुठभेड़ में 3 पुलिसकर्मियों को भी लगी गोली....यूनिवर्सिटी संस्थापक के बेटे को बना रखा था बंधक\n(( गुरुग्राम में एनकाउंटर...4 बदमाश ढेर ))";

const RANDHAWA_SCRIPT =
  "प्रभारी सुखजिंदर सिंह रंधावा पहुंचे जयपुर एयरपोर्ट\nरंधावा के साथ फ्लाइट में आए हैं सचिन पायलट भी\nPCC चीफ डोटासरा व नेता प्रतिपक्ष जूली ने किया स्वागत\nएयरपोर्ट से सचिन पायलट ने खुद चलाई गाड़ी\nबगल में बैठे सुखजिंदर रंधावा और पीछे बैठे डोटासरा-जूली";

function morningTemplate(): RundownRow[] {
  return [
    seg("PLAN ELCTION PLAZMA"),
    st("LINK/VO/VT/VO/VT", "PLAN ELCTION PLAZMA", 0),
    st("PKG", "DND_New Channel ID_190626", 8, { visuals: true }),
    st("LINK/PKG", "DND_FIRST INDIA CROMA __190626", 27),
    st("LINK/PKG", "DND_BIG BREAKING_CROMA_190626", 9),
    st("LINK/PKG", "DND_BIG BREAKING_MONTAGE__190626", 6),
    brk("BG IN"),
    st("LINK/PKG", "DND_NEWS YELLOW BG_04-09-26", 12),
    st("LINK/PKG", "DND_NEWS RED BG_04-09-26", 12),
    st("LINK/PKG", "DND_NEWS BLUE BG_04-09-26", 12),
    st("LINK/PKG", "DND_LED_RED_YELLO__190626", 14),
    st("LINK/PKG", "DND_LED_RED_WHITE__190626", 24),
    st("LINK/PKG", "DND_LED PLAZMA-02_ RED_190626", 17),
    st("LINK/PKG", "DND_LED PLAZMA-03_ RED_190626", 20),
    st("LINK/PKG", "DND_LED PLAZMA-04_ BLUE_190626", 118, { planDur: 90 }),
    brk("BG OUT"),
    st("LINK/VO/VT", "DND_NEW_PLAZMA_BREAKING__190626", 0),
    brk("HL IN"),
    brk("HL OUT"),
    brk("ANCHOR PROMO_080823", 0),
    st("LINK/PKG", "DND_PROMO ANCHOR VIJENDRA HD_190626", 14),
    st("LINK/PKG", "DND_PROMO ANCHOR POONAM HD_190626", 16),
    st("LINK/PKG", "DND_PROMO ANCHOR SHIKHA HD_190626", 14),
    st("LINK/PKG", "DND_PROMO ANCHOR JAYTI HD__190626", 17),
    brk("7AM"),
    st("LINK/PKG", "DND_SUBHA SABERE_CROMA_190626", 11),
    st("LINK/PKG", "DND_SUBHA SABERE_MONTAGE_190626", 10),
    brk("7:30 AM"),
    st("LINK/PKG", "DND_GLT_MASTER _CROMA_190626", 20),
  ];
}

function afternoonRows(): RundownRow[] {
  const hl = (name: string, duration: number, p: Partial<RundownRow> = {}) =>
    st("LINK/VO/VT", name, duration, { scripted: true, createdBy: "naveen.shukla", ...p });
  const sf = (name: string, duration: number, createdBy = "sharma") =>
    st("LINK/VO/VT", name, duration, { scripted: true, createdBy });
  return [
    seg("Segment 1"),
    st("LINK/PKG", "DND_SPEED NEWS_CROMA__190626", 363, { planDur: 300 }),
    st("LINK/PKG", "DND_SPEED PLAZMA_WITH NEW MUSIC", 362, { planDur: 300 }),
    st("PKG", "DND_New Channel ID_190626", 8, { visuals: true, createdBy: "Server" }),
    st("LINK/VO/VT", "DND_SPEED NEWS_ MONTAGE_NEW_19", 0),
    st("LINK/VO/VT/VO/VT", "HEADLINE", 50, { ready: "", planDur: 50, createdBy: "Server" }),
    seg("Segment 1"),
    st("LINK", "MOS-------01-25", 0, { ready: "NOT READY", createdBy: "naveen.shukla" }),
    hl("HL PM MODI DAURA", 9),
    hl("HL- GURUGRAM ANCOUNTER", 9, {
      scriptText: GURUGRAM_SCRIPT,
      voVt: [makeVoVt({ name: "10-1311_ GURUGRAM ANCOUNTER -VO V1", clipId: "GV00NVR1", dur: "0:44", ready: true })],
    }),
    hl("HL- JPR_UCC JANSUNWAI", 12),
    hl("HL- JPR_krishi vibhag", 10),
    hl("hl- BKN_Transfer_", 6),
    st("VO/VT/VO/VT", "HL- 49 ASP TRANSFAR", 5, { scripted: true, createdBy: "naveen.shukla" }),
    hl("HL- AJM_CAR_2_KI_MOUT_AV_VIMAL", 7),
    hl("HL MANSOON RAJASTHAN COVAR", 5),
    sf("SF 090726-kta-snek-pinjere-me-av-Gulmohd", 9),
    sf("SF 090726_AJM_FACTORY ME YUVAK FASA", 12),
    sf("SF 090726_FST_CHURU_AICC_KARYKRAM", 9),
    sf("SF 090726_CHITTORGARH_DR_SURESH_", 9, "naveen.shukla"),
    sf("SF 090726_pratapgarh_CMHO ke khilaf lage", 10),
    sf("SF 090726_BRN_1_CHORI KA KHULASA_AV", 10),
    sf("SF 090726_CHITTORGARH_NIMBAHERA_", 9),
    sf("SF 090726_CHITTORGARH_TODFOD_KYU", 13),
    sf("090726 _DPR_protest _avb _PUUNEET", 12, "virendra.katara"),
    sf("090726_hmh_khet_majdor_pardshan_avb_kapil", 11, "virendra.katara"),
    sf("090726_hmh_comrad_protest_avb_kapil", 9, "virendra.katara"),
    sf("SF 090726_NGR_NSUI VINOD JHAKHAD_AV", 9),
    sf("SF 090726_CHITTORGARH_SADAK_KI_BAAT", 9),
  ];
}

function onAirRows(): RundownRow[] {
  const nr = (format: string, name: string, duration: number, p: Partial<RundownRow> = {}) =>
    st(format, name, duration, { ready: "NOT READY", createdBy: "shelender.upadhyay", ...p });
  const off = (format: string, name: string, duration: number, p: Partial<RundownRow> = {}) =>
    nr(format, name, duration, { skipped: true, ...p });
  return [
    st("LINK/VO/VT/VO/VT", "CROMA- PLAZMA- C PLAZMA- नरेंद्र मोदी 25", 0, { mos: "PLAY" }),
    nr("LINK/VO/VT", "STING- नरेंद्र मोदी 25 साल - जनसेवा से राष्ट्रसेवा", 45, { visuals: true, mos: "NOT READY", createdBy: "Director1" }),
    nr("LINK/PKG", "HDR ((सुबह 9 बजे में इनजस्ट करवा दिए हैं...))", 0, { checked: true, createdBy: "Director1" }),
    nr("LINK/PKG", "170926_PM MODI 25 YEAR'S PKG 1", 0, { visuals: true, mos: "NOT READY", createdBy: "Director1" }),
    nr("LINK/PKG", "170926_PM MODI 25 YEAR'S PKG 2", 0, { visuals: true, mos: "NOT READY", createdBy: "Director1" }),
    off("LINK/PKG", "FULL_CM_2120_", 0),
    off("LINK/PKG", "HDR", 0, { checked: true }),
    off("LINK/VO/VT", "LIVE_071026_JPR_SUKHJINDER_DINESH", 14, {
      scripted: true,
      mos: "READY",
      createdBy: "rajendra.yadav",
      scriptText: RANDHAWA_SCRIPT,
      voVt: [makeVoVt({ name: "07-LIVE_071026_JPR", clipId: "GV00OO3G", dur: "0:14", ready: true })],
    }),
    off("LINK/PKG", "PHONO_नरेश जी", 0, { ready: "", createdBy: "rajendra.yadav" }),
    off("LINK/PKG", "PHONO_दिनेश डांगी", 0, { ready: "", createdBy: "rajendra.yadav" }),
    off("LINK/PKG", "FULL_6803_CM", 0, { scripted: true, createdBy: "rajendra.yadav" }),
    off("LINK/PKG", "FULL_6807_जयपुर में आज से 16 अक्टूबर तक", 0, { createdBy: "rajendra.yadav" }),
    off("LINK/PKG", "FULL_607_राहुल गांधी के खिलाफ पुलिस में शिकायत", 0),
    off("LINK/PKG", "FULL_2009_जयपुर: इंडियन वुल्फ इकोसिस्टम", 0),
    off("LINK/VO/VT", "MERGE FULL_ 071026_CHURU_FACTORY", 12, { scripted: true, mos: "READY" }),
    off("LINK/PKG", "FULL_2104_CM_जयपुर: VT ग्राउंड पर सीएम", 0),
    off("LINK/PKG", "FULL_2047_जयपुर : पंचायत चुनाव", 0),
    off("LINK/VO/VT", "FULL_612_राहुल-प्रियंका के खिलाफ FIR दर्ज", 9, { mos: "READY" }),
    off("LINK/PKG", "FULL_2019_जयपुर: JDA प्रवर्तन शाखा में 7", 0, { createdBy: "rajendra.yadav" }),
    nr("LINK/PKG", "FULL_610_जयपुर मेट्रो के विस्तार को लेकर आज", 0),
    nr("LINK/PKG", "FULL_6813_दैनिक भास्कर में जयपुर पुलिस", 0, { scripted: true }),
    nr("LINK/PKG", "FULL_1350_राहुल गांधी आज दिल्ली में विपक्ष के", 0),
    nr("LINK/PKG", "FULL_2100_जयपुर: औषधि नियंत्रक संगठन से", 0),
  ];
}

export function buildRundown(time: string): Rundown {
  const base = { time, channel: CHANNEL, planned: 1800, onAir: false, archived: false };
  if (time === "15:00") return { ...base, archived: true, rows: afternoonRows() };
  if (time === "09:00") return { ...base, onAir: true, rows: onAirRows() };
  return { ...base, rows: morningTemplate() };
}
