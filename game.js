// 돈벼락 (Money Rain) — 우성오락실
// 받기 게임: 아래의 캐릭터를 손가락(마우스)으로 끌어 움직여, 하늘에서 떨어지는 돈을 자루로 받는다.
// 동전이 줄줄이 연달아 떨어지는 '돈줄'도 있다. 빨간 고지서는 피해야 하고, 땅에 떨어뜨리면 신용도가 깎인다.
// 연속으로 받으면 콤보 배율이 오르고, 100콤보부터 FEVER.
// 번 돈으로 자산(저금통 → … → 우주정거장)을 사면 수입 보너스가 붙고, 총자산으로 순위를 겨룬다.
// YouTube Playables 요건: SDK 먼저, firstFrameReady/gameReady, onPause/onResume 로만 정지,
// 유튜브 음소거 따름, saveData/loadData, 모든 화면비, 터치·마우스(끌기)·키보드(←→).
"use strict";

// ───────────── 유튜브 SDK (밖에서는 localStorage) ─────────────
const YT = (typeof ytgame !== "undefined") ? ytgame : null;
const IN_YT = !!(YT && YT.IN_PLAYABLES_ENV);
const SAVE_KEY = "woosung-moneyrain-v1";
const sdk = {
  firstFrameReady() { try { YT && YT.game.firstFrameReady(); } catch (e) {} },
  gameReady() { try { YT && YT.game.gameReady(); } catch (e) {} },
  async load() {
    if (IN_YT) { try { return await YT.game.loadData(); } catch (e) { return ""; } }
    try { return localStorage.getItem(SAVE_KEY) || ""; } catch (e) { return ""; }
  },
  async save(str) {
    if (IN_YT) { try { await YT.game.saveData(str); } catch (e) {} return; }
    try { localStorage.setItem(SAVE_KEY, str); } catch (e) {}
  },
  score(v) { if (IN_YT) { try { YT.engagement.sendScore({ value: Math.floor(Math.min(v, Number.MAX_SAFE_INTEGER)) }); } catch (e) {} } },
  audioOn() { if (IN_YT) { try { return YT.system.isAudioEnabled(); } catch (e) {} } return true; },
  async lang() { if (IN_YT) { try { return await YT.system.getLanguage(); } catch (e) {} } return navigator.language || "ko"; },
  interstitial() { if (IN_YT) { try { return YT.ads.requestInterstitialAd(); } catch (e) {} } return Promise.resolve(); },
};

const TEXT = {
  ko: { title: "돈벼락", start: "시작!", shop: "자산 사기", stage: n => `스테이지 ${n}`, wallet: "지갑", worth: "총자산",
        bonus: "수입 보너스", credit: "신용도", earned: "이번 판 수입", combo: "콤보", maxCombo: "최대 콤보", acc: "받은 비율",
        clear: "스테이지 클리어!", bust: "파산!", next: "다음 스테이지", retry: "다시 도전", back: "돌아가기",
        owned: "보유", buy: "구매", locked: "???", fever: "FEVER!", go: "GO!", bill: "고지서!", miss: "놓침!",
        how: "캐릭터를 끌어서 떨어지는 돈을 받기! 빨간 고지서는 피하기", keys: "키보드: ← →",
        assets: ["돼지저금통", "자전거", "오토바이", "경차", "원룸", "아파트", "상가", "빌딩", "개인 섬", "우주정거장"],
        bought: n => `${n} 구입!`, clearBonus: "클리어 보너스", interest: "이자", interestNote: p => `지갑 돈에 판마다 이자 ${p}%`,
        caught: "받은 돈", missed: "놓친 돈", bills: "맞은 고지서", streak: "돈줄 완벽!", nice: ["좋아!", "굿!", "나이스!", "오예!"],
        rankLabel: "신분", moved: h => `${h}${josaRo(h)} 이사!`, hoodLabel: "사는 곳" },
  en: { title: "Money Rain", start: "Start!", shop: "Buy assets", stage: n => `Stage ${n}`, wallet: "Wallet", worth: "Net worth",
        bonus: "Income bonus", credit: "Credit", earned: "Earned", combo: "COMBO", maxCombo: "Max combo", acc: "Catch rate",
        clear: "Stage clear!", bust: "Bankrupt!", next: "Next stage", retry: "Try again", back: "Back",
        owned: "Owned", buy: "Buy", locked: "???", fever: "FEVER!", go: "GO!", bill: "Bill!", miss: "Missed!",
        how: "Drag your hero to catch the falling cash! Dodge red bills", keys: "Keys: ← →",
        assets: ["Piggy bank", "Bicycle", "Scooter", "Compact car", "Studio", "Apartment", "Mall", "Skyscraper", "Private island", "Space station"],
        bought: n => `Bought ${n}!`, clearBonus: "Clear bonus", interest: "Interest", interestNote: p => `Wallet earns ${p}% interest each run`,
        caught: "Caught", missed: "Missed", bills: "Bills hit", streak: "Perfect stream!", nice: ["Nice!", "Good!", "Sweet!", "Yeah!"],
        rankLabel: "Rank", rankUp: r => `Rank up: ${r}!`, moved: h => `Moved to ${h}!`, hoodLabel: "Home" },
};
let T = TEXT.ko;

function josaRo(w) { const c = w.charCodeAt(w.length - 1) - 0xac00, j = c >= 0 && c < 11172 ? c % 28 : 0; return j && j !== 8 ? "으로" : "로"; }
function won(n) {                                                 // 한국식 큰 돈 표기: 3억 2,000만원
  n = Math.floor(n);
  if (T === TEXT.en) {
    const u = [[1e12, "T"], [1e9, "B"], [1e6, "M"]].find(([v]) => n >= v);
    return u ? `₩${(n / u[0]).toFixed(n / u[0] < 10 ? 2 : 1)}${u[1]}` : `₩${n.toLocaleString("en-US")}`;
  }
  if (n >= 1e12) { const j = Math.floor(n / 1e12), e = Math.floor((n % 1e12) / 1e8); return `${j.toLocaleString()}조${e ? ` ${e.toLocaleString()}억` : ""}원`; }
  if (n >= 1e8) { const e = Math.floor(n / 1e8), m = Math.floor((n % 1e8) / 1e4); return `${e.toLocaleString()}억${m ? ` ${m.toLocaleString()}만` : ""}원`; }
  if (n >= 1e4) { const m = Math.floor(n / 1e4), r = n % 1e4; return `${m.toLocaleString()}만${r ? ` ${r.toLocaleString()}` : ""}원`; }
  return `${n.toLocaleString("ko-KR")}원`;
}

// ───────────── 규칙 ─────────────
const ITEMS = { coin: 100, bill: 10000, bundle: 50000, gold: 200000, diamond: 1000000 };   // 100원 동전 · 만 원권 · 오만 원권 · 금괴 · 다이아
const ASSETS = [                                                  // 가격 · 수입 보너스
  { id: "piggy",   price: 4e5,    bonus: 0.10 }, { id: "bike",    price: 4e6,    bonus: 0.15 },   // 지폐가 진짜 액수(만·오만 원)라 가격도 그만큼 큼
  { id: "scooter", price: 1.6e7,  bonus: 0.25 }, { id: "car",     price: 6.4e7,  bonus: 0.40 },
  { id: "studio",  price: 4.8e8,  bonus: 0.60 }, { id: "apt",     price: 2.4e9,  bonus: 1.00 },
  { id: "mall",    price: 9.6e9,  bonus: 1.80 }, { id: "tower",   price: 4.8e10, bonus: 3.00 },
  { id: "island",  price: 2.4e11, bonus: 5.00 }, { id: "station", price: 1.6e12, bonus: 9.00 },
];
const INTEREST = 0.02;                                            // 판이 끝날 때마다 지갑 돈에 붙는 이자
const C = { pink: "#ff40a0", cyan: "#3ce6ff", yellow: "#ffd640", green: "#5cff8a", red: "#ff4d6d", ink: "#1a1030", night: "#0e0a22", gold: "#ffcf40" };

const st = {
  mode: "title", ready: false, paused: false, t: 0,
  stage: 1, wallet: 0, owned: 0, plays: 0, best: 0, bestCombo: 0,
  round: null, drops: [], time: 0, earn: 0, shownEarn: 0, combo: 0, maxCombo: 0, credit: 100,
  caught: 0, missed: 0, billsHit: 0, judge: null, judgeT: 0, fx: [], pops: [], banner: null, bannerT: 0,
  hits: [], result: null, flash: 0,
  pl: { x: 0.5, tx: 0.5, vx: 0, pose: "idle", poseT: 0, face: 1, stun: 0 },   // 아래에서 돈을 받는 사람 (x: 0~1)
};
const assetBonus = () => ASSETS.slice(0, st.owned).reduce((a, x) => a + x.bonus, 0);
const netWorth = () => st.wallet + ASSETS.slice(0, st.owned).reduce((a, x) => a + x.price, 0);
const comboMult = c => c >= 60 ? 4 : c >= 30 ? 3 : c >= 10 ? 2 : 1;
const fever = () => st.combo >= 100;

// ───────────── 저장 ─────────────
function save() { sdk.save(JSON.stringify({ v: 1, stage: st.stage, wallet: st.wallet, owned: st.owned, plays: st.plays, best: st.best, bestCombo: st.bestCombo })); }
async function loadSave() {
  const raw = await sdk.load(); if (!raw) return;
  try {
    const d = JSON.parse(raw);
    st.stage = Math.max(1, d.stage | 0); st.wallet = Math.max(0, +d.wallet || 0); st.owned = Math.min(ASSETS.length, Math.max(0, d.owned | 0));
    st.plays = d.plays | 0; st.best = Math.max(0, +d.best || 0); st.bestCombo = d.bestCombo | 0;
  } catch (e) {}
}

// ───────────── 소리 (음악도 코드로 연주) ─────────────
let actx = null, master = null, noiseBuf = null, audioEnabled = true;
function ensureAudio() {
  if (actx) { if (actx.state === "suspended" && audioEnabled) actx.resume(); return; }
  try {
    actx = new (window.AudioContext || window.webkitAudioContext)();
    master = actx.createGain(); master.gain.value = audioEnabled ? 0.32 : 0; master.connect(actx.destination);
    noiseBuf = actx.createBuffer(1, actx.sampleRate * 0.3, actx.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  } catch (e) { actx = null; }
}
function setAudio(on) { audioEnabled = on; if (master) master.gain.value = on ? 0.32 : 0; }
function tone(f, dur, type = "square", vol = 0.2, slide = 0) {
  if (!actx || !audioEnabled || st.paused) return;
  const t = actx.currentTime, o = actx.createOscillator(), g = actx.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f * slide), t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
}
function noise(dur, vol, hp) {
  if (!actx || !audioEnabled || st.paused || !noiseBuf) return;
  const t = actx.currentTime, s = actx.createBufferSource(), f = actx.createBiquadFilter(), g = actx.createGain();
  s.buffer = noiseBuf; f.type = "highpass"; f.frequency.value = hp;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + dur);
}
// 화음 (줄마다 그 화음의 음을 하나씩 맡는다). 진행은 사는 동네(자산 단계)마다 다르다.
const CH = {
  C: [261.6, 329.6, 392.0, 523.3], Am: [220.0, 261.6, 329.6, 440.0], F: [174.6, 220.0, 261.6, 349.2], G: [196.0, 246.9, 293.7, 392.0],
  Em: [164.8, 196.0, 246.9, 329.6], Dm: [146.8, 174.6, 220.0, 293.7], Fmaj7: [174.6, 220.0, 261.6, 329.6], Cmaj7: [261.6, 329.6, 392.0, 493.9],
};
// 자산 단계별 동네: 배경 그림 · 화음 진행 · 멜로디 음색 · 줄 색 분위기
const HOODS = [
  { bg: "bg_rooftop",   min: 0,  prog: ["Am", "F", "C", "G"],     wave: "square",   ko: "옥탑방 동네",   en: "Rooftop flat" },
  { bg: "bg_street",    min: 2,  prog: ["C", "G", "Am", "F"],     wave: "square",   ko: "골목 상가",     en: "Shop street" },
  { bg: "city_bg",      min: 4,  prog: ["C", "Am", "F", "G"],     wave: "square",   ko: "도시 야경",     en: "City lights" },
  { bg: "bg_hanriver",  min: 5,  prog: ["F", "G", "Em", "Am"],    wave: "triangle", ko: "한강 아파트",   en: "Riverside" },
  { bg: "bg_penthouse", min: 7,  prog: ["Dm", "G", "Cmaj7", "Am"], wave: "sawtooth", ko: "구름 위 펜트하우스", en: "Penthouse" },
  { bg: "bg_island",    min: 9,  prog: ["C", "F", "G", "F"],      wave: "triangle", ko: "나만의 섬",     en: "Private island" },
  { bg: "bg_space",     min: 10, prog: ["Fmaj7", "Em", "Dm", "Cmaj7"], wave: "sine", ko: "우주",          en: "Outer space" },
];
const hoodOf = owned => { let h = 0; HOODS.forEach((x, i) => { if (owned >= x.min) h = i; }); return h; };
const hood = () => HOODS[hoodOf(st.owned)];
const chordAt = t => CH[hood().prog[Math.floor(Math.max(0, t) / (st.round ? st.round.beat * 4 : 2)) % 4]];
const sfx = {
  kick() { tone(150, 0.12, "sine", 0.5, 0.3); },
  snare() { noise(0.12, 0.22, 1500); },
  hat() { noise(0.03, 0.08, 7000); },
  bass(f) { tone(f / 2, 0.18, "triangle", 0.22); },
  catchAt(x) { const i = Math.max(0, Math.min(3, Math.floor(x * 4))), w = fever() ? "sawtooth" : hood().wave;   // 받은 자리(왼→오)에 따라 화음 음
    tone(chordAt(st.time)[i] * 2, 0.12, w, w === "sine" || w === "triangle" ? 0.16 : 0.11); },
  coin() { tone(1568, 0.05, "square", 0.08); },
  bad() { tone(140, 0.3, "sawtooth", 0.25, 0.5); },
  miss() { tone(110, 0.08, "square", 0.06); },
  fanfare() { [523, 659, 784, 1047, 1319].forEach((f, i) => setTimeout(() => tone(f, 0.14, "square", 0.16), i * 100)); },
  buy() { [784, 988, 1319, 1568].forEach((f, i) => setTimeout(() => tone(f, 0.08, "square", 0.15), i * 60)); },
  tick() { tone(880, 0.06, "square", 0.12); },
};

// ───────────── 한 판 설정 ─────────────
function makeRound(stage) {
  const bpm = Math.min(150, 84 + (stage - 1) * 6);               // 배경 음악 빠르기
  return {
    bpm, beat: 60 / bpm, lead: 1.6,                                 // 1.6초 카운트 뒤 시작
    len: stage <= 2 ? 40 : 50,                                      // 처음 두 판은 짧게
    fall: Math.max(0.95, 2.7 - stage * 0.1),                        // 위에서 자루까지 떨어지는 시간 (초반엔 천천히)
    every: Math.max(0.24, 0.95 - stage * 0.05),                     // 돈이 나오는 간격
    badP: stage <= 2 ? 0 : Math.min(0.2, 0.03 + (stage - 2) * 0.015),    // 고지서 비율 (3판부터)
    sway: stage < 5 ? 0 : Math.min(0.13, (stage - 4) * 0.016),     // 바람: 5판부터 좌우로 흔들리며 떨어짐
    streamP: Math.min(0.2, 0.07 + stage * 0.012),                   // 돈줄(동전 연달아) 비율
    reach: Math.min(0.85, 0.42 + stage * 0.035),                    // 다음 돈이 떨어질 수 있는 최대 가로 거리 (화면 폭 비율)
    diamondAt: 0.35 + Math.random() * 0.4,                          // 판 중간쯤 다이아 한 번
  };
}
function itemType(stage) {
  const r = Math.random(), g = Math.min(0.03, 0.004 + stage * 0.002), b = Math.min(0.1, 0.04 + stage * 0.004);
  return r < g ? "gold" : r < g + b ? "bundle" : r < g + b + 0.3 ? "bill" : "coin";
}

// ───────────── 진행 ─────────────
function startRound() {
  ensureAudio();
  st.round = makeRound(st.stage);
  st.pl = { x: 0.5, tx: 0.5, vx: 0, pose: "idle", poseT: 0, face: 1, stun: 0 };
  st.mode = "play"; st.time = 0; st.earn = 0; st.shownEarn = 0; st.combo = 0; st.maxCombo = 0; st.credit = 100;
  st.caught = 0; st.missed = 0; st.billsHit = 0; st.judge = null; st.fx = []; st.pops = []; st.drops = [];
  st.lastStep = -1; st.spawnT = 0; st.lastX = 0.5; st.stream = null; st.diamondDone = false; st.streamId = 0;
}

function spawn() {
  const r = st.round, k = st.time - r.lead;
  if (st.stream) {                                                 // 돈줄: 동전이 줄줄이 (살짝 휘어지며)
    const s = st.stream;
    const x = Math.max(0.07, Math.min(0.93, s.x + Math.sin(s.i * 0.7) * s.wave));
    st.drops.push({ x, y: 0, type: "coin", bad: false, stream: s.id, rot: 0 });
    st.lastX = x;
    if (++s.i >= s.n) st.stream = null;
    st.spawnT = 0.12; return;
  }
  // 다음 돈은 이전 자리에서 너무 멀지 않게 (손이 따라갈 수 있게)
  let x = st.lastX + (Math.random() * 2 - 1) * r.reach;
  x = Math.max(0.07, Math.min(0.93, x));
  if (!st.diamondDone && k > r.len * r.diamondAt) {
    st.diamondDone = true; st.drops.push({ x, y: 0, type: "diamond", bad: false, rot: 0 });
  } else if (Math.random() < r.badP) {
    st.drops.push({ x, y: 0, type: "bad", bad: true, rot: 0, ...windOf(r) });   // 고지서는 받는 길과 상관없이 아무 데나
    st.spawnT = r.every * (0.5 + Math.random() * 0.5); return;
  } else if (k > 3 && Math.random() < r.streamP) {
    st.stream = { id: ++st.streamId, x, i: 0, n: 5 + Math.floor(Math.random() * (4 + st.stage)), wave: Math.random() < 0.5 ? 0 : 0.06 + Math.random() * 0.08, got: 0 };
    st.streamLen = st.streamLen || {}; st.streamLen[st.streamId] = st.stream.n;
    st.streamGot = st.streamGot || {}; st.streamGot[st.streamId] = 0;
    spawn(); return;
  } else st.drops.push({ x, y: 0, type: itemType(st.stage), bad: false, rot: 0, ...windOf(r) });
  st.lastX = x;
  st.spawnT = r.every * (0.75 + Math.random() * 0.5);
}

function windOf(r) {                                               // 흔들림: 기준 x 를 중심으로 좌우로
  if (!r.sway || Math.random() < 0.35) return {};
  return { sway: r.sway * (0.5 + Math.random() * 0.5), freq: 2 + Math.random() * 2.5, ph: Math.random() * 6 };
}
function setPose(p, t) { st.pl.pose = p; st.pl.poseT = t; }
function gainOf(type) {
  const base = fever() ? Math.max(ITEMS[type], ITEMS.bundle) : ITEMS[type];
  return Math.round(base * comboMult(st.combo) * (fever() ? 2 : 1) * (1 + 0.2 * (st.stage - 1)) * (1 + assetBonus()));
}

function catchDrop(d) {
  const px = playX(d.x), y = catchY();
  if (d.bad) {                                                    // 고지서를 받아 버림
    const loss = Math.floor(st.earn * 0.1);
    st.earn -= loss; st.combo = 0; st.credit = Math.max(0, st.credit - 12); st.flash = 1; st.billsHit++;
    st.judge = { text: T.bill, col: C.red }; st.judgeT = 1; sfx.bad(); setPose("dizzy", 0.7); st.pl.stun = 0.45;
    if (loss) pop(px, y - 40, `-${won(loss)}`, C.red);
    return;
  }
  st.caught++; st.combo++; st.maxCombo = Math.max(st.maxCombo, st.combo);
  st.credit = Math.min(100, st.credit + 1);
  const gain = gainOf(d.type);
  st.earn += gain;
  setPose("catch", 0.2);
  burst(px, y, d.type);
  pop(px, y - 30, `+${won(gain)}`, d.type === "diamond" ? C.cyan : C.yellow);
  sfx.catchAt(d.x);
  if (d.type === "diamond" || d.type === "gold") sfx.coin();
  if (d.stream) {                                                 // 돈줄을 하나도 안 놓치면 보너스
    st.streamGot[d.stream]++;
    if (st.streamGot[d.stream] === st.streamLen[d.stream]) {
      const b = gainOf("bundle"); st.earn += b;
      st.judge = { text: T.streak, col: C.gold }; st.judgeT = 1; pop(px, y - 60, `+${won(b)}`, C.gold); sfx.coin();
    }
  } else if (st.combo % 5 === 0) { st.judge = { text: T.nice[Math.floor(Math.random() * T.nice.length)], col: C.cyan }; st.judgeT = 0.8; }
  if (st.combo === 10 || st.combo === 30 || st.combo === 60) banner(`x${comboMult(st.combo)}!`, C.yellow);
  if (st.combo === 100) { banner(T.fever, C.gold); st.flash = 1; sfx.fanfare(); }
}

function missDrop(d) {
  if (d.bad) return;                                              // 고지서는 땅에 떨어져도 OK
  st.missed++; st.combo = 0; st.credit = Math.max(0, st.credit - (st.stage <= 3 ? 4 : 6));
  st.judge = { text: T.miss, col: C.red }; st.judgeT = 0.8; sfx.miss();
  const px = playX(d.x);
  for (let k = 0; k < 4; k++) st.fx.push({ x: px, y: groundY(), vx: (Math.random() - 0.5) * 120, vy: -80 - Math.random() * 80, life: 0.5, col: "#8a8aa8" });
}

function endRound(bust) {
  if (st.mode !== "play") return;
  st.plays++;
  const acc = st.caught / Math.max(1, st.caught + st.missed);
  const clear = !bust;
  const bonus = clear ? Math.floor(st.earn * 0.2) : 0;
  const interest = Math.floor(st.wallet * INTEREST);              // 모아 둔 돈에 이자
  st.wallet += st.earn + bonus + interest;
  st.bestCombo = Math.max(st.bestCombo, st.maxCombo);
  const rank = acc >= 0.95 ? "S" : acc >= 0.85 ? "A" : acc >= 0.7 ? "B" : "C";
  st.result = { clear, earn: st.earn, bonus, interest, acc, rank, maxCombo: st.maxCombo, caught: st.caught, missed: st.missed, bills: st.billsHit, stage: st.stage };
  if (clear) { st.stage++; sfx.fanfare(); } else sfx.bad();
  st.best = Math.max(st.best, netWorth());
  sdk.score(st.best);
  if (window.WSA_LB) window.WSA_LB.submit(Math.floor(netWorth()), { char: st.owned ? ASSETS[st.owned - 1].id : "coin", tier: 0 });
  st.mode = "result"; save();
}

async function afterResult() {
  if (st.plays > 0 && st.plays % 3 === 0) {                        // 세 판마다 전면 광고 (유튜브 안에서만)
    st.paused = true; try { await sdk.interstitial(); } catch (e) {} st.paused = false; startLoop();
  }
  startRound();
}

function buyAsset() {
  const a = ASSETS[st.owned]; if (!a || st.wallet < a.price) return;
  const before = hoodOf(st.owned);
  st.wallet -= a.price; st.owned++; sfx.buy(); st.flash = 0.6;
  const after = hoodOf(st.owned);
  if (after !== before) { bgFrom = before; bgFade = 1; banner(T.moved(T === TEXT.ko ? HOODS[after].ko : HOODS[after].en), C.cyan); }
  else if (lookOf(st.owned) !== lookOf(st.owned - 1)) banner(T === TEXT.ko ? `${rankName()}${josaRo(rankName())} 신분 상승!` : T.rankUp(rankName()), C.yellow);
  else banner(T.bought(T.assets[st.owned - 1]), C.yellow);
  st.best = Math.max(st.best, netWorth()); save();
  if (window.WSA_LB) window.WSA_LB.submit(Math.floor(netWorth()), { char: a.id, tier: 0 });
}

function banner(text, col) { st.banner = { text, col }; st.bannerT = 1.4; }
function pop(x, y, text, col) { st.pops.push({ x, y, text, col, life: 1 }); }
function burst(x, y, type) {
  const col = type === "diamond" ? C.cyan : type === "bill" || type === "bundle" ? C.green : C.yellow;
  st.fx.push({ ring: true, x, y, life: 1, col: fever() ? C.gold : "#ffffff" });
  for (let k = 0; k < (type === "coin" ? 6 : 12); k++) {
    const a = Math.random() * Math.PI * 2, v = 80 + Math.random() * 160;
    st.fx.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 120, life: 0.7, col });
  }
}

// ───────────── 갱신 ─────────────
function update(dt) {
  st.t += dt;
  if (st.bannerT > 0) st.bannerT -= dt;
  st.judgeT = Math.max(0, st.judgeT - dt * 1.6);
  st.flash = Math.max(0, st.flash - dt * 2.5);
  bgFade = Math.max(0, bgFade - dt * 0.8);
  { const p = st.pl;                                               // 손가락을 따라 달려감 (최고 속도 제한)
    p.stun = Math.max(0, p.stun - dt);
    const want = (p.tx - p.x) * 16, maxV = 3.2;                   // 끌기도 부드럽고 천천히 따라옴
    p.vx = p.stun > 0 ? 0 : Math.max(-maxV, Math.min(maxV, want));
    if (Math.abs(p.vx) > 0.15) p.face = p.vx > 0 ? 1 : -1;
    p.x = Math.max(0.05, Math.min(0.95, p.x + p.vx * dt));
    if (p.poseT > 0 && (p.poseT -= dt) <= 0) p.pose = "idle"; }
  for (const p of st.pops) { p.life -= dt * 1.2; p.y -= dt * 50; }
  st.pops = st.pops.filter(p => p.life > 0);
  for (const f of st.fx) { f.life -= dt * (f.ring ? 3 : 1.6); if (!f.ring) { f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 500 * dt; } }
  st.fx = st.fx.filter(f => f.life > 0);
  st.shownEarn += (st.earn - st.shownEarn) * Math.min(1, dt * 10);
  if (st.mode !== "play") return;
  const r = st.round;
  st.time += dt;
  // 배경 음악: 8분음표마다 하이햇, 박마다 킥/스네어/베이스. 시작 전엔 3·2·1
  const step = Math.floor(st.time / (r.beat / 2));
  if (step !== st.lastStep) {
    st.lastStep = step;
    if (st.time < r.lead) { const n = 3 - Math.floor(st.time / (r.lead / 3)); if (step % 2 === 0) { sfx.tick(); banner(n >= 1 ? String(n) : T.go, C.cyan); } }
    else if (st.time < r.lead + r.len + r.fall) {
      if (st.time - r.lead < 0.3) banner(T.go, C.cyan);
      sfx.hat();
      if (step % 2 === 0) { const b = (step / 2) % 4; if (b === 0 || b === 2) sfx.kick(); else sfx.snare(); sfx.bass(chordAt(st.time)[0]); }
    }
  }
  // 돈 떨어뜨리기
  if (st.time >= r.lead && st.time < r.lead + r.len) {
    st.spawnT -= dt;
    while (st.spawnT <= 0) spawn();
  } else if (st.stream) st.stream = null;                          // 시간이 다 되면 돈줄도 끊음
  // 떨어지는 돈: 자루에 닿으면 받기, 땅에 닿으면 놓침
  const cy = catchY(), gy = groundY(), half = catchHalf(), top = -30;
  const v = (cy - top) / r.fall;
  for (const d of st.drops) {
    const prev = d.y;
    d.y += v * dt * (d.bad ? 0.85 : 1); d.rot += dt * (d.bad ? 3 : 2);
    if (d.sway) { if (d.bx == null) d.bx = d.x; d.age = (d.age || 0) + dt; d.x = Math.max(0.05, Math.min(0.95, d.bx + Math.sin(d.age * d.freq + d.ph) * d.sway)); }
    const py = top + d.y, pprev = top + prev;
    if (!d.done && pprev < cy && py >= cy) {                         // 자루 높이를 지나가는 순간
      if (Math.abs(d.x - st.pl.x) <= half && st.pl.stun <= 0) { d.done = true; catchDrop(d); }
    }
    if (!d.done && py >= gy) { d.done = true; missDrop(d); }
  }
  st.drops = st.drops.filter(d => !d.done);
  if (st.credit <= 0) { endRound(true); return; }
  if (st.time >= r.lead + r.len && !st.drops.length) endRound(false);
}

// ───────────── 화면 ─────────────
const cv = document.getElementById("c");
const cx = cv.getContext("2d");
const view = { w: 0, h: 0, dpr: 1 };
function layout() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
  const w = cv.clientWidth || innerWidth, h = cv.clientHeight || innerHeight;
  cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
  view.dpr = dpr; view.w = w; view.h = h;
}
window.addEventListener("resize", layout);
const R = Math.round;
const IMG_V = "3";                                                 // 그림을 바꾸면 올려서 브라우저가 새 그림을 받게
function img(n) { const im = new Image(); im.src = `img/${n}.png?v=${IMG_V}`; return im; }
function imgOk(im) { return im && im.complete && im.naturalWidth > 0; }
const ITEM_IMG = Object.fromEntries(["coin", "bill", "bundle", "gold", "diamond", "bad"].map(n => [n, img(`item_${n}`)]));
const ASSET_IMG = ASSETS.map(a => img(`asset_${a.id}`));
const BGS = HOODS.map(h => img(h.bg));
// 거지 → 황금 재벌 10단계: 자산을 하나 살 때마다 한 단계 (섬·우주정거장은 마지막 단계)
const RANKS = {
  ko: ["거지", "편의점 알바", "대학생", "배달 라이더", "신입 사원", "과장님", "사장님", "회장님", "재벌", "황금 재벌"],
  en: ["Beggar", "Part-timer", "Student", "Delivery rider", "New hire", "Manager", "CEO", "Chairman", "Tycoon", "Golden billionaire"],
};
const lookOf = owned => Math.min(9, owned);
const HERO = Array.from({ length: 10 }, (_, k) => ({ a: img(`rich_${k}_a`), b: img(`rich_${k}_b`), c: img(`rich_${k}_c`) }));
const rankName = () => (T === TEXT.ko ? RANKS.ko : RANKS.en)[lookOf(st.owned)];
let bgFrom = null, bgFade = 0;                                     // 이사할 때 이전 배경에서 서서히 바뀜

const PIX_FONT = '"Galmuri11", "Apple SD Gothic Neo", "Noto Sans KR", monospace';
try {
  const ff = new FontFace("Galmuri11", "url(fonts/Galmuri11-Bold.woff2)");
  ff.load().then(f => document.fonts.add(f)).catch(() => {});
} catch (e) {}

function text(str, x, y, size, color, align = "center", shadow = true, maxW = 0) {
  cx.save();
  cx.font = `${Math.round(size)}px ${PIX_FONT}`;
  if (maxW) { const tw = cx.measureText(str).width; if (tw > maxW) { size = Math.floor(size * maxW / tw); cx.font = `${size}px ${PIX_FONT}`; } }
  cx.textAlign = align; cx.textBaseline = "middle";
  if (shadow) { cx.fillStyle = C.ink; const o = Math.max(2, Math.round(size / 11)); cx.fillText(str, x + o, y + o); }
  cx.fillStyle = color; cx.fillText(str, x, y); cx.restore();
}
function signText(str, x, y, size, maxW, top = "#fff3a0", mid = C.yellow, bot = "#ff9a3c") {   // 입체 간판 글씨
  cx.save(); cx.font = `${size}px ${PIX_FONT}`; cx.textAlign = "center"; cx.textBaseline = "middle";
  const tw = cx.measureText(str).width; if (maxW && tw > maxW) { size = Math.floor(size * maxW / tw); cx.font = `${size}px ${PIX_FONT}`; }
  const d = Math.max(3, R(size * 0.1));
  for (let i = d; i > 0; i--) { cx.fillStyle = i === d ? C.ink : "#7a3a10"; cx.fillText(str, x + i, y + i); }
  cx.lineWidth = Math.max(3, size * 0.1); cx.lineJoin = "round"; cx.strokeStyle = C.ink; cx.strokeText(str, x, y);
  const g = cx.createLinearGradient(0, y - size / 2, 0, y + size / 2);
  g.addColorStop(0, top); g.addColorStop(0.5, mid); g.addColorStop(1, bot);
  cx.fillStyle = g; cx.fillText(str, x, y); cx.restore();
}
function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255];
  return `rgb(${c.map(v => Math.round(k > 0 ? v + (255 - v) * k : v * (1 + k))).join(",")})`;
}
function stepRect(g, x, y, w, h, p) { g.fillRect(x + 2 * p, y, w - 4 * p, h); g.fillRect(x + p, y + p, w - 2 * p, h - 2 * p); g.fillRect(x, y + 2 * p, w, h - 4 * p); }
function pixelBox(x, y, w, h, fill, edge, press = 0) {
  x = R(x); y = R(y); w = R(w); h = R(h);
  const p = Math.max(2, Math.round(Math.min(w, h) / 24)), o = Math.round(press * p * 2);
  cx.fillStyle = "#120a26"; stepRect(cx, x, y + 3 * p, w, h, p);
  cx.fillStyle = shade(edge, -0.45); stepRect(cx, x, y + o, w, h, p);
  const ix = x + p, iy = y + o + p, iw = w - 2 * p, ih = h - 2 * p;
  cx.fillStyle = shade(fill, -0.28); stepRect(cx, ix, iy, iw, ih, p);
  cx.fillStyle = fill; stepRect(cx, ix, iy, iw, ih - 2 * p, p);
  cx.fillStyle = shade(fill, 0.35); cx.fillRect(ix + 2 * p, iy + p, iw - 4 * p, Math.max(p, Math.round(ih * 0.18)));
  cx.fillStyle = "rgba(255,255,255,.9)"; cx.fillRect(ix + 2 * p, iy + p, 2 * p, p); cx.fillRect(ix + p, iy + 2 * p, p, p);
  return o;
}
function button(x, y, w, h, label, fill, edge, fn, color = "#ffffff") {
  pixelBox(x, y, w, h, fill, edge, 0);
  text(label, x + w / 2, y + h / 2, Math.round(h * 0.38), color, "center", false, w - 24);
  hit(x, y, w, h, fn);
}
function hit(x, y, w, h, fn) { st.hits.push({ x, y, w, h, fn }); }
function fitImg(im, x, y, w, h) {
  if (!imgOk(im)) return;
  const s = Math.min(w / im.naturalWidth, h / im.naturalHeight), dw = im.naturalWidth * s, dh = im.naturalHeight * s;
  cx.drawImage(im, R(x + (w - dw) / 2), R(y + (h - dh) / 2), R(dw), R(dh));
}

function col() { const W = Math.min(view.w, view.h * 0.62); return { W, X: (view.w - W) / 2, H: view.h }; }
const playL = () => { const { W, X } = col(); return X + W * 0.04; };
const playW = () => col().W * 0.92;
const playX = x => playL() + playW() * x;                          // 0~1 → 화면 x
const heroH = () => Math.min(col().W * 0.33, view.h * 0.2);
const groundY = () => view.h - 16;                                 // 발이 닿는 땅
const catchY = () => R(groundY() - heroH() * 0.92);                // 머리 위로 든 자루 높이
const catchHalf = () => (heroH() * 0.36) / playW();                // 자루 폭의 절반 (0~1 비율)
const dropSize = () => Math.min(col().W * 0.15, 62);

function drawBg(X, W, H) {
  cx.fillStyle = C.night; cx.fillRect(0, 0, view.w, H);
  const cover = (im, a) => {
    if (!imgOk(im)) return;
    const s = Math.max(view.w / im.naturalWidth, H / im.naturalHeight), dw = im.naturalWidth * s, dh = im.naturalHeight * s;
    cx.globalAlpha = a; cx.drawImage(im, R((view.w - dw) / 2), R(H - dh), R(dw), R(dh)); cx.globalAlpha = 1;
  };
  let cur = BGS[hoodOf(st.owned)];
  if (!imgOk(cur)) cur = BGS[2];                                   // 아직 안 불러졌으면 도시 야경
  if (bgFrom !== null && bgFade > 0) { cover(BGS[bgFrom], 1); cover(cur, 1 - bgFade); }
  else cover(cur, 1);
  if (fever() && st.mode === "play") {                           // FEVER: 금빛으로 일렁
    cx.fillStyle = `rgba(255,190,40,${0.18 + 0.08 * Math.sin(st.t * 8)})`; cx.fillRect(0, 0, view.w, H);
  }
}

function drawField(X, W, H) {
  const gy = groundY();
  cx.fillStyle = "rgba(10,6,30,.35)"; cx.fillRect(R(X), 0, R(W), H);
  cx.fillStyle = "rgba(255,255,255,.25)"; cx.fillRect(R(playL()), R(gy), R(playW()), 2);   // 땅 선
  drawHero(H);
  if (!("ontouchstart" in window) && st.mode === "play") text(T.keys, X + W / 2, H - 6, 11, "rgba(255,255,255,.55)", "center", false);
}

function drawHero(H) {
  const p = st.pl, o = lookOf(st.owned), pose = p.pose === "catch" ? "b" : p.pose === "dizzy" ? "c" : "a";
  const im = HERO[o][pose], hh = heroH();
  const x = playX(p.x), moving = Math.abs(p.vx) > 0.2;
  const hop = pose === "b" ? hh * 0.06 : moving ? Math.abs(Math.sin(st.t * 26)) * hh * 0.04 : Math.abs(Math.sin(st.t * 4)) * hh * 0.015;
  const feet = groundY();
  cx.fillStyle = "rgba(0,0,0,.35)"; cx.beginPath(); cx.ellipse(R(x), R(feet), hh * 0.28, hh * 0.06, 0, 0, 7); cx.fill();   // 그림자
  if (!imgOk(im)) { cx.fillStyle = C.yellow; cx.fillRect(R(x - hh * 0.2), R(feet - hh), R(hh * 0.4), R(hh)); return; }
  const s = hh / 110, w = im.naturalWidth * s, h = im.naturalHeight * s;   // 모든 그림이 같은 배율 (서 있는 키 110px)
  cx.save(); cx.translate(R(x), R(feet - hop));
  if (moving) cx.rotate(Math.max(-0.25, Math.min(0.25, p.vx * 0.08)));   // 달릴 때 살짝 기울기
  if (p.face < 0 && pose !== "a") cx.scale(-1, 1);
  if (fever() && st.mode === "play") { cx.shadowColor = C.gold; cx.shadowBlur = 16; }
  cx.drawImage(im, R(-w / 2), R(-h), R(w), R(h));
  cx.restore();
}

function drawDrops() {
  if (!st.round) return;
  const sz = dropSize(), top = -30;
  for (const d of st.drops) {
    const x = playX(d.x), y = top + d.y;
    const im = d.bad ? ITEM_IMG.bad : ITEM_IMG[fever() && d.type !== "diamond" ? "gold" : d.type];
    cx.save(); cx.translate(R(x), R(y)); cx.rotate(Math.sin(d.rot) * (d.bad ? 0.25 : 0.15));
    if (d.type === "diamond") { cx.shadowColor = C.cyan; cx.shadowBlur = 14; }
    const s = d.stream ? sz * 0.7 : sz;
    fitImg(im, -s / 2, -s / 2, s, s);
    cx.restore();
  }
}

function drawFx() {
  for (const f of st.fx) {
    cx.globalAlpha = Math.max(0, f.life);
    if (f.ring) {
      const r = (1 - f.life) * heroH() * 0.5 + 10;
      cx.strokeStyle = f.col; cx.lineWidth = 4; cx.beginPath(); cx.arc(f.x, f.y, r, 0, 7); cx.stroke();
    } else { cx.fillStyle = f.col; cx.fillRect(R(f.x), R(f.y), 5, 5); }
  }
  cx.globalAlpha = 1;
  for (const p of st.pops) { cx.globalAlpha = Math.min(1, p.life * 1.5); text(p.text, p.x, p.y, 15, p.col, "center", true, col().W * 0.45); }
  cx.globalAlpha = 1;
}

function drawHud(X, W, H) {
  const s = st.round;
  cx.fillStyle = "rgba(14,10,34,.78)"; cx.fillRect(R(X), 0, R(W), 74);
  text(T.stage(st.stage), X + 12, 18, 15, C.cyan, "left");
  text(won(st.shownEarn), X + W / 2, 30, 26, C.yellow, "center", true, W * 0.6);
  text(`x${comboMult(st.combo) * (fever() ? 2 : 1)}`, X + W - 12, 18, 18, fever() ? C.gold : "#ffffff", "right");
  // 곡 진행 + 신용도
  const k = s ? Math.min(1, Math.max(0, (st.time - s.lead) / s.len)) : 0;
  cx.fillStyle = "rgba(255,255,255,.15)"; cx.fillRect(R(X + 12), 56, R(W - 24), 4);
  cx.fillStyle = C.cyan; cx.fillRect(R(X + 12), 56, R((W - 24) * k), 4);
  const cw = W - 24 - 64, cr = st.credit / 100;
  text(T.credit, X + 12, 67, 10, "#cfc8ff", "left", false);
  cx.fillStyle = C.ink; cx.fillRect(R(X + 64), 63, R(cw), 8);
  cx.fillStyle = cr > 0.5 ? C.green : cr > 0.25 ? C.yellow : C.red; cx.fillRect(R(X + 65), 64, R((cw - 2) * cr), 6);
  // 콤보 + 판정
  const cy = H * 0.42;
  if (st.combo >= 3) {
    const pop = 1 + st.judgeT * 0.15;
    text(String(st.combo), X + W / 2, cy - 30, R(42 * pop), fever() ? C.gold : "#ffffff", "center", true);
    text(T.combo, X + W / 2, cy + 4, 14, fever() ? C.gold : C.cyan, "center", true);
  }
  if (st.judge && st.judgeT > 0) {
    cx.globalAlpha = Math.min(1, st.judgeT * 2);
    text(st.judge.text, X + W / 2, cy + 40, R(26 + st.judgeT * 6), st.judge.col, "center", true);
    cx.globalAlpha = 1;
  }
  if (st.banner && st.bannerT > 0) {
    const sc = 1 + Math.max(0, st.bannerT - 1.1) * 2;
    signText(st.banner.text, X + W / 2, H * 0.28, R(46 * sc), W - 30);
  }
}

let lbShown = null;
function draw() {
  st.hits = [];
  const lbOn = st.mode !== "play";
  if (window.WSA_LB && window.WSA_LB.showButton && lbOn !== lbShown) { lbShown = lbOn; window.WSA_LB.showButton(lbOn); }
  const { W, X, H } = col();
  cx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
  cx.imageSmoothingEnabled = false;
  drawBg(X, W, H);
  if (st.mode === "title") drawTitle(X, W, H);
  else if (st.mode === "shop") drawShop(X, W, H);
  else {
    drawField(X, W, H); drawDrops(); drawFx(); drawHud(X, W, H);
    if (st.mode === "result") drawResult(X, W, H);
  }
  if (st.mode !== "play" && st.banner && st.bannerT > 0)          // 제목·머리글과 안 겹치는 자리에
    signText(st.banner.text, X + W / 2, st.mode === "shop" ? H - 86 : st.mode === "title" ? H * 0.23 - 4 : H * 0.12, 26, W - 30);
  if (st.flash > 0) { cx.fillStyle = `rgba(255,240,200,${st.flash * 0.35})`; cx.fillRect(0, 0, view.w, H); }
}

// 시작 화면: 돈이 비처럼 내리는 장식
const RAIN = Array.from({ length: 22 }, () => ({ x: Math.random(), y: Math.random(), v: 0.08 + Math.random() * 0.12, k: ["coin", "bill", "coin", "bundle"][Math.floor(Math.random() * 4)], r: Math.random() * 6 }));
function drawTitle(X, W, H) {
  for (const d of RAIN) {
    const y = ((d.y + st.t * d.v) % 1.1) * H - 30, sz = 28;
    cx.save(); cx.globalAlpha = 0.85; cx.translate(R(X + d.x * W), R(y)); cx.rotate(Math.sin(st.t * 2 + d.r) * 0.3);
    fitImg(ITEM_IMG[d.k], -sz / 2, -sz / 2, sz, sz); cx.restore();
  }
  signText(T.title, X + W / 2, H * 0.13, Math.min(W / 3.4, 96), W - 30);
  const pw = Math.min(W - 32, 320), px = X + (W - pw) / 2, py = H * 0.23;
  cx.fillStyle = "rgba(14,10,34,.88)"; stepRect(cx, R(px), R(py), R(pw), 150, 4);
  text(T.stage(st.stage), X + W / 2, py + 24, 22, C.cyan, "center", true);
  text(`${T.worth} ${won(netWorth())}`, X + W / 2, py + 56, 18, C.yellow, "center", true, pw - 20);
  text(`${T.rankLabel}: ${rankName()} · ${T.wallet} ${won(st.wallet)}`, X + W / 2, py + 82, 14, "#ffffff", "center", true, pw - 20);
  text(`${T.bonus} +${Math.round(assetBonus() * 100)}% · ${T.hoodLabel}: ${T === TEXT.ko ? hood().ko : hood().en}`, X + W / 2, py + 104, 13, C.green, "center", true, pw - 20);
  const own = st.owned ? ASSET_IMG[st.owned - 1] : null;      // 지금 가진 제일 좋은 자산
  if (own) fitImg(own, X + W / 2 - 18, py + 116, 36, 30);
  const bw = Math.min(W * 0.7, 280), bh = 62, bx = X + (W - bw) / 2, by = Math.max(py + 150 + Math.min(H * 0.14, 110) + 16, H * 0.62);
  { const im = HERO[lookOf(st.owned)][Math.floor(st.t * 1.5) % 4 === 3 ? "b" : "a"], hh = Math.min(H * 0.14, 110);   // 지금 옷차림
    if (imgOk(im)) { const k = hh / 110; cx.drawImage(im, R(X + W / 2 - im.naturalWidth * k / 2), R(by - 8 - im.naturalHeight * k), R(im.naturalWidth * k), R(im.naturalHeight * k)); } }
  button(bx, by, bw, bh, T.start, C.pink, "#8a1a55", () => startRound());
  const next = ASSETS[st.owned];
  button(bx + bw * 0.1, by + bh + 18, bw * 0.8, 48, next && st.wallet >= next.price ? `${T.shop} ★` : T.shop, "#3ca0ff", "#1a4a8a", () => { st.mode = "shop"; });
  text(T.how, X + W / 2, Math.min(H - 20, by + bh + 96), 12, "#ffffff", "center", true, W - 24);
}

function panel(X, W, H, ph) {
  cx.fillStyle = "rgba(8,5,20,.72)"; cx.fillRect(0, 0, view.w, H);
  const pw = Math.min(W - 24, 360), px = X + (W - pw) / 2, py = Math.max(12, (H - ph) / 2);
  cx.fillStyle = C.ink; stepRect(cx, R(px - 4), R(py - 4), R(pw + 8), R(ph + 8), 4);
  cx.fillStyle = C.yellow; stepRect(cx, R(px - 2), R(py - 2), R(pw + 4), R(ph + 4), 4);
  cx.fillStyle = "#1a1040"; stepRect(cx, R(px), R(py), R(pw), R(ph), 4);
  return { px, py, pw };
}

function drawResult(X, W, H) {
  const r = st.result, { px, py, pw } = panel(X, W, H, 360);
  text(r.clear ? T.clear : T.bust, px + pw / 2, py + 32, 26, r.clear ? C.yellow : C.red, "center", true, pw - 20);
  text(r.rank, px + pw - 40, py + 84, 48, { S: C.gold, A: C.cyan, B: C.green, C: "#cfc8ff" }[r.rank], "center", true);
  text(T.earned, px + 24, py + 70, 14, "#cfc8ff", "left", false);
  text(won(r.earn), px + 24, py + 98, 26, C.yellow, "left", true, pw - 110);
  const extra = [r.bonus ? `${T.clearBonus} +${won(r.bonus)}` : "", r.interest ? `${T.interest} +${won(r.interest)}` : ""].filter(Boolean).join(" · ");
  if (extra) text(extra, px + 24, py + 124, 12, C.green, "left", false, pw - 48);
  const rows = [[T.caught, r.caught, C.green], [T.missed, r.missed, C.yellow], [T.bills, r.bills, C.red]];
  rows.forEach(([k, v, c], i) => { text(k, px + 24, py + 150 + i * 22, 13, c, "left", false); text(String(v), px + pw / 2 - 10, py + 150 + i * 22, 13, "#ffffff", "right", false); });
  text(`${T.maxCombo} ${r.maxCombo}`, px + pw - 24, py + 150, 13, "#ffffff", "right", false);
  text(`${T.acc} ${Math.round(r.acc * 100)}%`, px + pw - 24, py + 170, 13, "#ffffff", "right", false);
  text(`${T.worth} ${won(netWorth())}`, px + pw / 2, py + 240, 15, C.yellow, "center", true, pw - 20);
  const bw = pw - 40, bx = px + 20;
  button(bx, py + 260, bw, 50, r.clear ? `${T.next} (${st.stage})` : T.retry, C.pink, "#8a1a55", () => afterResult());
  const next = ASSETS[st.owned];
  button(bx + bw * 0.15, py + 318, bw * 0.7, 34, next && st.wallet >= next.price ? `${T.shop} ★` : T.shop, "#3ca0ff", "#1a4a8a", () => { st.mode = "shop"; st.shopFrom = "result"; });
}

function drawShop(X, W, H) {
  cx.fillStyle = "rgba(8,5,20,.6)"; cx.fillRect(0, 0, view.w, H);
  text(T.shop, X + W / 2, 30, 24, C.yellow, "center", true);
  text(`${T.wallet}(현금) ${won(st.wallet)} · ${T.worth} ${won(netWorth())}`.replace("(현금)", T === TEXT.ko ? "(현금)" : ""), X + W / 2, 58, 15, "#ffffff", "center", true, W - 20);   // 쓸 수 있는 돈 + 산 자산까지 합친 총자산
  text(`${T.bonus} +${Math.round(assetBonus() * 100)}% · ${T.interestNote(Math.round(INTEREST * 100))}`, X + W / 2, 80, 12, C.green, "center", true, W - 20);
  const cols = 2, gap = 8, top = 98, bottom = H - 70;
  const cw = (W - 24 - gap) / cols, ch = Math.min(96, (bottom - top - gap * 4) / 5);
  ASSETS.forEach((a, i) => {
    const x = X + 12 + (i % cols) * (cw + gap), y = top + Math.floor(i / cols) * (ch + gap);
    const own = i < st.owned, next = i === st.owned, can = next && st.wallet >= a.price;
    cx.fillStyle = C.ink; stepRect(cx, R(x), R(y), R(cw), R(ch), 3);
    cx.fillStyle = own ? "#2a2060" : next ? (can ? "#1f5a3a" : "#2a2440") : "#1a1630"; stepRect(cx, R(x + 2), R(y + 2), R(cw - 4), R(ch - 4), 3);
    const isz = ch - 16;
    cx.save(); if (!own && !next) { cx.globalAlpha = 0.25; cx.filter = "brightness(0)"; }
    fitImg(ASSET_IMG[i], x + 8, y + 8, isz, isz); cx.restore();
    const tx = x + isz + 14, tw = cw - isz - 20;
    text(own || next ? T.assets[i] : T.locked, tx, y + ch * 0.28, 13, "#ffffff", "left", true, tw);
    text(`+${Math.round(a.bonus * 100)}%`, tx, y + ch * 0.52, 12, C.green, "left", false, tw);
    if (own) text(T.owned, tx, y + ch * 0.76, 12, C.cyan, "left", false, tw);
    else if (next) {
      text(won(a.price), tx, y + ch * 0.76, 12, can ? C.yellow : "#cfc8ff", "left", false, tw);
      hit(x, y, cw, ch, () => buyAsset());
    }
  });
  const bw = Math.min(W * 0.6, 240);
  button(X + (W - bw) / 2, H - 58, bw, 44, T.back, "#8a8aa8", "#3a3a58", () => { st.mode = st.shopFrom === "result" ? "result" : "title"; st.shopFrom = null; });
}

// ───────────── 입력 ─────────────
// 게임 중: 누르기만 하면 그대로 있고, 누른 채 끌면 끈 만큼만 움직인다 (상대 이동)
let dragging = null, dragX0 = 0, dragTx0 = 0.5;
function aimAt(clientX) {
  st.pl.tx = Math.max(0.05, Math.min(0.95, dragTx0 + (clientX - dragX0) / playW()));
}
cv.addEventListener("pointerdown", e => {
  ensureAudio();
  if (!st.ready) return;
  const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
  if (st.mode === "play") {
    dragging = e.pointerId; dragX0 = e.clientX; dragTx0 = st.pl.x; st.pl.tx = st.pl.x;   // 지금 자리에서 시작
    try { cv.setPointerCapture(e.pointerId); } catch (_) {}
    return;
  }
  for (let i = st.hits.length - 1; i >= 0; i--) {
    const b = st.hits[i];
    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) { b.fn(); return; }
  }
});
cv.addEventListener("pointermove", e => { if (st.mode === "play" && dragging === e.pointerId) aimAt(e.clientX); });
for (const ev of ["pointerup", "pointercancel"]) cv.addEventListener(ev, e => { if (dragging === e.pointerId) dragging = null; });
const keysDown = new Set();
window.addEventListener("keyup", e => keysDown.delete(e.key.toLowerCase()));
window.addEventListener("keydown", e => {
  if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "BUTTON")) return;
  const k = e.key.toLowerCase();
  if (st.mode === "play") { if (["arrowleft", "arrowright", "a", "d"].includes(k)) { keysDown.add(k); e.preventDefault(); } return; }
  if (e.repeat) return;
  if (k === "enter" || k === " ") { e.preventDefault(); if (st.mode === "title") startRound(); else if (st.mode === "result") afterResult(); }
});
function keyMove(dt) {                                              // 키보드: ← → 로 이동
  const l = keysDown.has("arrowleft") || keysDown.has("a"), r = keysDown.has("arrowright") || keysDown.has("d");
  if (st.mode === "play" && (l || r) && l !== r) st.pl.tx = Math.max(0.05, Math.min(0.95, st.pl.x + (r ? 1 : -1) * 0.045));   // 1초에 화면 폭의 약 1.35배
}

// ───────────── 루프 ─────────────
let last = 0, rafId = 0, firstFrame = false;
function frame(now) {
  rafId = 0;
  if (st.paused) return;
  { const d = Math.min(window.devicePixelRatio || 1, 2.5); if (Math.abs(cv.width - Math.round((cv.clientWidth || innerWidth) * d)) > 2) layout(); }
  const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
  keyMove(dt); update(dt); draw();
  if (!firstFrame) { firstFrame = true; sdk.firstFrameReady(); }
  rafId = requestAnimationFrame(frame);
}
function startLoop() { if (!rafId) { last = 0; rafId = requestAnimationFrame(frame); } }

(async function boot() {
  layout(); startLoop();
  const lang = (await sdk.lang() || "").toLowerCase();
  T = lang.startsWith("ko") ? TEXT.ko : TEXT.en;
  document.title = T.title;
  window.WSA_LB_UNIT = "";
  window.WSA_LB_FMT = n => won(n);
  window.WSA_LB_IMG = r => r.char && r.char !== "coin" ? `img/asset_${r.char}.png` : "img/item_coin.png";
  audioEnabled = sdk.audioOn();
  await loadSave();
  st.ready = true;
  sdk.gameReady();
  if (IN_YT) {
    YT.system.onPause(() => { st.paused = true; if (actx) actx.suspend(); save(); });
    YT.system.onResume(() => { st.paused = false; if (actx && audioEnabled) actx.resume(); startLoop(); });
    YT.system.onAudioEnabledChange(on => setAudio(on));
  }
})();
