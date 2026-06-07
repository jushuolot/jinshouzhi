/**
 * 共 100 关：每关有目标分数与步数；达标后进入下一关。
 *
 * 如何打开：
 * 1. 直接用浏览器打开本目录下的 index.html（部分浏览器对 file:// 限制较严，若脚本异常可用方式 2）。
 * 2. 在本目录终端执行：npx --yes serve -l 3456
 *    然后访问终端里提示的本地地址（例如 http://localhost:3456）。
 */

(function () {
  "use strict";

  const ROWS = 8;
  const COLS = 8;
  const NUM_TYPES = 6;
  /** 与 CSS .cell[data-type] 中文物顺序一致 */
  let RELIC_NAMES = ["纵目面具", "金杖", "玉璋", "陶盉", "象牙饰", "神鸟"];
  /** 共 100 关，关卡索引 0～99 */
  const MAX_LEVEL = 100;
  /** 每步最多可得分（包含连锁），超出的连消只计到上限 */
  const MAX_POINTS_PER_MOVE = 10;
  /** 系统自动设计每关步数：按关卡设定目标过关率 */
  const PASS_RATE_LEVEL_1 = 0.88;
  /** 关卡越高通过率略降，仍保持可玩（接近市面消消乐曲线） */
  const PASS_RATE_LEVEL_MAX = 0.28;
  const MATCH_ANIM_MS = 280;
  const CASCADE_PAUSE_MS = 100;
  const STARS_STORAGE_KEY = "match3_level_stars";
  /** 特殊糖：0 普通 1 横纹 2 竖纹 3 炸弹 */
  const SPECIAL_NONE = 0;
  const SPECIAL_ROW = 1;
  const SPECIAL_COL = 2;
  const SPECIAL_BOMB = 3;
  const UNLOCK_KEY = "match3_max_unlocked";
  const WORLDS_DEFAULT = [
    { name: "青铜门启", icon: "🚪", theme: "world-1", iceFrom: 999, subtitle: "祭祀坑外围" },
    { name: "纵目之神", icon: "👁", theme: "world-2", iceFrom: 20, subtitle: "青铜面具层" },
    { name: "神树通天", icon: "🌳", theme: "world-3", iceFrom: 40, subtitle: "青铜神树" },
    { name: "金沙秘径", icon: "☀", theme: "world-4", iceFrom: 60, subtitle: "太阳神鸟" },
    { name: "天书终章", icon: "📜", theme: "world-5", iceFrom: 80, subtitle: "未解符号" },
  ];
  let WORLDS = WORLDS_DEFAULT.slice();
  const STORY_SEEN_KEY = "match3_story_seen";
  const BOOSTER_HAMMER_START = 3;
  const BOOSTER_SHUFFLE_START = 2;
  const EVOLUTION_STATE_KEY = "match3_evolution_state";
  const CODEX_STATE_KEY = "match3_codex_state";
  const EXPEDITION_STATE_KEY = "match3_expedition_state";
  const COMBO_LORE = ["", "层位共鸣", "通脉 · 2连", "祭仪 · 3连", "神树 · 4连", "天书 · 5连", "纵目开眼"];

  const DEFAULT_AD_CONFIG = {
    enabled: true,
    minWatchSec: 5,
    currencySymbol: "¥",
    settlementWebhook: "",
    useBuiltinLanding: true,
    advertiser: {
      name: "内置赞助位",
      landingUrl: "",
      cpm: 20,
      cpc: 1.5,
    },
    slots: {
      level_start: { label: "关头广告" },
      level_end: { label: "关尾广告" },
    },
    admin: {
      passphrase: "Mz168",
      unlockTaps: 5,
    },
  };

  function getBuiltinSponsorCatalog() {
    if (typeof window !== "undefined" && window.MATCH3_SPONSORS) {
      return window.MATCH3_SPONSORS;
    }
    return {
      level_start: {
        sponsor: "萌植能量饮",
        headline: "玩前一杯，连线更顺",
        teaser: "维生素气泡饮 · 0 糖 · 便携小瓶装",
        icon: "🧃",
        cpm: 20,
        cpc: 1.2,
      },
      level_end: {
        sponsor: "绿野轻骑",
        headline: "过关庆祝，骑行更酷",
        teaser: "头盔 / 风镜 / 手套 · 通关用户专享",
        icon: "🚴",
        cpm: 22,
        cpc: 1.5,
      },
    };
  }

  function gameBasePath() {
    if (typeof window === "undefined") return "/";
    const path = window.location.pathname || "/";
    if (path.endsWith("/")) return path;
    const slash = path.lastIndexOf("/");
    return slash >= 0 ? path.slice(0, slash + 1) : "/";
  }

  function builtinLandingUrl(slotKey) {
    if (typeof window === "undefined") return "";
    return (
      window.location.origin +
      gameBasePath() +
      "landing/index.html?slot=" +
      encodeURIComponent(slotKey) +
      "&utm_source=match3&utm_medium=interstitial"
    );
  }

  function isUnsetLandingUrl(url) {
    if (!url) return true;
    return /example\.com/i.test(url);
  }

  function buildAdConfig() {
    const ext =
      typeof window !== "undefined" && window.MATCH3_AD_CONFIG
        ? window.MATCH3_AD_CONFIG
        : {};
    const base = Object.assign({}, DEFAULT_AD_CONFIG, ext);
    const adv = Object.assign({}, DEFAULT_AD_CONFIG.advertiser, ext.advertiser || {});
    const catalog = getBuiltinSponsorCatalog();
    const useBuiltin = base.useBuiltinLanding !== false;
    const slots = {};
    ["level_start", "level_end"].forEach(function (key) {
      const slotExt = (ext.slots && ext.slots[key]) || {};
      const slotDefault = DEFAULT_AD_CONFIG.slots[key] || {};
      const builtin = catalog[key] || catalog.level_start;
      let landingUrl = slotExt.landingUrl || adv.landingUrl;
      if (useBuiltin && isUnsetLandingUrl(landingUrl)) {
        landingUrl = builtinLandingUrl(key);
      }
      slots[key] = {
        label: slotExt.label || slotDefault.label || key,
        sponsor: slotExt.sponsor || slotExt.name || builtin.sponsor || adv.name,
        headline: slotExt.headline || builtin.headline || "",
        teaser: slotExt.teaser || builtin.teaser || "",
        icon: slotExt.icon || builtin.icon || "📣",
        landingUrl: landingUrl,
        cpm: slotExt.cpm != null ? slotExt.cpm : builtin.cpm != null ? builtin.cpm : adv.cpm,
        cpc: slotExt.cpc != null ? slotExt.cpc : builtin.cpc != null ? builtin.cpc : adv.cpc,
      };
    });
    base.advertiser = adv;
    base.slots = slots;
    base.admin = Object.assign({}, DEFAULT_AD_CONFIG.admin, ext.admin || {});
    if (
      !base.settlementWebhook &&
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ) {
      base.settlementWebhook = "http://localhost:3920/settle";
    }
    return base;
  }

  const AD_CONFIG = buildAdConfig();

  const AD_STATS_KEY = "match3_ad_revenue_stats";
  const ADMIN_SESSION_KEY = "match3_admin_unlocked";
  let revenueSession = 0;
  let revenueTotal = 0;
  let revenueWithdrawn = 0;
  /** @type {{ amount: number, ts: number, balanceAfter: number }[]} */
  let withdrawalHistory = [];
  /** @type {number | null} */
  let adCountdownTimer = null;
  /** @type {(() => void) | null} */
  let adOnComplete = null;
  /** @type {keyof AD_CONFIG.slots | null} */
  let adCurrentSlot = null;
  let adFinishing = false;

  /** @type {number[][]} */
  let board = [];
  /** @type {number[][]} */
  let specialGrid = [];
  let levelMovesTotal = 0;
  let cascadeStep = 0;
  /** @type {number[][]} */
  let iceGrid = [];
  let maxUnlockedLevel = 0;
  let hammerLeft = BOOSTER_HAMMER_START;
  let shuffleLeft = BOOSTER_SHUFFLE_START;
  let hammerMode = false;
  let hintTimer = null;
  /** @type {Record<number, number>} */
  let levelStarsMap = {};
  /** @type {{ difficultyOffset: number, recent: string[], failByLevel: Record<string, number>, streakDays: number, lastPlayDate: string, seenVersion: string }} */
  let evolutionState = {
    difficultyOffset: 0,
    recent: [],
    failByLevel: {},
    streakDays: 0,
    lastPlayDate: "",
    seenVersion: "",
  };
  let dailyChallengeBonus = { moves: 0, hammer: 0, label: "" };
  /** @type {{ prologues: Record<string, boolean>, epilogues: Record<string, boolean>, beats: Record<string, boolean> }} */
  let storySeen = { prologues: {}, epilogues: {}, beats: {} };
  /** @type {{ counts: number[], unlocked: boolean[] }} */
  let codexState = { counts: [0, 0, 0, 0, 0, 0], unlocked: [false, false, false, false, false, false] };
  let mapActiveChapter = 0;
  let mapPhase = "world";
  let vnLines = [];
  let vnLineIndex = 0;
  let vnTypingTimer = null;
  let vnOnComplete = null;
  let vnMode = "";
  /** @type {{ beatenLevels: Record<string, boolean> }} */
  let expeditionState = { beatenLevels: {} };
  let briefingCinema = null;
  let assemblyCinema = null;
  let pendingDiscoveryLevel = null;
  let score = 0;
  let movesLeft = 0;
  /** 当前关卡目标分数（本关内累计当前分数达到即过关） */
  let levelTarget = 0;
  /** 0-based，0 = 第 1 关 */
  let currentLevelIndex = 0;
  let gameOver = false;
  /** @type {{ r: number, c: number } | null} */
  let selected = null;
  let processing = false;
  /** @type {{ r: number, c: number } | null} */
  let pendingPointerDown = null;
  /** 滑动连线消除：当前路径（按住并滑过同类文物） */
  /** @type {{ r: number, c: number }[]} */
  let swipePath = [];
  /** @type {number | null} */
  let swipeType = null;
  let swiping = false;
  let swipePointerId = null;
  let swipeStartX = 0;
  let swipeStartY = 0;
  let didDirectionalSwap = false;
  let movePointsLeft = MAX_POINTS_PER_MOVE;

  /** @type {HTMLElement | null} */
  const boardEl = document.getElementById("board");
  const gameTitleEl = document.getElementById("game-title");
  const levelEl = document.getElementById("level");
  const levelNumEl = document.getElementById("level-num");
  const targetScoreEl = document.getElementById("target-score");
  const scoreEl = document.getElementById("score");
  const movesEl = document.getElementById("moves");
  const scoreProgressEl = document.getElementById("score-progress");
  const progressTextEl = document.getElementById("progress-text");
  const liveStarsEl = document.getElementById("live-stars");
  const comboBannerEl = document.getElementById("combo-banner");
  const fxLayerEl = document.getElementById("fx-layer");
  const goalsModalEl = document.getElementById("goals-modal");
  const goalsLevelNumEl = document.getElementById("goals-level-num");
  const goalsTargetEl = document.getElementById("goals-target");
  const goalsMovesEl = document.getElementById("goals-moves");
  const goalsStartBtn = document.getElementById("goals-start");
  const modalStarsEl = document.getElementById("modal-stars");
  const modalMapBtn = document.getElementById("modal-map");
  const screenHomeEl = document.getElementById("screen-home");
  const screenMapEl = document.getElementById("screen-map");
  const screenPlayEl = document.getElementById("screen-play");
  const homeContinueBtn = document.getElementById("home-continue");
  const homeMapBtn = document.getElementById("home-map");
  const homeTotalStarsEl = document.getElementById("home-total-stars");
  const homeMaxLevelEl = document.getElementById("home-max-level");
  const mapBackHomeBtn = document.getElementById("map-back-home");
  const mapStarTotalEl = document.getElementById("map-star-total");
  const mapHeadTitleEl = document.getElementById("map-head-title");
  const mapPhaseStepsEl = document.getElementById("map-phase-steps");
  const mapPhaseWorldEl = document.getElementById("map-phase-world");
  const mapPhaseBriefingEl = document.getElementById("map-phase-briefing");
  const mapPhaseAssemblyEl = document.getElementById("map-phase-assembly");
  const mapPhaseRouteEl = document.getElementById("map-phase-route");
  const worldMapIntroEl = document.getElementById("world-map-intro");
  const world3dMountEl = document.getElementById("world-3d-mount");
  const expedition3dMountEl = document.getElementById("expedition-3d-mount");
  const routeNodeListEl = document.getElementById("route-node-list");
  const tombTierBannerEl = document.getElementById("tomb-tier-banner");
  const vnBriefingCinemaEl = document.getElementById("vn-briefing-cinema");
  const vnAssemblyCinemaEl = document.getElementById("vn-assembly-cinema");
  const discoveryModalEl = document.getElementById("discovery-modal");
  const discoveryTitleEl = document.getElementById("discovery-title");
  const discoveryTextEl = document.getElementById("discovery-text");
  const discoveryTagEl = document.getElementById("discovery-tag");
  const discoveryCinemaEl = document.getElementById("discovery-cinema");
  const discoveryGoBtn = document.getElementById("discovery-go");
  const discoveryCancelBtn = document.getElementById("discovery-cancel");
  const artifact3dMountEl = document.getElementById("artifact-3d-mount");
  const vnBriefingCharsEl = document.getElementById("vn-briefing-chars");
  const vnAssemblyCharsEl = document.getElementById("vn-assembly-chars");
  const vnBriefingTitleEl = document.getElementById("vn-briefing-title");
  const vnBriefingSpeakerEl = document.getElementById("vn-briefing-speaker");
  const vnBriefingTextEl = document.getElementById("vn-briefing-text");
  const vnBriefingNextBtn = document.getElementById("vn-briefing-next");
  const vnBriefingSkipBtn = document.getElementById("vn-briefing-skip");
  const vnAssemblyTitleEl = document.getElementById("vn-assembly-title");
  const vnAssemblySpeakerEl = document.getElementById("vn-assembly-speaker");
  const vnAssemblyTextEl = document.getElementById("vn-assembly-text");
  const vnAssemblyNextBtn = document.getElementById("vn-assembly-next");
  const vnAssemblySkipBtn = document.getElementById("vn-assembly-skip");
  const routeChapterTitleEl = document.getElementById("route-chapter-title");
  const routeChapterBlurbEl = document.getElementById("route-chapter-blurb");
  const routePathEl = document.getElementById("route-path");
  const mapBackWorldBtn = document.getElementById("map-back-world");
  const mapReplayStoryBtn = document.getElementById("map-replay-story");
  const playBackMapBtn = document.getElementById("play-back-map");
  const worldBannerEl = document.getElementById("world-banner");
  const worldIconEl = document.getElementById("world-icon");
  const worldNameEl = document.getElementById("world-name");
  const goalsWorldEl = document.getElementById("goals-world");
  const goalsStoryEl = document.getElementById("goals-story");
  const goalsBossBadgeEl = document.getElementById("goals-boss-badge");
  const goalsIceLineEl = document.getElementById("goals-ice-line");
  const homeChapterLabelEl = document.getElementById("home-chapter-label");
  const homeChapterFillEl = document.getElementById("home-chapter-fill");
  const homeCodexHintEl = document.getElementById("home-codex-hint");
  const homeCodexBtn = document.getElementById("home-codex");
  const codexModalEl = document.getElementById("codex-modal");
  const codexGridEl = document.getElementById("codex-grid");
  const storyModalEl = document.getElementById("story-modal");
  const storyTitleEl = document.getElementById("story-title");
  const storyScrollEl = document.getElementById("story-scroll");
  const storyContinueBtn = document.getElementById("story-continue");
  const boosterHammerBtn = document.getElementById("booster-hammer");
  const boosterShuffleBtn = document.getElementById("booster-shuffle");
  const boosterHintBtn = document.getElementById("booster-hint");
  const hammerCountEl = document.getElementById("hammer-count");
  const shuffleCountEl = document.getElementById("shuffle-count");
  const confettiLayerEl = document.getElementById("confetti-layer");
  const megaComboEl = document.getElementById("mega-combo");
  const evolutionBadgeEl = document.getElementById("evolution-badge");
  const dailyChallengeEl = document.getElementById("daily-challenge");
  const homeStreakEl = document.getElementById("home-streak");
  const messageEl = document.getElementById("message");
  const restartBtn = document.getElementById("restart");
  const nextLevelBtn = document.getElementById("next-level");
  const retryLevelBtn = document.getElementById("retry-level");
  const modalEl = document.getElementById("level-modal");
  const modalLevelEl = document.getElementById("modal-level");
  const modalTargetEl = document.getElementById("modal-target");
  const modalScoreEl = document.getElementById("modal-score");
  const modalLeftEl = document.getElementById("modal-left");
  const modalEggIconEl = document.getElementById("modal-egg-icon");
  const modalEggTextEl = document.getElementById("modal-egg-text");
  const modalPrevBtn = document.getElementById("modal-prev");
  const modalRetryBtn = document.getElementById("modal-retry");
  const modalNextBtn = document.getElementById("modal-next");
  const modalRestartBtn = document.getElementById("modal-restart");
  const musicToggleBtn = document.getElementById("music-toggle");
  const rulesOpenBtn = document.getElementById("rules-open");
  const rulesModalEl = document.getElementById("rules-modal");
  const rulesContentEl = document.getElementById("rules-content");
  const adModalEl = document.getElementById("ad-modal");
  const adTitleEl = document.getElementById("ad-title");
  const adCountdownEl = document.getElementById("ad-countdown");
  const adSlotLabelEl = document.getElementById("ad-slot-label");
  const adSponsorEl = document.getElementById("ad-sponsor");
  const adPreviewIconEl = document.getElementById("ad-preview-icon");
  const adPreviewHeadlineEl = document.getElementById("ad-preview-headline");
  const adPreviewTeaserEl = document.getElementById("ad-preview-teaser");
  const adLinkPreviewEl = document.getElementById("ad-link-preview");
  const adVisitBtn = document.getElementById("ad-visit");
  const adContinueBtn = document.getElementById("ad-continue");
  const adminGateModalEl = document.getElementById("admin-gate-modal");
  const adminPanelModalEl = document.getElementById("admin-panel-modal");
  const adminPassInputEl = document.getElementById("admin-pass-input");
  const adminGateErrorEl = document.getElementById("admin-gate-error");
  const adminGateSubmitBtn = document.getElementById("admin-gate-submit");
  const adminSessionEl = document.getElementById("admin-session");
  const adminTotalEl = document.getElementById("admin-total");
  const adminWithdrawnEl = document.getElementById("admin-withdrawn");
  const adminBalanceEl = document.getElementById("admin-balance");
  const adminWithdrawInputEl = document.getElementById("admin-withdraw-input");
  const adminWithdrawMsgEl = document.getElementById("admin-withdraw-msg");
  const adminWithdrawListEl = document.getElementById("admin-withdraw-list");
  const adminWithdrawAllBtn = document.getElementById("admin-withdraw-all");
  const adminWithdrawSubmitBtn = document.getElementById("admin-withdraw-submit");

  let adminTapCount = 0;
  /** @type {number | null} */
  let adminTapTimer = null;

  /** @type {AudioContext | null} */
  let audioCtx = null;
  let musicEnabled = false;
  let musicTrackIdx = 0;
  let musicTimer = 0;
  let musicNextAt = 0;

  function resumeAudio() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    if (!audioCtx) audioCtx = new Ctx();
    if (audioCtx.state === "suspended") {
      void audioCtx.resume();
    }
  }

  function beep(freq, durSec, vol, type) {
    if (!audioCtx) return;
    const t0 = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.connect(g);
    g.connect(audioCtx.destination);
    osc.type = type || "sine";
    osc.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(Math.min(vol, 0.35) * 0.5, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0008, t0 + durSec);
    osc.start(t0);
    osc.stop(t0 + durSec + 0.04);
  }

  function noteFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  function playToneAt(t0, freq, durSec, vol, type) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = type || "sine";
    osc.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(Math.min(vol, 0.25), t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0007, t0 + durSec);
    osc.connect(g);
    g.connect(audioCtx.destination);
    osc.start(t0);
    osc.stop(t0 + durSec + 0.05);
  }

  const MUSIC_TRACKS = [
    {
      name: "林间小调",
      bpm: 104,
      root: 60, // C
      scale: [0, 2, 4, 7, 9], // pentatonic major
      leadType: "sine",
      bassType: "triangle",
      patternLen: 16,
    },
    {
      name: "蘑菇舞步",
      bpm: 122,
      root: 57, // A
      scale: [0, 3, 5, 7, 10], // pentatonic minor
      leadType: "triangle",
      bassType: "sine",
      patternLen: 16,
    },
    {
      name: "仙人掌夜曲",
      bpm: 96,
      root: 62, // D
      scale: [0, 2, 3, 5, 7, 10], // dorian-ish
      leadType: "sine",
      bassType: "triangle",
      patternLen: 12,
    },
  ];

  function stopMusic() {
    if (musicTimer) {
      window.clearInterval(musicTimer);
      musicTimer = 0;
    }
    musicNextAt = 0;
  }

  function updateMusicButtons() {
    if (musicToggleBtn) {
      musicToggleBtn.setAttribute("aria-pressed", musicEnabled ? "true" : "false");
      musicToggleBtn.textContent = musicEnabled ? "音乐：开" : "音乐：关";
    }
  }

  function scheduleMusicChunk() {
    if (!audioCtx) return;
    const track = MUSIC_TRACKS[musicTrackIdx % MUSIC_TRACKS.length];
    const beat = 60 / track.bpm;
    const step = beat / 2; // 1/8
    const now = audioCtx.currentTime;
    const startAt = Math.max(now + 0.05, musicNextAt || now + 0.05);
    const steps = track.patternLen;

    for (let i = 0; i < steps; i++) {
      const t = startAt + i * step;
      const pos = i % steps;

      // bass: every 4 steps
      if (pos % 4 === 0) {
        const bassMidi = track.root - 24 + (pos % 8 === 0 ? 0 : 7);
        playToneAt(t, noteFreq(bassMidi), step * 1.45, 0.12, track.bassType);
      }

      // lead: pseudo-random but repeatable per chunk
      const pick = (pos * 7 + track.root + Math.floor(startAt * 10)) % track.scale.length;
      const interval = track.scale[pick];
      const octave = pos % 8 < 4 ? 12 : 0;
      const leadMidi = track.root + interval + octave;
      const dur = pos % 3 === 0 ? step * 0.9 : step * 0.6;
      playToneAt(t, noteFreq(leadMidi), dur, 0.065, track.leadType);

      // sparkle on bar start
      if (pos === 0) {
        playToneAt(t, noteFreq(track.root + 24), step * 0.35, 0.04, "sine");
      }
    }

    musicNextAt = startAt + steps * step;
  }

  function startMusic() {
    resumeAudio();
    if (!audioCtx) return;
    stopMusic();
    musicNextAt = audioCtx.currentTime + 0.08;
    scheduleMusicChunk();
    musicTimer = window.setInterval(function () {
      if (!musicEnabled) return;
      if (!audioCtx) return;
      if (musicNextAt - audioCtx.currentTime < 1.2) scheduleMusicChunk();
    }, 250);
  }

  function setMusicEnabled(on) {
    musicEnabled = !!on;
    updateMusicButtons();
    if (musicEnabled) startMusic();
    else stopMusic();
  }

  function randomizeMusic() {
    const next = randomInt(MUSIC_TRACKS.length);
    musicTrackIdx = next;
    if (musicEnabled) startMusic();
  }

  function formatMoney(n) {
    return AD_CONFIG.currencySymbol + n.toFixed(3);
  }

  function getRevenueBalance() {
    return Math.max(0, Math.round((revenueTotal - revenueWithdrawn) * 1000) / 1000);
  }

  function loadAdStats() {
    try {
      const raw = window.localStorage.getItem(AD_STATS_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data && typeof data.total === "number") revenueTotal = data.total;
      if (data && typeof data.withdrawn === "number") revenueWithdrawn = data.withdrawn;
      if (data && Array.isArray(data.withdrawals)) withdrawalHistory = data.withdrawals;
    } catch (e) {
      revenueTotal = 0;
      revenueWithdrawn = 0;
      withdrawalHistory = [];
    }
  }

  function saveAdStats() {
    try {
      window.localStorage.setItem(
        AD_STATS_KEY,
        JSON.stringify({
          total: revenueTotal,
          withdrawn: revenueWithdrawn,
          withdrawals: withdrawalHistory,
          updatedAt: Date.now(),
        })
      );
    } catch (e) {
      // ignore
    }
  }

  function updateAdminPanel() {
    const balance = getRevenueBalance();
    if (adminSessionEl) adminSessionEl.textContent = formatMoney(revenueSession);
    if (adminTotalEl) adminTotalEl.textContent = formatMoney(revenueTotal);
    if (adminWithdrawnEl) adminWithdrawnEl.textContent = formatMoney(revenueWithdrawn);
    if (adminBalanceEl) adminBalanceEl.textContent = formatMoney(balance);
    if (adminWithdrawInputEl && document.activeElement !== adminWithdrawInputEl) {
      adminWithdrawInputEl.placeholder = balance.toFixed(3);
    }
    if (!adminWithdrawListEl) return;
    adminWithdrawListEl.innerHTML = "";
    if (!withdrawalHistory.length) {
      const empty = document.createElement("li");
      empty.className = "admin-withdraw-empty";
      empty.textContent = "暂无提取记录";
      adminWithdrawListEl.appendChild(empty);
      return;
    }
    withdrawalHistory
      .slice()
      .reverse()
      .forEach(function (item) {
        const li = document.createElement("li");
        const when = new Date(item.ts);
        li.textContent =
          when.toLocaleString() +
          " · 提取 " +
          formatMoney(item.amount) +
          " · 余额 " +
          formatMoney(item.balanceAfter);
        adminWithdrawListEl.appendChild(li);
      });
  }

  function isAdminUnlocked() {
    try {
      return window.sessionStorage.getItem(ADMIN_SESSION_KEY) === "1";
    } catch (e) {
      return false;
    }
  }

  function setAdminUnlocked(on) {
    try {
      if (on) window.sessionStorage.setItem(ADMIN_SESSION_KEY, "1");
      else window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
    } catch (e) {
      // ignore
    }
  }

  function hideAdminGate() {
    if (adminGateModalEl) adminGateModalEl.hidden = true;
    if (adminPassInputEl) adminPassInputEl.value = "";
    if (adminGateErrorEl) adminGateErrorEl.hidden = true;
  }

  function hideAdminPanel() {
    if (adminPanelModalEl) adminPanelModalEl.hidden = true;
    if (adminWithdrawMsgEl) adminWithdrawMsgEl.textContent = "";
  }

  function openAdminGate() {
    if (isAdminUnlocked()) {
      openAdminPanel();
      return;
    }
    if (adminGateModalEl) adminGateModalEl.hidden = false;
    if (adminPassInputEl) {
      adminPassInputEl.value = "";
      window.setTimeout(function () {
        adminPassInputEl.focus();
      }, 0);
    }
    if (adminGateErrorEl) adminGateErrorEl.hidden = true;
  }

  function openAdminPanel() {
    updateAdminPanel();
    if (adminPanelModalEl) adminPanelModalEl.hidden = false;
  }

  function tryAdminLogin() {
    const input = adminPassInputEl ? adminPassInputEl.value : "";
    const expected = (AD_CONFIG.admin && AD_CONFIG.admin.passphrase) || "萌植888";
    if (input !== expected) {
      if (adminGateErrorEl) adminGateErrorEl.hidden = false;
      return;
    }
    setAdminUnlocked(true);
    hideAdminGate();
    openAdminPanel();
  }

  function withdrawRevenue(amount) {
    const balance = getRevenueBalance();
    const value = Math.round(amount * 1000) / 1000;
    if (adminWithdrawMsgEl) adminWithdrawMsgEl.textContent = "";
    if (!value || value <= 0) {
      if (adminWithdrawMsgEl) adminWithdrawMsgEl.textContent = "请输入大于 0 的金额";
      return;
    }
    if (value > balance + 0.0001) {
      if (adminWithdrawMsgEl) adminWithdrawMsgEl.textContent = "超过可提取余额";
      return;
    }
    revenueWithdrawn = Math.round((revenueWithdrawn + value) * 1000) / 1000;
    const balanceAfter = getRevenueBalance();
    withdrawalHistory.push({ amount: value, ts: Date.now(), balanceAfter: balanceAfter });
    saveAdStats();
    updateAdminPanel();
    postSettlementEvent({
      type: "withdraw",
      amount: value,
      balanceAfter: balanceAfter,
      currency: "CNY",
      ts: Date.now(),
    });
    if (adminWithdrawInputEl) adminWithdrawInputEl.value = "";
    if (adminWithdrawMsgEl)
      adminWithdrawMsgEl.textContent = "已提取 " + formatMoney(value) + "（演示记账，真实打款需对接后端）";
  }

  function onAdminTitleTap() {
    const needed = (AD_CONFIG.admin && AD_CONFIG.admin.unlockTaps) || 5;
    adminTapCount += 1;
    if (adminTapTimer) window.clearTimeout(adminTapTimer);
    adminTapTimer = window.setTimeout(function () {
      adminTapCount = 0;
      adminTapTimer = null;
    }, 2000);
    if (adminTapCount >= needed) {
      adminTapCount = 0;
      if (adminTapTimer) window.clearTimeout(adminTapTimer);
      adminTapTimer = null;
      openAdminGate();
    }
  }

  function postSettlementEvent(payload) {
    const url = AD_CONFIG.settlementWebhook;
    if (!url) return;
    try {
      void fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      });
    } catch (e) {
      // ignore
    }
  }

  function settleAdEvent(slotKey, type, amount) {
    revenueSession += amount;
    revenueTotal += amount;
    if (adminPanelModalEl && !adminPanelModalEl.hidden) updateAdminPanel();
    saveAdStats();
    postSettlementEvent({
      type: type,
      slot: slotKey,
      amount: amount,
      currency: "CNY",
      level: currentLevelIndex + 1,
      ts: Date.now(),
    });
    return amount;
  }

  function clearAdCountdown() {
    if (adCountdownTimer) {
      window.clearInterval(adCountdownTimer);
      adCountdownTimer = null;
    }
  }

  function hideAdModal() {
    clearAdCountdown();
    if (adModalEl) adModalEl.hidden = true;
    adOnComplete = null;
    adCurrentSlot = null;
    adFinishing = false;
  }

  function finishAdAndContinue() {
    if (adFinishing || !adModalEl || adModalEl.hidden) return;
    adFinishing = true;
    const done = adOnComplete;
    adOnComplete = null;
    hideAdModal();
    if (done) done();
  }

  function onAdBackdropClick(ev) {
    if (!adModalEl || adModalEl.hidden || adFinishing) return;
    if (adContinueBtn && adContinueBtn.disabled) return;
    const t = ev.target;
    if (t && t instanceof HTMLElement && t.closest(".modal-panel")) return;
    finishAdAndContinue();
  }

  /**
   * @param {"level_start"|"level_end"} slotKey
   * @param {() => void} onComplete
   */
  function showForcedAd(slotKey, onComplete) {
    if (!AD_CONFIG.enabled || !adModalEl) {
      onComplete();
      return;
    }
    const slot = AD_CONFIG.slots[slotKey];
    if (!slot) {
      onComplete();
      return;
    }

    adOnComplete = onComplete;
    adCurrentSlot = slotKey;
    adFinishing = false;
    clearAdCountdown();

    if (adTitleEl) adTitleEl.textContent = "赞助内容";
    if (adSlotLabelEl) adSlotLabelEl.textContent = slot.label;
    if (adSponsorEl) adSponsorEl.textContent = slot.sponsor;
    if (adPreviewIconEl) adPreviewIconEl.textContent = slot.icon || "📣";
    if (adPreviewHeadlineEl) adPreviewHeadlineEl.textContent = slot.headline || slot.sponsor;
    if (adPreviewTeaserEl) adPreviewTeaserEl.textContent = slot.teaser || "免费游戏由赞助支持";
    if (adLinkPreviewEl) adLinkPreviewEl.textContent = slot.landingUrl;

    settleAdEvent(slotKey, "impression", slot.cpm / 1000);

    if (adContinueBtn) {
      adContinueBtn.disabled = true;
      adContinueBtn.textContent = "继续游戏（" + AD_CONFIG.minWatchSec + "s）";
    }

    adModalEl.hidden = false;

    let left = AD_CONFIG.minWatchSec;
    if (adCountdownEl) adCountdownEl.textContent = String(left);
    clearAdCountdown();
    adCountdownTimer = window.setInterval(function () {
      left -= 1;
      if (adCountdownEl) adCountdownEl.textContent = String(Math.max(0, left));
      if (left <= 0) {
        clearAdCountdown();
        if (adContinueBtn) {
          adContinueBtn.disabled = false;
          adContinueBtn.textContent = "继续游戏";
        }
      }
    }, 1000);
  }

  function onAdVisitClick() {
    if (!adCurrentSlot) return;
    const slot = AD_CONFIG.slots[adCurrentSlot];
    if (!slot) return;
    settleAdEvent(adCurrentSlot, "click", slot.cpc);
    try {
      window.open(slot.landingUrl, "_blank", "noopener,noreferrer");
    } catch (e) {
      window.location.href = slot.landingUrl;
    }
  }

  function buildRulesHtml() {
    const level1Target = 100;
    const inc = 20;
    const pass1 = Math.round(PASS_RATE_LEVEL_1 * 100);
    const moveSpec = getLevelSpec(currentLevelIndex);
    return (
      "<p><strong>过关目标</strong>：第 1 关目标 " +
      level1Target +
      " 分；之后每关 +" +
      inc +
      " 分。</p>" +
      "<p><strong>本关参数</strong>：目标 " +
      moveSpec.target +
      " 分，步数 " +
      moveSpec.moves +
      "。</p>" +
      "<p><strong>操作</strong>：相邻滑动交换，或按住连线 ≥3 同类文物消除。</p>" +
      "<p><strong>特殊圣物</strong>：4 连生成条纹圣物（整行/列），5 连生成爆破符印（3×3）。</p>" +
      "<p><strong>五章秘史</strong>：每 20 关一章三星堆考古剧情，后期出现封土层障碍。</p>" +
      "<p><strong>道具</strong>：⛏清理 · 🔀扰层重排 · 💡提示。</p>" +
      "<p><strong>星级</strong>：达标 1 星；高分或剩余步数多可获 2～3 星，地图可回看。</p>" +
      "<p><strong>难度</strong>：第 1 关约 " +
      pass1 +
      "% 通过率，后续关卡逐步提升挑战。</p>" +
      "<p><strong>赞助</strong>：每关开始/结束展示赞助内容（约 " +
      AD_CONFIG.minWatchSec +
      " 秒）。</p>"
    );
  }

  function soundSelect() {
    resumeAudio();
    beep(660, 0.04, 0.25, "sine");
  }

  function soundSwap() {
    resumeAudio();
    beep(480, 0.055, 0.42, "sine");
  }

  function soundInvalid() {
    resumeAudio();
    beep(130, 0.11, 0.55, "triangle");
  }

  function soundMatch(matchCount) {
    resumeAudio();
    const n = Math.min(Math.max(matchCount, 3), 12);
    const base = 380 + n * 28;
    beep(base, 0.07, 0.48, "sine");
    window.setTimeout(function () {
      beep(base + 200, 0.09, 0.38, "sine");
    }, 55);
    window.setTimeout(function () {
      beep(base + 340, 0.07, 0.28, "triangle");
    }, 115);
  }

  function soundGameOver() {
    resumeAudio();
    beep(300, 0.12, 0.42, "sine");
    window.setTimeout(function () {
      beep(220, 0.14, 0.45, "sine");
    }, 130);
    window.setTimeout(function () {
      beep(165, 0.28, 0.48, "sine");
    }, 280);
  }

  function soundRestart() {
    resumeAudio();
    beep(523, 0.06, 0.35, "sine");
    window.setTimeout(function () {
      beep(784, 0.08, 0.32, "sine");
    }, 70);
  }

  function soundLevelWin() {
    resumeAudio();
    beep(523, 0.07, 0.38, "sine");
    window.setTimeout(function () {
      beep(659, 0.07, 0.36, "sine");
    }, 70);
    window.setTimeout(function () {
      beep(784, 0.09, 0.4, "sine");
    }, 145);
    window.setTimeout(function () {
      beep(1046, 0.12, 0.32, "sine");
    }, 230);
  }

  /**
   * @param {number} idx 0-based 关卡
   * @returns {{ moves: number, target: number }}
   */
  function targetPassRateForLevel(levelIdx) {
    if (levelIdx <= 0) return PASS_RATE_LEVEL_1;
    const t = levelIdx / Math.max(1, MAX_LEVEL - 1);
    return PASS_RATE_LEVEL_1 - t * (PASS_RATE_LEVEL_1 - PASS_RATE_LEVEL_MAX);
  }

  function isBossLevel(levelIdx) {
    return (levelIdx + 1) % 20 === 0;
  }

  function getLevelSpec(idx) {
    const clamped = Math.min(Math.max(idx, 0), MAX_LEVEL - 1);
    let target = 100 + clamped * 20;
    if (isBossLevel(clamped)) target = Math.round(target * 1.12);
    const baseMoves = solveMovesForPassRate(clamped, target, targetPassRateForLevel(clamped));
    const minMoves = clamped < 8 ? 18 : 12;
    const maxMoves = 60;
    const evoBonus = getEvolutionMoveBonus(clamped);
    let moves = Math.min(maxMoves, Math.max(minMoves, baseMoves + evoBonus.total));
    if (isBossLevel(clamped)) moves = Math.max(minMoves, moves - 1);
    return { moves: moves, target: target, evoBonus: evoBonus, isBoss: isBossLevel(clamped) };
  }

  // --- 自动难度：用正态近似反推步数，使过关成功率接近目标值 ---
  // 说明：这里不用真实模拟（成本高），而用“每步平均得分 + 波动”的概率模型，
  // 让系统能对 100 关快速生成一条相对平滑且越来越难的步数曲线。

  function erf(x) {
    // Abramowitz and Stegun 7.1.26 近似
    const sign = x < 0 ? -1 : 1;
    const ax = Math.abs(x);
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;
    const t = 1 / (1 + p * ax);
    const y =
      1 -
      (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t) * Math.exp(-ax * ax);
    return sign * y;
  }

  function normalCdf(z) {
    // 标准正态分布的 CDF
    return 0.5 * (1 + erf(z / Math.SQRT2));
  }

  function estimatePassProbability(levelIdx, target, moves) {
    // 计分为 3连=5、4连=6...，且每步（含连锁）最多 10 分。
    // 这里用一个简化模型估算成功率：每步平均得分随关卡下降、波动随关卡略增。
    const mu = Math.max(2.2, 5.4 - levelIdx * 0.028);
    const sigma = 1.9 + levelIdx * 0.01;

    const mean = moves * mu;
    const std = Math.sqrt(Math.max(moves, 1)) * sigma;
    if (std <= 0.0001) return mean >= target ? 1 : 0;
    const z = (target - mean) / std;
    return 1 - normalCdf(z);
  }

  function solveMovesForPassRate(levelIdx, target, passRate) {
    // 搜索一个整数步数，使得估计过关率接近 passRate
    // 约束：前期最少 18 步保证可玩；后期最少 12 步保证不至于无解
    const minMoves = levelIdx < 8 ? 18 : 12;
    const maxMoves = 48;

    let bestMoves = minMoves;
    let bestDiff = 1e9;

    // 二分不严格单调，但整体随 moves 增大成功率增加，够用
    let lo = minMoves;
    let hi = maxMoves;
    for (let i = 0; i < 14; i++) {
      const mid = Math.floor((lo + hi) / 2);
      const p = estimatePassProbability(levelIdx, target, mid);
      const diff = Math.abs(p - passRate);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestMoves = mid;
      }
      if (p > passRate) hi = mid - 1;
      else lo = mid + 1;
    }

    // 保险：再扫一小段，避免二分落在台阶边缘
    const start = Math.max(minMoves, bestMoves - 2);
    const end = Math.min(maxMoves, bestMoves + 2);
    for (let m = start; m <= end; m++) {
      const p = estimatePassProbability(levelIdx, target, m);
      const diff = Math.abs(p - passRate);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestMoves = m;
      }
    }

    return bestMoves;
  }

  function setLevelActionButtons(showNext, showRetry) {
    if (nextLevelBtn) {
      nextLevelBtn.hidden = !showNext;
      nextLevelBtn.style.display = showNext ? "" : "none";
    }
    if (retryLevelBtn) {
      retryLevelBtn.hidden = !showRetry;
      retryLevelBtn.style.display = showRetry ? "" : "none";
    }
  }

  const WORLD_QUOTES = [
    { q: "认识你自己。", who: "苏格拉底", src: "德尔斐神庙箴言（常归于苏格拉底）" },
    { q: "我思故我在。", who: "勒内·笛卡尔", src: "《第一哲学沉思集》" },
    { q: "凡杀不死我的，必使我更强大。", who: "弗里德里希·尼采", src: "《偶像的黄昏》" },
    { q: "知识就是力量。", who: "弗朗西斯·培根", src: "《神圣的沉思》" },
    { q: "人是目的，而非手段。", who: "伊曼努尔·康德", src: "《道德形而上学基础》" },
    { q: "我们唯一需要恐惧的，就是恐惧本身。", who: "富兰克林·D·罗斯福", src: "1933 年就职演说" },
    { q: "想象力比知识更重要。", who: "阿尔伯特·爱因斯坦", src: "（多处访谈常见引述）" },
    { q: "你必须成为你希望在世界上看到的改变。", who: "圣雄甘地", src: "（常见引述）" },
    { q: "时间会证明一切。", who: "威吉尔（维吉尔）", src: "《埃涅阿斯纪》（意译常见）" },
    { q: "生命不止，折腾不息。", who: "伏尔泰", src: "（常见意译引述）" },
  ];

  function pickQuote() {
    return WORLD_QUOTES[randomInt(WORLD_QUOTES.length)];
  }

  function showModalResult(isWin) {
    showForcedAd("level_end", function () {
      openResultModal(isWin);
    });
  }

  function openResultModal(isWin) {
    if (!modalEl) return;
    const stars = isWin ? calcStars(score, levelTarget, movesLeft, levelMovesTotal) : 0;
    if (isWin && stars > 0) {
      const prev = levelStarsMap[currentLevelIndex] || 0;
      if (stars > prev) levelStarsMap[currentLevelIndex] = stars;
      saveLevelStars();
      markLevelBeaten(currentLevelIndex);
      if (currentLevelIndex >= maxUnlockedLevel && currentLevelIndex < MAX_LEVEL - 1) {
        maxUnlockedLevel = currentLevelIndex + 1;
        saveProgress();
      }
      spawnConfetti();
    }
    renderStarRow(modalStarsEl, stars);

    if (modalLevelEl) modalLevelEl.textContent = currentLevelIndex + 1 + " / " + MAX_LEVEL;
    if (modalTargetEl) modalTargetEl.textContent = String(levelTarget);
    if (modalScoreEl) modalScoreEl.textContent = String(score);
    if (modalLeftEl) modalLeftEl.textContent = String(movesLeft);
    if (modalEggIconEl) modalEggIconEl.textContent = isWin ? (stars >= 3 ? "👑" : "🏆") : "💪";
    if (modalEggTextEl) {
      const storyCfg = getStoryConfig();
      if (!isWin) {
        const fq = pickStoryQuote(storyCfg && storyCfg.failQuotes);
        modalEggTextEl.textContent = fq
          ? fq.who + "：" + fq.text
          : "差一点点！调整策略再试，条纹圣物能帮你爆发得分。";
      } else if (stars >= 3) {
        const wq = pickStoryQuote(storyCfg && storyCfg.winQuotes);
        modalEggTextEl.textContent = wq
          ? wq.who + "：" + wq.text + "（三星完美！）"
          : "完美！三星通关，层位与连锁都很棒。";
      } else if (stars === 2) modalEggTextEl.textContent = "不错！再剩些步数或刷更高分可冲击三星。";
      else modalEggTextEl.textContent = "过关啦！试试更少步数通关拿更高星级。";
    }

    const isLast = currentLevelIndex >= MAX_LEVEL - 1;
    const canPrev = currentLevelIndex > 0;

    if (modalPrevBtn) modalPrevBtn.hidden = isWin ? true : !canPrev;
    if (modalRetryBtn) modalRetryBtn.hidden = isWin;
    if (modalNextBtn) modalNextBtn.hidden = !isWin || isLast;
    if (modalRestartBtn) modalRestartBtn.hidden = isWin ? !isLast : false;

    function revealModal() {
      modalEl.hidden = false;
    }
    if (isWin) runStoryAfterChapterWin(currentLevelIndex, revealModal);
    else revealModal();
  }

  function hideModal() {
    if (!modalEl) return;
    modalEl.hidden = true;
  }

  function key(r, c) {
    return r + "," + c;
  }

  function randomInt(n) {
    return Math.floor(Math.random() * n);
  }

  function cloneGrid(g) {
    return g.map(function (row) {
      return row.slice();
    });
  }

  function swapCells(g, r1, c1, r2, c2) {
    const t = g[r1][c1];
    g[r1][c1] = g[r2][c2];
    g[r2][c2] = t;
  }

  function emptySpecialGrid() {
    const g = [];
    for (let r = 0; r < ROWS; r++) {
      g[r] = [];
      for (let c = 0; c < COLS; c++) g[r][c] = SPECIAL_NONE;
    }
    return g;
  }

  function loadLevelStars() {
    try {
      const raw = window.localStorage.getItem(STARS_STORAGE_KEY);
      levelStarsMap = raw ? JSON.parse(raw) : {};
    } catch (e) {
      levelStarsMap = {};
    }
  }

  function saveLevelStars() {
    try {
      window.localStorage.setItem(STARS_STORAGE_KEY, JSON.stringify(levelStarsMap));
    } catch (e) {
      // ignore
    }
  }

  function getEvolutionConfig() {
    return typeof window !== "undefined" && window.MATCH3_EVOLUTION
      ? window.MATCH3_EVOLUTION
      : { version: "2.2.0", generation: 18, autoTune: { enabled: true, windowSize: 8, maxMoveAdjust: 3, targetWinRate: 0.52 }, patchNotes: [] };
  }

  function loadEvolutionState() {
    try {
      const raw = window.localStorage.getItem(EVOLUTION_STATE_KEY);
      if (raw) evolutionState = Object.assign(evolutionState, JSON.parse(raw));
    } catch (e) {
      evolutionState = { difficultyOffset: 0, recent: [], failByLevel: {}, streakDays: 0, lastPlayDate: "", seenVersion: "" };
    }
  }

  function saveEvolutionState() {
    try {
      window.localStorage.setItem(EVOLUTION_STATE_KEY, JSON.stringify(evolutionState));
    } catch (e) {
      // ignore
    }
  }

  function todayKey() {
    const d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  function updateLoginStreak() {
    const today = todayKey();
    if (evolutionState.lastPlayDate === today) return;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yKey =
      yesterday.getFullYear() +
      "-" +
      String(yesterday.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(yesterday.getDate()).padStart(2, "0");
    if (evolutionState.lastPlayDate === yKey) evolutionState.streakDays += 1;
    else evolutionState.streakDays = 1;
    evolutionState.lastPlayDate = today;
    saveEvolutionState();
  }

  function rollDailyChallenge() {
    const seed = todayKey().split("-").join("");
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    const types = [
      { moves: 2, hammer: 0, label: "今日祝福：每关 +2 步" },
      { moves: 0, hammer: 1, label: "今日祝福：额外 +1 锤子" },
      { moves: 1, hammer: 1, label: "今日祝福：+1 步 & +1 锤" },
      { moves: 3, hammer: 0, label: "今日福利：每关 +3 步" },
    ];
    dailyChallengeBonus = types[h % types.length];
  }

  function autoTuneDifficulty() {
    const cfg = getEvolutionConfig().autoTune || {};
    if (cfg.enabled === false) return;
    const windowSize = cfg.windowSize || 8;
    const maxAdj = cfg.maxMoveAdjust || 3;
    const target = cfg.targetWinRate != null ? cfg.targetWinRate : 0.52;
    const recent = evolutionState.recent.slice(-windowSize);
    if (recent.length < 4) return;
    let wins = 0;
    recent.forEach(function (r) {
      if (r === "w") wins++;
    });
    const rate = wins / recent.length;
    if (rate > target + 0.15 && evolutionState.difficultyOffset > -maxAdj) {
      evolutionState.difficultyOffset -= 1;
    } else if (rate < target - 0.15 && evolutionState.difficultyOffset < maxAdj) {
      evolutionState.difficultyOffset += 1;
    }
    saveEvolutionState();
  }

  function getEvolutionMoveBonus(levelIdx) {
    const lvlKey = String(levelIdx);
    const failCount = evolutionState.failByLevel[lvlKey] || 0;
    const frustration = failCount >= 3 ? 2 : failCount >= 2 ? 1 : 0;
    const streakBonus = Math.min(2, Math.floor(evolutionState.streakDays / 3));
    return {
      global: evolutionState.difficultyOffset,
      daily: dailyChallengeBonus.moves,
      frustration: frustration,
      streak: streakBonus,
      total: evolutionState.difficultyOffset + dailyChallengeBonus.moves + frustration + streakBonus,
    };
  }

  function recordEvolutionResult(win) {
    evolutionState.recent.push(win ? "w" : "l");
    if (evolutionState.recent.length > 20) evolutionState.recent.shift();
    const lvlKey = String(currentLevelIndex);
    if (!win) {
      evolutionState.failByLevel[lvlKey] = (evolutionState.failByLevel[lvlKey] || 0) + 1;
    } else {
      evolutionState.failByLevel[lvlKey] = 0;
    }
    autoTuneDifficulty();
    saveEvolutionState();
  }

  function showEvolutionToast(text) {
    let el = document.getElementById("evo-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "evo-toast";
      el.className = "evo-toast";
      document.body.appendChild(el);
    }
    el.textContent = text;
    el.classList.add("show");
    window.setTimeout(function () {
      el.classList.remove("show");
    }, 4200);
  }

  function initEvolution() {
    loadEvolutionState();
    updateLoginStreak();
    rollDailyChallenge();
    const cfg = getEvolutionConfig();
    if (cfg.version && evolutionState.seenVersion !== cfg.version) {
      const notes = (cfg.patchNotes || []).slice(0, 2).join(" · ");
      showEvolutionToast("🧬 进化 Gen." + (cfg.generation || "?") + "：" + (notes || "体验已自动优化"));
      evolutionState.seenVersion = cfg.version;
      saveEvolutionState();
    }
  }

  function renderEvolutionHome() {
    const cfg = getEvolutionConfig();
    if (evolutionBadgeEl) {
      evolutionBadgeEl.textContent =
        "🧬 自主进化 Gen." +
        (cfg.generation || 1) +
        " · 难度微调 " +
        (evolutionState.difficultyOffset > 0 ? "+" : "") +
        evolutionState.difficultyOffset +
        " 步";
    }
    if (homeStreakEl) homeStreakEl.textContent = String(evolutionState.streakDays);
    if (dailyChallengeEl) {
      dailyChallengeEl.hidden = false;
      dailyChallengeEl.innerHTML = "📅 <strong>每日挑战</strong> · " + dailyChallengeBonus.label;
    }
  }

  function getStoryConfig() {
    return typeof window !== "undefined" && window.MATCH3_STORY ? window.MATCH3_STORY : null;
  }

  function syncStoryTheme() {
    const s = getStoryConfig();
    if (!s) return;
    if (s.relics && s.relics.length >= NUM_TYPES) RELIC_NAMES = s.relics.slice(0, NUM_TYPES);
    if (s.chapters && s.chapters.length) {
      WORLDS = s.chapters.map(function (ch) {
        return {
          name: ch.name,
          icon: ch.icon,
          theme: ch.theme,
          iceFrom: ch.iceFrom,
          subtitle: ch.subtitle || "",
        };
      });
    }
    const taglineEl = document.querySelector(".home-tagline");
    if (taglineEl && s.tagline) taglineEl.textContent = s.tagline;
    const titleEl = document.getElementById("game-title");
    if (titleEl && s.title) titleEl.textContent = s.title;
  }

  function loadStorySeen() {
    try {
      const raw = window.localStorage.getItem(STORY_SEEN_KEY);
      if (raw) storySeen = Object.assign({ prologues: {}, epilogues: {}, beats: {} }, JSON.parse(raw));
    } catch (e) {
      storySeen = { prologues: {}, epilogues: {}, beats: {} };
    }
  }

  function saveStorySeenState() {
    try {
      window.localStorage.setItem(STORY_SEEN_KEY, JSON.stringify(storySeen));
    } catch (e) {
      // ignore
    }
  }

  function getChapterForLevel(levelIdx) {
    return Math.min(WORLDS.length - 1, Math.floor(levelIdx / 20));
  }

  function getChapterData(chIdx) {
    const s = getStoryConfig();
    return s && s.chapters ? s.chapters[chIdx] : null;
  }

  function showStoryScene(scene, onDone) {
    if (!storyModalEl || !scene || !scene.lines || !scene.lines.length) {
      if (onDone) onDone();
      return;
    }
    if (storyTitleEl) storyTitleEl.textContent = scene.title || "古蜀秘档";
    if (storyScrollEl) {
      storyScrollEl.innerHTML = "";
      scene.lines.forEach(function (ln) {
        const row = document.createElement("div");
        row.className = "story-line";
        const bubble = document.createElement("div");
        bubble.className = "story-bubble";
        const speaker = document.createElement("div");
        speaker.className = "story-speaker";
        speaker.style.color = ln.color || "#c9a227";
        speaker.textContent = ln.speaker || "旁白";
        const text = document.createElement("p");
        text.className = "story-text";
        text.textContent = ln.text || "";
        bubble.appendChild(speaker);
        bubble.appendChild(text);
        const avatar = document.createElement("div");
        avatar.className = "story-avatar";
        avatar.textContent = ln.avatar || "📜";
        row.appendChild(avatar);
        row.appendChild(bubble);
        storyScrollEl.appendChild(row);
      });
    }
    storyModalEl.hidden = false;
    if (storyContinueBtn) {
      storyContinueBtn.onclick = function () {
        storyModalEl.hidden = true;
        storyContinueBtn.onclick = null;
        if (onDone) onDone();
      };
    }
  }

  function runStoryBeforeLevel(levelIdx, onDone) {
    const chIdx = getChapterForLevel(levelIdx);
    const ch = getChapterData(chIdx);
    const lvl = levelIdx + 1;
    const chKey = String(chIdx);

    function afterPrologue() {
      if (ch && ch.beats && ch.beats[lvl] && !storySeen.beats[String(lvl)]) {
        storySeen.beats[String(lvl)] = true;
        saveStorySeenState();
        showStoryScene({ title: ch.name + " · 第 " + lvl + " 层", lines: ch.beats[lvl] }, onDone);
        return;
      }
      if (onDone) onDone();
    }

    if (levelIdx % 20 === 0 && ch && ch.prologue && !storySeen.prologues[chKey]) {
      storySeen.prologues[chKey] = true;
      saveStorySeenState();
      showStoryScene(ch.prologue, afterPrologue);
      return;
    }
    afterPrologue();
  }

  function runStoryAfterChapterWin(levelIdx, onDone) {
    const lvl = levelIdx + 1;
    if (lvl % 20 !== 0) {
      if (onDone) onDone();
      return;
    }
    const chIdx = getChapterForLevel(levelIdx);
    const ch = getChapterData(chIdx);
    const chKey = String(chIdx);
    if (ch && ch.epilogue && !storySeen.epilogues[chKey]) {
      storySeen.epilogues[chKey] = true;
      saveStorySeenState();
      showStoryScene(ch.epilogue, onDone);
      return;
    }
    if (onDone) onDone();
  }

  function pickStoryQuote(list) {
    if (!list || !list.length) return null;
    return list[randomInt(list.length)];
  }

  function renderGoalsStory() {
    if (!goalsStoryEl) return;
    const ch = getChapterData(getChapterForLevel(currentLevelIndex));
    const lvl = currentLevelIndex + 1;
    if (ch && ch.beats && ch.beats[lvl] && ch.beats[lvl][0]) {
      const ln = ch.beats[lvl][0];
      goalsStoryEl.innerHTML =
        (ln.avatar || "📜") + " <strong>" + ln.speaker + "：</strong>" + ln.text;
      goalsStoryEl.hidden = false;
    } else if (ch && ch.subtitle) {
      goalsStoryEl.textContent = ch.icon + " " + ch.subtitle;
      goalsStoryEl.hidden = false;
    } else {
      goalsStoryEl.hidden = true;
    }
  }

  function getCodexCatalog() {
    return typeof window !== "undefined" && window.MATCH3_CODEX ? window.MATCH3_CODEX : [];
  }

  function loadCodexState() {
    try {
      const raw = window.localStorage.getItem(CODEX_STATE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.counts) codexState.counts = parsed.counts.slice(0, NUM_TYPES);
        if (parsed.unlocked) codexState.unlocked = parsed.unlocked.slice(0, NUM_TYPES);
      }
    } catch (e) {
      codexState = { counts: [0, 0, 0, 0, 0, 0], unlocked: [false, false, false, false, false, false] };
    }
    while (codexState.counts.length < NUM_TYPES) codexState.counts.push(0);
    while (codexState.unlocked.length < NUM_TYPES) codexState.unlocked.push(false);
  }

  function saveCodexState() {
    try {
      window.localStorage.setItem(CODEX_STATE_KEY, JSON.stringify(codexState));
    } catch (e) {
      // ignore
    }
  }

  function recordRelicClears(matched) {
    if (!matched || !matched.size) return;
    let changed = false;
    matched.forEach(function (k) {
      const parts = k.split(",");
      const r = Number(parts[0]);
      const c = Number(parts[1]);
      const t = board[r] && board[r][c];
      if (t == null || t < 0 || t >= NUM_TYPES) return;
      codexState.counts[t] = (codexState.counts[t] || 0) + 1;
      if (!codexState.unlocked[t]) {
        codexState.unlocked[t] = true;
        showEvolutionToast("📖 图鉴收录：" + (RELIC_NAMES[t] || "文物"));
      }
      changed = true;
    });
    if (changed) saveCodexState();
  }

  function codexUnlockedCount() {
    let n = 0;
    for (let i = 0; i < NUM_TYPES; i++) {
      if (codexState.unlocked[i]) n++;
    }
    return n;
  }

  function renderChapterProgress() {
    const chIdx = getChapterForLevel(maxUnlockedLevel);
    const w = worldForLevel(maxUnlockedLevel);
    const inChapter = maxUnlockedLevel % 20;
    const pct = Math.min(100, (inChapter / 20) * 100);
    if (homeChapterLabelEl) {
      homeChapterLabelEl.textContent =
        "第" + (chIdx + 1) + "章 · " + w.name + " · 已探 " + inChapter + "/20 层";
    }
    if (homeChapterFillEl) homeChapterFillEl.style.width = pct.toFixed(1) + "%";
    if (homeCodexHintEl) {
      homeCodexHintEl.textContent = "图鉴收录 " + codexUnlockedCount() + "/" + NUM_TYPES;
    }
  }

  function renderCodexModal() {
    if (!codexGridEl) return;
    codexGridEl.innerHTML = "";
    const catalog = getCodexCatalog();
    var firstUnlocked = 0;
    catalog.forEach(function (entry, i) {
      const card = document.createElement("div");
      const unlocked = codexState.unlocked[i];
      if (unlocked && firstUnlocked === 0 && i > 0) firstUnlocked = i;
      if (unlocked && i === 0) firstUnlocked = 0;
      card.className = "codex-card" + (unlocked ? " unlocked" : " locked");
      const count = codexState.counts[i] || 0;
      var detailHtml = "";
      if (unlocked && entry.detail) {
        detailHtml =
          '<div class="codex-detail-block">' +
          (entry.discovered ? '<div class="codex-detail-row">📅 ' + entry.discovered + "</div>" : "") +
          (entry.dimensions ? '<div class="codex-detail-row">📐 ' + entry.dimensions + "</div>" : "") +
          (entry.material ? '<div class="codex-detail-row">🧪 ' + entry.material + "</div>" : "") +
          (entry.museum ? '<div class="codex-detail-row">🏛 ' + entry.museum + "</div>" : "") +
          (entry.significance ? '<div class="codex-detail-row">✦ ' + entry.significance + "</div>" : "") +
          '<p class="codex-detail-long">' +
          entry.detail +
          "</p></div>";
      }
      card.innerHTML =
        '<div class="codex-card-head"><span class="codex-card-icon">' +
        (entry.icon || "📜") +
        '</span><span class="codex-card-name">' +
        (entry.name || RELIC_NAMES[i] || "文物") +
        "</span></div>" +
        '<div class="codex-card-meta">' +
        (unlocked ? entry.era + " · " + entry.rarity : "尚未收录") +
        "</div>" +
        '<p class="codex-card-lore">' +
        (unlocked ? entry.lore : "消除该文物即可解锁条目") +
        "</p>" +
        detailHtml +
        (unlocked ? '<div class="codex-card-count">已消除 ' + count + " 次 · 点击查看3D</div>" : "");
      if (unlocked) {
        card.style.cursor = "pointer";
        card.addEventListener("click", function () {
          if (window.ArtifactViewer3D && artifact3dMountEl) {
            var v = window.ArtifactViewer3D.get();
            if (v && v.ok) v.setType(i);
            else window.ArtifactViewer3D.create(artifact3dMountEl, i);
          }
        });
      }
      codexGridEl.appendChild(card);
    });
    if (window.ArtifactViewer3D && artifact3dMountEl) {
      var showId = codexState.unlocked[firstUnlocked] ? firstUnlocked : 0;
      for (var j = 0; j < NUM_TYPES; j++) {
        if (codexState.unlocked[j]) { showId = j; break; }
      }
      window.ArtifactViewer3D.create(artifact3dMountEl, showId);
    }
  }

  function openCodexModal() {
    renderCodexModal();
    if (codexModalEl) codexModalEl.hidden = false;
  }

  function closeCodexModal() {
    if (codexModalEl) codexModalEl.hidden = true;
  }

  function loadProgress() {
    try {
      const raw = window.localStorage.getItem(UNLOCK_KEY);
      maxUnlockedLevel = raw ? Math.min(MAX_LEVEL - 1, Math.max(0, parseInt(raw, 10) || 0)) : 0;
    } catch (e) {
      maxUnlockedLevel = 0;
    }
  }

  function saveProgress() {
    try {
      window.localStorage.setItem(UNLOCK_KEY, String(maxUnlockedLevel));
    } catch (e) {
      // ignore
    }
  }

  function totalStarsEarned() {
    let n = 0;
    Object.keys(levelStarsMap).forEach(function (k) {
      n += levelStarsMap[k] || 0;
    });
    return n;
  }

  function worldForLevel(levelIdx) {
    return WORLDS[Math.min(WORLDS.length - 1, Math.floor(levelIdx / 20))];
  }

  function applyWorldTheme(levelIdx) {
    const w = worldForLevel(levelIdx);
    document.body.className = w.theme;
    if (worldIconEl) worldIconEl.textContent = w.icon;
    if (worldNameEl) worldNameEl.textContent = w.name;
    if (goalsWorldEl) {
      goalsWorldEl.textContent =
        w.icon + " " + w.name + (w.subtitle ? " · " + w.subtitle : "") + " · 第 " + (levelIdx + 1) + " 层";
    }
  }

  function showScreen(name) {
    if (screenHomeEl) screenHomeEl.hidden = name !== "home";
    if (screenMapEl) screenMapEl.hidden = name !== "map";
    if (screenPlayEl) screenPlayEl.hidden = name !== "play";
  }

  function updateHomeStats() {
    if (homeTotalStarsEl) homeTotalStarsEl.textContent = String(totalStarsEarned());
    if (homeMaxLevelEl) homeMaxLevelEl.textContent = String(maxUnlockedLevel + 1);
    if (mapStarTotalEl) mapStarTotalEl.textContent = "★ " + totalStarsEarned();
  }

  function showHome() {
    updateHomeStats();
    renderEvolutionHome();
    renderChapterProgress();
    showScreen("home");
  }

  function showMap() {
    updateHomeStats();
    mapActiveChapter = getChapterForLevel(maxUnlockedLevel);
    destroyMap3D();
    showMapPhase("world");
    renderWorldMap();
    showScreen("map");
  }

  function getMapNarrative() {
    return typeof window !== "undefined" && window.MATCH3_MAP ? window.MATCH3_MAP : null;
  }

  function getMapChapterNarrative(chIdx) {
    const m = getMapNarrative();
    return m && m.chapters ? m.chapters[chIdx] : null;
  }

  function chapterUnlocked(chIdx) {
    if (chIdx <= 0) return true;
    return maxUnlockedLevel >= chIdx * 20;
  }

  function showMapPhase(phase) {
    mapPhase = phase;
    if (mapPhaseStepsEl) mapPhaseStepsEl.hidden = phase === "world";
    if (mapPhaseWorldEl) mapPhaseWorldEl.hidden = phase !== "world";
    if (mapPhaseBriefingEl) mapPhaseBriefingEl.hidden = phase !== "briefing";
    if (mapPhaseAssemblyEl) mapPhaseAssemblyEl.hidden = phase !== "assembly";
    if (mapPhaseRouteEl) mapPhaseRouteEl.hidden = phase !== "route";
    const titles = { world: "蜀地总览", briefing: "② 作战策划", assembly: "③ 小队集合", route: "④ 探方路线" };
    if (mapHeadTitleEl) mapHeadTitleEl.textContent = titles[phase] || "蜀地地图";
    if (mapPhaseStepsEl) {
      mapPhaseStepsEl.querySelectorAll(".map-step").forEach(function (el) {
        const step = el.getAttribute("data-step");
        el.classList.remove("active", "done");
        if (step === phase) el.classList.add("active");
        else if (
          (phase === "briefing" && step === "world") ||
          (phase === "assembly" && (step === "world" || step === "briefing")) ||
          (phase === "route" && step !== "route")
        ) {
          el.classList.add("done");
        }
      });
    }
  }

  function loadExpeditionState() {
    try {
      const raw = window.localStorage.getItem(EXPEDITION_STATE_KEY);
      if (raw) expeditionState = Object.assign({ beatenLevels: {} }, JSON.parse(raw));
    } catch (e) {
      expeditionState = { beatenLevels: {} };
    }
  }

  function saveExpeditionState() {
    try {
      window.localStorage.setItem(EXPEDITION_STATE_KEY, JSON.stringify(expeditionState));
    } catch (e) {
      // ignore
    }
  }

  function markLevelBeaten(levelIdx) {
    expeditionState.beatenLevels[String(levelIdx)] = true;
    saveExpeditionState();
  }

  function syncBeatenFromProgress() {
    for (let i = 0; i <= maxUnlockedLevel; i++) {
      if (i > 0 || levelStarsMap[0]) expeditionState.beatenLevels[String(i)] = true;
    }
    if (maxUnlockedLevel > 0) {
      for (let i = 0; i < maxUnlockedLevel; i++) {
        expeditionState.beatenLevels[String(i)] = true;
      }
    }
    saveExpeditionState();
  }

  function destroyMap3D() {
    if (window.WorldMap3D) window.WorldMap3D.destroy();
    if (window.ExpeditionMap3D) window.ExpeditionMap3D.destroy();
  }

  function initBriefingCinema() {
    if (!vnBriefingCinemaEl || !window.CharacterCinema) return;
    if (!briefingCinema || !briefingCinema.ok) briefingCinema = window.CharacterCinema.create(vnBriefingCinemaEl);
  }

  function initAssemblyCinema() {
    if (!vnAssemblyCinemaEl || !window.CharacterCinema) return;
    if (!assemblyCinema || !assemblyCinema.ok) assemblyCinema = window.CharacterCinema.create(vnAssemblyCinemaEl);
  }

  function renderWorldMap() {
    const mapData = getMapNarrative();
    if (worldMapIntroEl && mapData && mapData.worldIntro) {
      var introLines = mapData.worldIntro.lines || [];
      worldMapIntroEl.textContent = introLines.map(function (l) { return l.text; }).join(" ");
    }
    if (window.WorldMap3D && world3dMountEl) {
      window.WorldMap3D.create(world3dMountEl, function (wi) {
        if (chapterUnlocked(wi)) enterChapterExpedition(wi);
      });
      var wm = window.WorldMap3D.get();
      if (wm && wm.setChapterHighlight) wm.setChapterHighlight(getChapterForLevel(maxUnlockedLevel));
    }
  }

  function showDiscoveryModal(node, onGo) {
    if (!discoveryModalEl) {
      if (onGo) onGo();
      return;
    }
    var speakerId = node.discover ? node.discover[0] : "narrator";
    var text = node.discover ? node.discover[1] : "发现新探点。";
    var roster = { hutan: "胡探", wangdun: "王墩", yangxue: "杨雪", jinyaliu: "金牙刘", chenli: "陈礼", narrator: "旁白" };
    if (discoveryTagEl) {
      discoveryTagEl.textContent = node.isTomb ? "⚱ 终极大墓" : "📍 发现探点";
      discoveryTagEl.className = "discovery-tag" + (node.isTomb ? " tomb" : "");
    }
    if (discoveryTitleEl) discoveryTitleEl.textContent = node.name;
    if (discoveryTextEl) discoveryTextEl.textContent = (roster[speakerId] || "旁白") + "：「" + text + "」";
    if (discoveryCinemaEl && window.CharacterCinema) {
      var dc = window.CharacterCinema.create(discoveryCinemaEl);
      if (dc && dc.ok) dc.showCharacter(speakerId, true);
    }
    if (window.ArtifactViewer3D && discoveryCinemaEl && node.artifactHint != null) {
      /* artifact shown in cinema mount alternates - character takes priority */
    }
    discoveryModalEl.hidden = false;
    if (discoveryGoBtn) {
      discoveryGoBtn.onclick = function () {
        discoveryModalEl.hidden = true;
        if (onGo) onGo();
      };
    }
    if (discoveryCancelBtn) {
      discoveryCancelBtn.onclick = function () {
        discoveryModalEl.hidden = true;
      };
    }
  }

  function onExpeditionNodePick(node) {
    showDiscoveryModal(node, function () {
      pendingDiscoveryLevel = node.level;
      startLevel(node.level);
    });
  }

  function renderStoryRoute(chIdx) {
    const world = WORLDS[chIdx];
    const narr = getMapChapterNarrative(chIdx);
    const expData = window.MATCH3_EXPEDITION;
    const tier = expData && expData.tombTiers ? expData.tombTiers[chIdx] : null;
    if (tombTierBannerEl && tier) {
      tombTierBannerEl.textContent = tier.icon + " " + tier.name + " · " + tier.desc;
    }
    if (routeChapterTitleEl) {
      routeChapterTitleEl.textContent = (world ? world.icon + " " + world.name : "") + " · 三维探宝";
    }
    if (routeChapterBlurbEl) {
      routeChapterBlurbEl.textContent = narr && narr.routeIntro ? narr.routeIntro : "点击探点 · 发现线索 · 闯关过关 · 直至大墓";
    }
    if (window.ExpeditionMap3D && expedition3dMountEl) {
      window.ExpeditionMap3D.create(expedition3dMountEl, chIdx, expeditionState, onExpeditionNodePick);
    }
    if (routeNodeListEl && expData && expData.chapters[chIdx]) {
      routeNodeListEl.innerHTML = "";
      expData.chapters[chIdx].nodes.forEach(function (node, ni) {
        var unlocked = ni === 0 || expeditionState.beatenLevels[String(expData.chapters[chIdx].nodes[ni - 1].level)];
        var beaten = expeditionState.beatenLevels[String(node.level)];
        var row = document.createElement("div");
        row.className = "route-node-item" + (unlocked ? "" : " locked") + (beaten ? "" : "") + (node.isTomb ? " tomb" : "");
        if (node.level === maxUnlockedLevel || (!beaten && unlocked && node.level === maxUnlockedLevel)) row.classList.add("current");
        row.textContent = (beaten ? "✓ " : unlocked ? "◎ " : "🔒 ") + node.name + (node.isTomb ? " 【大墓】" : "") + " · L" + (node.level + 1);
        routeNodeListEl.appendChild(row);
      });
    }
  }

  function enterChapterExpedition(chIdx) {
    if (!chapterUnlocked(chIdx)) return;
    mapActiveChapter = chIdx;
    const narr = getMapChapterNarrative(chIdx);
    showMapPhase("briefing");
    startVnSequence(
      "briefing",
      narr && narr.briefing ? narr.briefing : [],
      narr && narr.briefingTitle ? narr.briefingTitle : "作战策划",
      function () {
        showMapPhase("assembly");
        startVnSequence(
          "assembly",
          narr && narr.assembly ? narr.assembly : [],
          narr && narr.assemblyTitle ? narr.assemblyTitle : "小队集合",
          function () {
            showMapPhase("route");
            renderStoryRoute(chIdx);
          }
        );
      }
    );
  }

  var VN_ROSTER = {
    hutan: { name: "胡探", avatar: "🧭" },
    wangdun: { name: "王墩", avatar: "💪" },
    yangxue: { name: "杨雪", avatar: "🔬" },
    jinyaliu: { name: "金牙刘", avatar: "💰" },
    chenli: { name: "陈礼", avatar: "📚" },
    narrator: { name: "旁白", avatar: "🌫" },
  };

  function ensureVnStage(stageEl) {
    if (!stageEl || stageEl.dataset.built) return;
    stageEl.innerHTML = "";
    ["hutan", "wangdun", "yangxue", "jinyaliu", "chenli"].forEach(function (id) {
      const p = VN_ROSTER[id];
      const el = document.createElement("div");
      el.className = "vn-char";
      el.dataset.charId = id;
      el.innerHTML =
        '<div class="vn-char-avatar">' +
        p.avatar +
        '</div><div class="vn-char-name">' +
        p.name +
        "</div>";
      stageEl.appendChild(el);
    });
    stageEl.dataset.built = "1";
  }

  function highlightVnSpeaker(stageEl, speakerId) {
    if (!stageEl) return;
    stageEl.querySelectorAll(".vn-char").forEach(function (el) {
      const id = el.dataset.charId;
      el.classList.remove("speaking", "visible");
      if (speakerId === "narrator") {
        if (id === "chenli" || id === "hutan") el.classList.add("visible");
      } else if (id === speakerId) {
        el.classList.add("visible", "speaking");
      } else if (speakerId && speakerId !== "narrator") {
        el.classList.add("visible");
      }
    });
  }

  function clearVnTyping() {
    if (vnTypingTimer) {
      window.clearInterval(vnTypingTimer);
      vnTypingTimer = null;
    }
  }

  function typewriteLine(el, text, onDone) {
    if (!el) {
      if (onDone) onDone();
      return;
    }
    clearVnTyping();
    el.textContent = "";
    el.classList.add("typing");
    let i = 0;
    vnTypingTimer = window.setInterval(function () {
      el.textContent += text.charAt(i);
      i += 1;
      if (i >= text.length) {
        clearVnTyping();
        el.classList.remove("typing");
        if (onDone) onDone();
      }
    }, 32);
  }

  function getVnElements(mode) {
    if (mode === "briefing") {
      return {
        cinema: vnBriefingCinemaEl,
        title: vnBriefingTitleEl,
        speaker: vnBriefingSpeakerEl,
        text: vnBriefingTextEl,
        next: vnBriefingNextBtn,
        skip: vnBriefingSkipBtn,
      };
    }
    return {
      cinema: vnAssemblyCinemaEl,
      title: vnAssemblyTitleEl,
      speaker: vnAssemblySpeakerEl,
      text: vnAssemblyTextEl,
      next: vnAssemblyNextBtn,
      skip: vnAssemblySkipBtn,
    };
  }

  function showVnLine() {
    const ui = getVnElements(vnMode);
    if (!vnLines.length || vnLineIndex >= vnLines.length) {
      clearVnTyping();
      if (vnOnComplete) vnOnComplete();
      vnOnComplete = null;
      return;
    }
    const line = vnLines[vnLineIndex];
    const charId = line.id || "narrator";
    if (ui.speaker) {
      ui.speaker.textContent = line.speaker || "旁白";
      ui.speaker.style.color = line.color || "#c9a227";
    }
    if (vnMode === "briefing") {
      initBriefingCinema();
      if (briefingCinema && briefingCinema.ok) briefingCinema.showCharacter(charId, true);
    } else {
      initAssemblyCinema();
      if (assemblyCinema && assemblyCinema.ok) assemblyCinema.showCharacter(charId, true);
    }
    typewriteLine(ui.text, line.text || "", function () {});
  }

  function advanceVnLine() {
    const ui = getVnElements(vnMode);
    if (ui.text && ui.text.classList.contains("typing")) {
      clearVnTyping();
      const line = vnLines[vnLineIndex];
      ui.text.textContent = line ? line.text : "";
      ui.text.classList.remove("typing");
      return;
    }
    vnLineIndex += 1;
    showVnLine();
  }

  function startVnSequence(mode, lines, title, onComplete) {
    vnMode = mode;
    vnLines = lines || [];
    vnLineIndex = 0;
    vnOnComplete = onComplete;
    const ui = getVnElements(mode);
    if (ui.title) ui.title.textContent = title || "";
    if (mode === "briefing") initBriefingCinema();
    else initAssemblyCinema();
    showVnLine();
  }

  function skipVnSequence(onSkipTo) {
    clearVnTyping();
    vnLines = [];
    vnLineIndex = 0;
    if (onSkipTo) onSkipTo();
  }

  function emptyIceGrid() {
    const g = [];
    for (let r = 0; r < ROWS; r++) {
      g[r] = [];
      for (let c = 0; c < COLS; c++) g[r][c] = 0;
    }
    return g;
  }

  function initIceForLevel(levelIdx) {
    iceGrid = emptyIceGrid();
    const world = worldForLevel(levelIdx);
    if (levelIdx + 1 < world.iceFrom) return;
    const count = Math.min(24, 6 + Math.floor(levelIdx / 8) + (isBossLevel(levelIdx) ? 4 : 0));
    let placed = 0;
    let guard = 0;
    while (placed < count && guard < 200) {
      guard++;
      const r = randomInt(ROWS);
      const c = randomInt(COLS);
      if (iceGrid[r][c] > 0) continue;
      iceGrid[r][c] = levelIdx >= 50 ? (Math.random() < 0.35 ? 2 : 1) : 1;
      placed++;
    }
  }

  function resetBoosters() {
    hammerLeft = BOOSTER_HAMMER_START + dailyChallengeBonus.hammer;
    shuffleLeft = BOOSTER_SHUFFLE_START;
    hammerMode = false;
    updateBoosterUi();
  }

  function updateBoosterUi() {
    if (hammerCountEl) hammerCountEl.textContent = String(hammerLeft);
    if (shuffleCountEl) shuffleCountEl.textContent = String(shuffleLeft);
    if (boosterHammerBtn) {
      boosterHammerBtn.disabled = hammerLeft <= 0 || processing || gameOver;
      boosterHammerBtn.classList.toggle("active", hammerMode);
    }
    if (boosterShuffleBtn) boosterShuffleBtn.disabled = shuffleLeft <= 0 || processing || gameOver;
  }

  function spawnConfetti() {
    if (!confettiLayerEl) return;
    confettiLayerEl.innerHTML = "";
    const colors = ["#ffd93d", "#6fcf6f", "#ff7eb3", "#6ec6ff", "#c77dff", "#fff"];
    for (let i = 0; i < 80; i++) {
      const p = document.createElement("div");
      p.className = "confetti-piece";
      p.style.left = Math.random() * 100 + "%";
      p.style.top = "-5%";
      p.style.background = colors[randomInt(colors.length)];
      p.style.animationDuration = 1.8 + Math.random() * 1.2 + "s";
      p.style.animationDelay = Math.random() * 0.4 + "s";
      confettiLayerEl.appendChild(p);
    }
    window.setTimeout(function () {
      if (confettiLayerEl) confettiLayerEl.innerHTML = "";
    }, 3500);
  }

  function showMegaCombo(text) {
    if (!megaComboEl) return;
    megaComboEl.textContent = text;
    megaComboEl.hidden = false;
    megaComboEl.classList.add("show");
    window.setTimeout(function () {
      megaComboEl.classList.remove("show");
      megaComboEl.hidden = true;
    }, 1200);
  }

  function spawnMatchParticles(cellCount) {
    if (!fxLayerEl || !boardEl) return;
    const n = Math.min(16, cellCount * 2);
    const rect = boardEl.getBoundingClientRect();
    const wrap = boardEl.parentElement && boardEl.parentElement.getBoundingClientRect();
    if (!wrap) return;
    for (let i = 0; i < n; i++) {
      const p = document.createElement("span");
      p.className = "particle";
      const x = rect.left - wrap.left + Math.random() * rect.width;
      const y = rect.top - wrap.top + Math.random() * rect.height;
      p.style.left = x + "px";
      p.style.top = y + "px";
      p.style.background = ["#ffd93d", "#6fcf6f", "#ff7eb3", "#fff"][randomInt(4)];
      const ang = Math.random() * Math.PI * 2;
      const dist = 20 + Math.random() * 40;
      p.style.setProperty("--px", Math.cos(ang) * dist + "px");
      p.style.setProperty("--py", Math.sin(ang) * dist + "px");
      fxLayerEl.appendChild(p);
      window.setTimeout(function () {
        p.remove();
      }, 600);
    }
  }

  function clearHintPulse() {
    if (!boardEl) return;
    boardEl.querySelectorAll(".hint-pulse").forEach(function (el) {
      el.classList.remove("hint-pulse");
    });
  }

  function findHintSwap() {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (c + 1 < COLS && swapCreatesMatch(r, c, r, c + 1))
          return [
            { r: r, c: c },
            { r: r, c: c + 1 },
          ];
        if (r + 1 < ROWS && swapCreatesMatch(r, c, r + 1, c))
          return [
            { r: r, c: c },
            { r: r + 1, c: c },
          ];
      }
    }
    return null;
  }

  function showHint() {
    if (processing || gameOver) return;
    clearHintPulse();
    const pair = findHintSwap();
    if (!pair) {
      setMessage("暂无可用步数，试试重排道具！");
      return;
    }
    pair.forEach(function (p) {
      const el = boardEl && boardEl.querySelector('.cell[data-r="' + p.r + '"][data-c="' + p.c + '"]');
      if (el) el.classList.add("hint-pulse");
    });
    if (hintTimer) window.clearTimeout(hintTimer);
    hintTimer = window.setTimeout(clearHintPulse, 2500);
    setMessage("💡 高亮格子可交换消除");
  }

  function useHammerOn(r, c) {
    if (hammerLeft <= 0 || processing || gameOver) return;
    hammerLeft -= 1;
    hammerMode = false;
    updateBoosterUi();
    recordRelicClears(new Set([key(r, c)]));
    board[r][c] = -1;
    specialGrid[r][c] = SPECIAL_NONE;
    iceGrid[r][c] = 0;
    gravityAndRefillWithSpecials(board, specialGrid);
    renderCells();
    soundMatch(1);
    spawnMatchParticles(1);
      setMessage("⛏ 已清理一格");
  }

  function processIceBeforeClear(matched) {
    const toClear = new Set();
    const iceDamaged = new Set();
    matched.forEach(function (k) {
      const parts = k.split(",");
      const r = Number(parts[0]);
      const c = Number(parts[1]);
      if (iceGrid[r][c] > 0) {
        iceGrid[r][c] -= 1;
        iceDamaged.add(k);
      } else {
        toClear.add(k);
      }
    });
    return { toClear: toClear, iceDamaged: iceDamaged };
  }

  function calcStars(scoreVal, target, movesLeftVal, movesTotal) {
    if (scoreVal < target) return 0;
    const scoreRatio = scoreVal / target;
    const moveRatio = movesTotal > 0 ? movesLeftVal / movesTotal : 0;
    if (scoreRatio >= 1.45 || moveRatio >= 0.35) return 3;
    if (scoreRatio >= 1.12 || moveRatio >= 0.12) return 2;
    return 1;
  }

  function renderStarRow(container, count) {
    if (!container) return;
    container.querySelectorAll(".star").forEach(function (el) {
      const n = Number(el.getAttribute("data-star"));
      el.classList.toggle("on", n <= count);
    });
  }

  function updateProgressBar() {
    const pct = levelTarget > 0 ? Math.min(100, (score / levelTarget) * 100) : 0;
    if (scoreProgressEl) scoreProgressEl.style.width = pct.toFixed(1) + "%";
    if (progressTextEl) progressTextEl.textContent = score + " / " + levelTarget;
    renderStarRow(liveStarsEl, calcStars(score, levelTarget, movesLeft, levelMovesTotal));
  }

  function showComboBanner(step) {
    const loreIdx = Math.min(COMBO_LORE.length - 1, Math.max(0, step));
    const loreText = COMBO_LORE[loreIdx] || step + " 连击";
    if (step >= 5) showMegaCombo(loreText + " !!");
    else if (step >= 3) showMegaCombo(loreText + " !");
    if (!comboBannerEl || step < 2) return;
    comboBannerEl.textContent = loreText;
    comboBannerEl.hidden = false;
    comboBannerEl.classList.add("show");
    window.setTimeout(function () {
      comboBannerEl.classList.remove("show");
      window.setTimeout(function () {
        comboBannerEl.hidden = true;
      }, 200);
    }, 700);
  }

  function spawnScoreFloat(points) {
    if (!fxLayerEl || !boardEl || points <= 0) return;
    const el = document.createElement("span");
    el.className = "score-float";
    el.textContent = "+" + points;
    el.style.left = "50%";
    el.style.top = "42%";
    fxLayerEl.appendChild(el);
    window.setTimeout(function () {
      el.remove();
    }, 800);
  }

  /**
   * @param {number[][]} g
   * @returns {{ cells: {r:number,c:number}[], len: number, orient: 'h'|'v', center: {r:number,c:number} }[]}
   */
  function findMatchSegments(g) {
    const segments = [];
    for (let r = 0; r < ROWS; r++) {
      let c = 0;
      while (c < COLS) {
        const v = g[r][c];
        if (v < 0) {
          c++;
          continue;
        }
        let len = 1;
        while (c + len < COLS && g[r][c + len] === v) len++;
        if (len >= 3) {
          const cells = [];
          for (let k = 0; k < len; k++) cells.push({ r: r, c: c + k });
          segments.push({ cells: cells, len: len, orient: "h", center: cells[Math.floor(len / 2)] });
        }
        c += len;
      }
    }
    for (let c = 0; c < COLS; c++) {
      let r = 0;
      while (r < ROWS) {
        const v = g[r][c];
        if (v < 0) {
          r++;
          continue;
        }
        let len = 1;
        while (r + len < ROWS && g[r + len][c] === v) len++;
        if (len >= 3) {
          const cells = [];
          for (let k = 0; k < len; k++) cells.push({ r: r + k, c: c });
          segments.push({ cells: cells, len: len, orient: "v", center: cells[Math.floor(len / 2)] });
        }
        r += len;
      }
    }
    return segments;
  }

  function expandClearsWithSpecials(keys) {
    const expanded = new Set(keys);
    keys.forEach(function (k) {
      const parts = k.split(",");
      const r = Number(parts[0]);
      const c = Number(parts[1]);
      const sp = specialGrid[r] && specialGrid[r][c];
      if (sp === SPECIAL_ROW) {
        for (let cc = 0; cc < COLS; cc++) expanded.add(key(r, cc));
      } else if (sp === SPECIAL_COL) {
        for (let rr = 0; rr < ROWS; rr++) expanded.add(key(rr, c));
      } else if (sp === SPECIAL_BOMB) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const rr = r + dr;
            const cc = c + dc;
            if (rr >= 0 && rr < ROWS && cc >= 0 && cc < COLS) expanded.add(key(rr, cc));
          }
        }
      }
    });
    return expanded;
  }

  function planSpecialCreations(segments) {
    const creations = [];
    const reserved = new Set();
    segments
      .slice()
      .sort(function (a, b) {
        return b.len - a.len;
      })
      .forEach(function (seg) {
        if (seg.len < 4) return;
        const k = key(seg.center.r, seg.center.c);
        if (reserved.has(k)) return;
        reserved.add(k);
        creations.push({
          r: seg.center.r,
          c: seg.center.c,
          kind: seg.len >= 5 ? SPECIAL_BOMB : seg.orient === "h" ? SPECIAL_ROW : SPECIAL_COL,
        });
      });
    return creations;
  }

  function applySpecialClasses(el, r, c) {
    if (!el) return;
    el.classList.remove("special-row", "special-col", "special-bomb");
    const sp = specialGrid[r][c];
    if (sp === SPECIAL_ROW) el.classList.add("special-row");
    else if (sp === SPECIAL_COL) el.classList.add("special-col");
    else if (sp === SPECIAL_BOMB) el.classList.add("special-bomb");
  }

  function gravityAndRefillWithSpecials(g, sp) {
    for (let c = 0; c < COLS; c++) {
      const stack = [];
      const specStack = [];
      for (let r = ROWS - 1; r >= 0; r--) {
        if (g[r][c] >= 0) {
          stack.push(g[r][c]);
          specStack.push(sp[r][c]);
        }
      }
      for (let r = ROWS - 1; r >= 0; r--) {
        if (stack.length) {
          g[r][c] = stack.shift();
          sp[r][c] = specStack.shift();
        } else {
          g[r][c] = randomRefill(g, r, c);
          sp[r][c] = SPECIAL_NONE;
        }
      }
    }
  }

  function hasAnyValidMove() {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (c + 1 < COLS && swapCreatesMatch(r, c, r, c + 1)) return true;
        if (r + 1 < ROWS && swapCreatesMatch(r, c, r + 1, c)) return true;
      }
    }
    return false;
  }

  function shuffleBoard() {
    const types = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        types.push(board[r][c]);
      }
    }
    let guard = 0;
    do {
      for (let i = types.length - 1; i > 0; i--) {
        const j = randomInt(i + 1);
        const t = types[i];
        types[i] = types[j];
        types[j] = t;
      }
      let idx = 0;
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          board[r][c] = types[idx++];
          specialGrid[r][c] = SPECIAL_NONE;
        }
      }
      guard++;
    } while ((!hasAnyValidMove() || findMatchInfo(board).cells.size > 0) && guard < 40);
    renderCells();
    setMessage("棋盘已重排，继续挑战！");
  }

  function showLevelGoals(onStart) {
    if (goalsIceLineEl) {
      const hasIce = worldForLevel(currentLevelIndex).iceFrom <= currentLevelIndex + 1;
      goalsIceLineEl.hidden = !hasIce;
    }
    if (!goalsModalEl) {
      if (onStart) onStart();
      return;
    }
    if (goalsLevelNumEl) goalsLevelNumEl.textContent = String(currentLevelIndex + 1);
    if (goalsTargetEl) goalsTargetEl.textContent = String(levelTarget);
    if (goalsMovesEl) goalsMovesEl.textContent = String(movesLeft);
    renderGoalsStory();
    if (goalsBossBadgeEl) goalsBossBadgeEl.hidden = !isBossLevel(currentLevelIndex);
    goalsModalEl.hidden = false;
    if (goalsStartBtn) {
      goalsStartBtn.onclick = function () {
        goalsModalEl.hidden = true;
        goalsStartBtn.onclick = null;
        if (onStart) onStart();
      };
    }
  }

  /**
   * 找出所有连成 3+ 的段（横或竖），并计算本轮得分。
   * @param {number[][]} g
   * @returns {{ cells: Set<string>, points: number, maxLen: number }}
   */
  function findMatchInfo(g) {
    const segments = findMatchSegments(g);
    const cells = new Set();
    let points = 0;
    let maxLen = 0;
    segments.forEach(function (seg) {
      points += Math.min(MAX_POINTS_PER_MOVE, seg.len + 2);
      if (seg.len > maxLen) maxLen = seg.len;
      seg.cells.forEach(function (p) {
        cells.add(key(p.r, p.c));
      });
    });
    return { cells: cells, points: points, maxLen: maxLen, segments: segments };
  }

  /**
   * 交换后是否会产生至少一组三连。
   */
  function swapCreatesMatch(r1, c1, r2, c2) {
    const g = cloneGrid(board);
    swapCells(g, r1, c1, r2, c2);
    return findMatchInfo(g).cells.size > 0;
  }

  /**
   * 生成初始盘面，避免出现开局即消除。
   */
  function fillNoMatches() {
    const g = [];
    for (let r = 0; r < ROWS; r++) {
      g[r] = [];
      for (let c = 0; c < COLS; c++) {
        let t;
        let guard = 0;
        do {
          t = randomInt(NUM_TYPES);
          guard++;
          if (guard > 80) break;
        } while (
          (c >= 2 && g[r][c - 1] === t && g[r][c - 2] === t) ||
          (r >= 2 && g[r - 1][c] === t && g[r - 2][c] === t)
        );
        g[r][c] = t;
      }
    }
    return g;
  }

  /**
   * 顶部补块时尽量避免一步形成三连（尽力而为）。
   */
  function randomRefill(g, r, c) {
    // 增加联消机会：一定概率“偏向选择能立即凑成三连的类型”
    // 注意：仍尽量避免“一步就生成太多三连”导致节奏失控，采用概率性偏向而非强制。
    const matchChance = currentLevelIndex <= 0 ? 0.65 : 0.42;

    // vertical: 下面两个相同
    if (r <= ROWS - 3 && g[r + 1][c] >= 0 && g[r + 1][c] === g[r + 2][c]) {
      if (Math.random() < matchChance) return g[r + 1][c];
    }
    // horizontal: 左边两个相同（前面列已填完时可用）
    if (c >= 2 && g[r][c - 1] >= 0 && g[r][c - 1] === g[r][c - 2]) {
      if (Math.random() < matchChance * 0.75) return g[r][c - 1];
    }

    // fallback：随机，但尽量避免直接凑三连（保留一点“控盘”）
    const bad = new Set();
    if (c >= 2 && g[r][c - 1] === g[r][c - 2] && g[r][c - 1] >= 0) bad.add(g[r][c - 1]);
    if (r <= ROWS - 3 && g[r + 1][c] === g[r + 2][c] && g[r + 1][c] >= 0) bad.add(g[r + 1][c]);

    let t;
    let guard = 0;
    do {
      t = randomInt(NUM_TYPES);
      guard++;
    } while (bad.has(t) && guard < 30);
    return t;
  }

  function gravityAndRefill(g) {
    for (let c = 0; c < COLS; c++) {
      const stack = [];
      for (let r = ROWS - 1; r >= 0; r--) {
        if (g[r][c] >= 0) stack.push(g[r][c]);
      }
      for (let r = ROWS - 1; r >= 0; r--) {
        if (stack.length) g[r][c] = stack.shift();
        else g[r][c] = randomRefill(g, r, c);
      }
    }
  }

  function adjacent(r1, c1, r2, c2) {
    return Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1;
  }

  function sleep(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }

  function renderCells() {
    if (!boardEl) return;
    boardEl.innerHTML = "";
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell = document.createElement("div");
        cell.className = "cell";
        cell.dataset.r = String(r);
        cell.dataset.c = String(c);
        const t = board[r][c];
        cell.dataset.type = String(t);
        applySpecialClasses(cell, r, c);
        if (iceGrid[r] && iceGrid[r][c] > 0) {
          cell.classList.add("has-ice");
          const ice = document.createElement("span");
          ice.className = "ice-overlay" + (iceGrid[r][c] >= 2 ? " ice-2" : "");
          cell.appendChild(ice);
        }
        cell.setAttribute("role", "gridcell");
        cell.setAttribute("aria-label", RELIC_NAMES[t] || "文物");
        cell.tabIndex = 0;
        boardEl.appendChild(cell);
      }
    }
  }

  function updateHud() {
    if (levelEl) levelEl.textContent = currentLevelIndex + 1 + "/" + MAX_LEVEL;
    if (levelNumEl) levelNumEl.textContent = String(currentLevelIndex + 1);
    if (targetScoreEl) targetScoreEl.textContent = String(levelTarget);
    if (scoreEl) {
      scoreEl.textContent = String(score);
      scoreEl.classList.toggle("target-met", score >= levelTarget && levelTarget > 0);
    }
    if (movesEl) {
      movesEl.textContent = String(movesLeft);
      movesEl.classList.toggle("low", movesLeft <= 3 && movesLeft > 0);
    }
    updateProgressBar();
  }

  function setMessage(text, isGameOver) {
    if (!messageEl) return;
    messageEl.textContent = text;
    messageEl.classList.toggle("gameover", !!isGameOver);
  }

  function setProcessing(on) {
    processing = on;
    if (boardEl) boardEl.classList.toggle("processing", on);
  }

  function flashBoard() {
    if (!boardEl) return;
    boardEl.classList.remove("flash");
    // 触发重排，确保连续闪烁也能生效
    void boardEl.offsetWidth;
    boardEl.classList.add("flash");
    window.setTimeout(function () {
      if (boardEl) boardEl.classList.remove("flash");
    }, 260);
  }

  function clearSelection() {
    selected = null;
    if (!boardEl) return;
    boardEl.querySelectorAll(".cell.selected").forEach(function (el) {
      el.classList.remove("selected");
    });
  }

  function clearSwipePathUi() {
    if (!boardEl) return;
    boardEl.querySelectorAll(".cell.path").forEach(function (el) {
      el.classList.remove("path");
    });
  }

  function resetSwipeState() {
    swiping = false;
    swipePath = [];
    swipeType = null;
    swipePointerId = null;
    didDirectionalSwap = false;
    clearSwipePathUi();
  }

  function selectCell(r, c) {
    clearSelection();
    selected = { r: r, c: c };
    const el = boardEl && boardEl.querySelector('.cell[data-r="' + r + '"][data-c="' + c + '"]');
    if (el) el.classList.add("selected");
  }

  function setPathUi(path) {
    if (!boardEl) return;
    clearSwipePathUi();
    path.forEach(function (p) {
      const el = boardEl.querySelector('.cell[data-r="' + p.r + '"][data-c="' + p.c + '"]');
      if (el) el.classList.add("path");
    });
  }

  function refreshCellTypes() {
    if (!boardEl) return;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const el = boardEl.querySelector('.cell[data-r="' + r + '"][data-c="' + c + '"]');
        if (el) {
          const t = board[r][c];
          el.dataset.type = String(t);
          applySpecialClasses(el, r, c);
          if (t >= 0) el.setAttribute("aria-label", RELIC_NAMES[t] || "文物");
        }
      }
    }
  }

  function markMatchedCells(matched) {
    matched.forEach(function (k) {
      const parts = k.split(",");
      const r = parts[0];
      const c = parts[1];
      const el = boardEl && boardEl.querySelector('.cell[data-r="' + r + '"][data-c="' + c + '"]');
      if (el) el.classList.add("matched");
    });
  }

  /**
   * 消除连锁：直到盘面无匹配。
   * @returns {number} 本回合消除的格子总数
   */
  async function resolveAllMatches() {
    let totalCleared = 0;
    cascadeStep = 0;
    while (true) {
      const info = findMatchInfo(board);
      if (info.cells.size === 0) break;

      cascadeStep += 1;
      if (cascadeStep > 1) showComboBanner(cascadeStep);

      let matched = expandClearsWithSpecials(info.cells);
      recordRelicClears(matched);
      const iceResult = processIceBeforeClear(matched);
      matched = iceResult.toClear;
      if (iceResult.iceDamaged.size > 0) renderCells();

      const creations = planSpecialCreations(info.segments || []);
      creations.forEach(function (cr) {
        const k = key(cr.r, cr.c);
        matched.delete(k);
        specialGrid[cr.r][cr.c] = cr.kind;
      });

      totalCleared += matched.size;
      let add = Math.min(info.points, Math.max(0, movePointsLeft));
      if (cascadeStep > 2) {
        add = Math.min(movePointsLeft, Math.round(add * (1 + (cascadeStep - 2) * 0.08)));
      }
      movePointsLeft -= add;
      score += add;
      updateHud();
      spawnScoreFloat(add);

      soundMatch(matched.size);
      flashBoard();
      spawnMatchParticles(matched.size);
      markMatchedCells(matched);
      await sleep(MATCH_ANIM_MS);

      if (boardEl) {
        boardEl.querySelectorAll(".cell.matched").forEach(function (el) {
          el.classList.remove("matched");
        });
      }

      matched.forEach(function (k) {
        const parts = k.split(",");
        const rr = Number(parts[0]);
        const cc = Number(parts[1]);
        board[rr][cc] = -1;
        specialGrid[rr][cc] = SPECIAL_NONE;
      });

      creations.forEach(function (cr) {
        refreshCellTypes();
        const el = boardEl && boardEl.querySelector('.cell[data-r="' + cr.r + '"][data-c="' + cr.c + '"]');
        if (el) applySpecialClasses(el, cr.r, cr.c);
      });

      gravityAndRefillWithSpecials(board, specialGrid);
      refreshCellTypes();
      await sleep(CASCADE_PAUSE_MS);
    }
    return totalCleared;
  }

  function applyClear(keysToClear) {
    keysToClear.forEach(function (k) {
      const parts = k.split(",");
      const rr = Number(parts[0]);
      const cc = Number(parts[1]);
      board[rr][cc] = -1;
    });
  }

  function makeKeySetFromPath(path) {
    const s = new Set();
    path.forEach(function (p) {
      s.add(key(p.r, p.c));
    });
    return s;
  }

  async function finalizeTurn() {
    // 统一的“行动结束判定”：先看过关，再看失败
    if (score >= levelTarget) {
      gameOver = true;
      recordEvolutionResult(true);
      soundLevelWin();
      if (currentLevelIndex >= MAX_LEVEL - 1) {
        setLevelActionButtons(false, false);
        setMessage(
          "恭喜通关全部 " +
            MAX_LEVEL +
            " 关！最终分数：" +
            score +
            "。点击「从第一关开始」可再挑战一遍。",
          true
        );
        showModalResult(true);
      } else {
        setMessage(
          "第 " +
            (currentLevelIndex + 1) +
            " 关完成！目标 " +
            levelTarget +
            " 分已达成。点击「下一关」继续。",
          false
        );
        setLevelActionButtons(true, false);
        showModalResult(true);
      }
      return;
    }

    if (movesLeft <= 0) {
      gameOver = true;
      recordEvolutionResult(false);
      soundGameOver();
      setMessage(
        "步数用尽！当前 " +
          score +
          " 分，未达到本关目标 " +
          levelTarget +
          " 分。可点「本关重试」或「从第一关开始」。",
        true
      );
      setLevelActionButtons(false, true);
      showModalResult(false);
    }
  }

  async function trySwap(r1, c1, r2, c2) {
    if (processing || gameOver) return;
    if (!adjacent(r1, c1, r2, c2)) return;

    if (!swapCreatesMatch(r1, c1, r2, c2)) {
      soundInvalid();
      setMessage("这样交换无法消除，请换一对相邻文物试试。");
      return;
    }

    setMessage("");
    soundSwap();
    setProcessing(true);
    movesLeft -= 1;
    movePointsLeft = MAX_POINTS_PER_MOVE;
    updateHud();
    clearSelection();

    swapCells(board, r1, c1, r2, c2);
    const el1 = boardEl && boardEl.querySelector('.cell[data-r="' + r1 + '"][data-c="' + c1 + '"]');
    const el2 = boardEl && boardEl.querySelector('.cell[data-r="' + r2 + '"][data-c="' + c2 + '"]');
    if (el1) el1.classList.add("swapping");
    if (el2) el2.classList.add("swapping");
    refreshCellTypes();
    await sleep(120);
    if (el1) el1.classList.remove("swapping");
    if (el2) el2.classList.remove("swapping");

    await resolveAllMatches();

    setProcessing(false);
    if (!gameOver && movesLeft > 0 && !hasAnyValidMove()) shuffleBoard();
    await finalizeTurn();
  }

  async function trySwipeEliminate(path) {
    if (processing || gameOver) return;
    if (!path || path.length < 3) return;

    setMessage("");
    setProcessing(true);
    movesLeft -= 1;
    movePointsLeft = MAX_POINTS_PER_MOVE;
    updateHud();
    clearSelection();

    const keysToClear = makeKeySetFromPath(path);
    const swipePts = Math.min(MAX_POINTS_PER_MOVE, path.length + 2);
    const add = Math.min(swipePts, Math.max(0, movePointsLeft));
    movePointsLeft -= add;
    score += add;
    updateHud();
    soundMatch(keysToClear.size);
    flashBoard();
    markMatchedCells(keysToClear);
    await sleep(MATCH_ANIM_MS);

    if (boardEl) {
      boardEl.querySelectorAll(".cell.matched").forEach(function (el) {
        el.classList.remove("matched");
      });
    }

    applyClear(keysToClear);
    keysToClear.forEach(function (k) {
      const parts = k.split(",");
      specialGrid[Number(parts[0])][Number(parts[1])] = SPECIAL_NONE;
    });
    gravityAndRefillWithSpecials(board, specialGrid);
    refreshCellTypes();
    await sleep(CASCADE_PAUSE_MS);

    await resolveAllMatches();
    setProcessing(false);
    if (!gameOver && movesLeft > 0 && !hasAnyValidMove()) shuffleBoard();
    await finalizeTurn();
  }

  function cellFromEventTarget(target) {
    if (!boardEl || !target) return null;
    const t = target.closest && target.closest(".cell");
    if (!t || !(t instanceof HTMLElement) || !boardEl.contains(t)) return null;
    const r = Number(t.dataset.r);
    const c = Number(t.dataset.c);
    if (Number.isNaN(r) || Number.isNaN(c)) return null;
    return { el: t, r: r, c: c };
  }

  function onCellPointerDown(ev) {
    const cell = cellFromEventTarget(ev.target);
    if (!cell || !boardEl) return;
    if (processing || gameOver) return;

    if (hammerMode) {
      useHammerOn(cell.r, cell.c);
      return;
    }

    resumeAudio();
    if (musicEnabled && !musicTimer) startMusic();

    pendingPointerDown = { r: cell.r, c: cell.c };

    // 启动“滑动”：支持两种玩法
    // 1) 经过同种植物的路径长度>=3：松开即消除该路径
    // 2) 沿某个方向滑动超过阈值：立即与该方向相邻格交换（更稳定的上下左右滑动交换）
    swiping = true;
    swipePath = [{ r: cell.r, c: cell.c }];
    swipeType = board[cell.r][cell.c];
    setPathUi(swipePath);
    swipePointerId = typeof ev.pointerId === "number" ? ev.pointerId : null;
    swipeStartX = ev.clientX;
    swipeStartY = ev.clientY;
    didDirectionalSwap = false;
    if (swipePointerId != null && boardEl.setPointerCapture) {
      try {
        boardEl.setPointerCapture(swipePointerId);
      } catch (e) {
        // ignore
      }
    }

    if (!selected) {
      soundSelect();
      selectCell(cell.r, cell.c);
      setMessage("");
      return;
    }

    if (selected.r === cell.r && selected.c === cell.c) {
      clearSelection();
      return;
    }

    if (adjacent(selected.r, selected.c, cell.r, cell.c)) {
      const sr = selected.r;
      const sc = selected.c;
      void trySwap(sr, sc, cell.r, cell.c);
      return;
    }

    soundSelect();
    selectCell(cell.r, cell.c);
  }

  function onBoardPointerMove(ev) {
    if (!swiping || processing || gameOver) return;
    // 若已经触发过方向交换，就不再处理
    if (didDirectionalSwap) return;

    // 用坐标取格子，避免快速滑动时 target 不更新导致的“不完善”
    const el = document.elementFromPoint(ev.clientX, ev.clientY);
    const cell = cellFromEventTarget(el);
    if (!cell) {
      // 仍允许方向交换检测
    }
    if (swipeType == null) return;

    const last = swipePath[swipePath.length - 1];
    if (!last) return;

    // 方向交换：从起点滑动一定距离后，根据 dx/dy 决定交换方向
    const dx = ev.clientX - swipeStartX;
    const dy = ev.clientY - swipeStartY;
    const dist = Math.hypot(dx, dy);
    if (swipePath.length === 1 && dist >= 18) {
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);
      let dr = 0;
      let dc = 0;
      if (absX >= absY) dc = dx > 0 ? 1 : -1;
      else dr = dy > 0 ? 1 : -1;

      const nr = last.r + dr;
      const nc = last.c + dc;
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
        didDirectionalSwap = true;
        // 结束滑动路径 UI，交给交换逻辑处理
        clearSwipePathUi();
        swiping = false;
        swipePath = [];
        swipeType = null;
        pendingPointerDown = null;
        void trySwap(last.r, last.c, nr, nc);
        return;
      }
    }

    // 连线消除：只允许同种植物、且相邻连着走
    if (!cell) return;
    if (board[cell.r][cell.c] !== swipeType) return;
    if (cell.r === last.r && cell.c === last.c) return;
    if (!adjacent(last.r, last.c, cell.r, cell.c)) return;

    // 允许回退：如果滑回到倒数第二个，就 pop
    if (swipePath.length >= 2) {
      const prev = swipePath[swipePath.length - 2];
      if (prev && prev.r === cell.r && prev.c === cell.c) {
        swipePath.pop();
        setPathUi(swipePath);
        return;
      }
    }

    // 不允许重复进入同一格
    for (let i = 0; i < swipePath.length; i++) {
      const p = swipePath[i];
      if (p.r === cell.r && p.c === cell.c) return;
    }

    swipePath.push({ r: cell.r, c: cell.c });
    setPathUi(swipePath);
  }

  function onGlobalPointerUp(ev) {
    const start = pendingPointerDown;
    pendingPointerDown = null;
    if (!start || processing || gameOver) return;

    const endCell = cellFromEventTarget(document.elementFromPoint(ev.clientX, ev.clientY));
    const path = swipePath.slice();
    const usedSwiping = swiping && path.length >= 3;
    resetSwipeState();

    if (usedSwiping) {
      void trySwipeEliminate(path);
      return;
    }

    // 没形成 3+ 连线时，继续沿用“拖到相邻格松开 = 交换”
    if (endCell && (endCell.r !== start.r || endCell.c !== start.c) && adjacent(start.r, start.c, endCell.r, endCell.c)) {
      void trySwap(start.r, start.c, endCell.r, endCell.c);
    }
  }

  /**
   * 进入指定关卡（重置棋盘与本关分数、步数）。
   * @param {number} levelIdx 0-based
   * @param {boolean} [skipStartAd]
   */
  function startLevel(levelIdx, skipStartAd) {
    hideModal();
    const idx = Math.min(Math.max(levelIdx, 0), MAX_LEVEL - 1);
    if (AD_CONFIG.enabled && !skipStartAd) {
      showForcedAd("level_start", function () {
        applyLevelState(idx);
      });
      return;
    }
    applyLevelState(idx);
  }

  function beginLevelPlay() {
    runStoryBeforeLevel(currentLevelIndex, function () {
      showLevelGoals(function () {
        if (!hasAnyValidMove()) shuffleBoard();
      });
    });
  }

  function applyLevelState(levelIdx) {
    currentLevelIndex = levelIdx;
    applyWorldTheme(levelIdx);
    showScreen("play");
    const spec = getLevelSpec(levelIdx);
    levelTarget = spec.target;
    movesLeft = spec.moves;
    levelMovesTotal = spec.moves;
    score = 0;
    board = fillNoMatches();
    specialGrid = emptySpecialGrid();
    initIceForLevel(levelIdx);
    resetBoosters();
    gameOver = false;
    selected = null;
    processing = false;
    pendingPointerDown = null;
    cascadeStep = 0;
    setMessage("");
    setLevelActionButtons(false, false);
    updateHud();
    renderCells();
    if (boardEl) boardEl.classList.remove("processing");
    beginLevelPlay();
  }

  function resetCampaign() {
    soundRestart();
    revenueSession = 0;
    if (adminPanelModalEl && !adminPanelModalEl.hidden) updateAdminPanel();
    maxUnlockedLevel = 0;
    saveProgress();
    showHome();
  }

  if (boardEl) {
    boardEl.addEventListener("pointerdown", onCellPointerDown);
    boardEl.addEventListener("pointermove", onBoardPointerMove);
  }
  window.addEventListener("pointerup", onGlobalPointerUp);
  if (restartBtn) {
    restartBtn.addEventListener("click", function () {
      resetCampaign();
    });
  }
  if (nextLevelBtn) {
    nextLevelBtn.addEventListener("click", function () {
      resumeAudio();
      soundSwap();
      startLevel(currentLevelIndex + 1);
    });
  }
  if (retryLevelBtn) {
    retryLevelBtn.addEventListener("click", function () {
      resumeAudio();
      startLevel(currentLevelIndex);
    });
  }
  if (modalNextBtn) {
    modalNextBtn.addEventListener("click", function () {
      resumeAudio();
      soundSwap();
      startLevel(currentLevelIndex + 1);
    });
  }
  if (modalPrevBtn) {
    modalPrevBtn.addEventListener("click", function () {
      resumeAudio();
      soundSwap();
      startLevel(Math.max(0, currentLevelIndex - 1));
    });
  }
  if (modalRetryBtn) {
    modalRetryBtn.addEventListener("click", function () {
      resumeAudio();
      soundSwap();
      startLevel(currentLevelIndex);
    });
  }
  if (modalRestartBtn) {
    modalRestartBtn.addEventListener("click", function () {
      resetCampaign();
    });
  }
  if (modalEl) {
    modalEl.addEventListener("click", function (ev) {
      const t = ev.target;
      if (t && t instanceof HTMLElement && t.dataset && t.dataset.modalClose) {
        hideModal();
      }
    });
    window.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && !modalEl.hidden) hideModal();
    });
  }

  if (musicToggleBtn) {
    musicToggleBtn.addEventListener("click", function () {
      resumeAudio();
      setMusicEnabled(!musicEnabled);
    });
  }
  updateMusicButtons();

  if (rulesOpenBtn) {
    rulesOpenBtn.addEventListener("click", function () {
      if (!rulesModalEl) return;
      if (rulesContentEl) rulesContentEl.innerHTML = buildRulesHtml();
      rulesModalEl.hidden = false;
    });
  }
  if (rulesModalEl) {
    rulesModalEl.addEventListener("click", function (ev) {
      const t = ev.target;
      if (t && t instanceof HTMLElement && t.dataset && t.dataset.rulesClose) {
        rulesModalEl.hidden = true;
      }
    });
    window.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && !rulesModalEl.hidden) rulesModalEl.hidden = true;
    });
  }

  if (adContinueBtn) {
    adContinueBtn.addEventListener("click", function () {
      if (adContinueBtn.disabled) return;
      finishAdAndContinue();
    });
  }
  if (adVisitBtn) {
    adVisitBtn.addEventListener("click", function () {
      onAdVisitClick();
    });
  }
  if (adModalEl) {
    adModalEl.addEventListener("click", onAdBackdropClick);
  }

  if (gameTitleEl) {
    gameTitleEl.addEventListener("click", onAdminTitleTap);
  }
  if (adminGateSubmitBtn) {
    adminGateSubmitBtn.addEventListener("click", tryAdminLogin);
  }
  if (adminPassInputEl) {
    adminPassInputEl.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter") tryAdminLogin();
    });
  }
  if (adminGateModalEl) {
    adminGateModalEl.addEventListener("click", function (ev) {
      const t = ev.target;
      if (t && t instanceof HTMLElement && t.dataset && t.dataset.adminGateClose) hideAdminGate();
    });
  }
  if (adminPanelModalEl) {
    adminPanelModalEl.addEventListener("click", function (ev) {
      const t = ev.target;
      if (t && t instanceof HTMLElement && t.dataset && t.dataset.adminPanelClose) hideAdminPanel();
    });
  }
  if (adminWithdrawAllBtn) {
    adminWithdrawAllBtn.addEventListener("click", function () {
      withdrawRevenue(getRevenueBalance());
    });
  }
  if (adminWithdrawSubmitBtn) {
    adminWithdrawSubmitBtn.addEventListener("click", function () {
      const raw = adminWithdrawInputEl ? adminWithdrawInputEl.value : "";
      withdrawRevenue(parseFloat(raw) || 0);
    });
  }

  function shuffleBoardFree() {
    shuffleBoard();
    setMessage("🔀 棋盘已重排");
  }

  if (homeContinueBtn) {
    homeContinueBtn.addEventListener("click", function () {
      mapActiveChapter = getChapterForLevel(maxUnlockedLevel);
      updateHomeStats();
      showMapPhase("route");
      renderStoryRoute(mapActiveChapter);
      showScreen("map");
    });
  }
  if (homeMapBtn) {
    homeMapBtn.addEventListener("click", showMap);
  }
  if (homeCodexBtn) {
    homeCodexBtn.addEventListener("click", openCodexModal);
  }
  if (codexModalEl) {
    codexModalEl.addEventListener("click", function (ev) {
      const t = ev.target;
      if (t && t.getAttribute && t.getAttribute("data-codex-close")) closeCodexModal();
    });
  }
  if (mapBackHomeBtn) {
    mapBackHomeBtn.addEventListener("click", showHome);
  }
  if (playBackMapBtn) {
    playBackMapBtn.addEventListener("click", function () {
      if (processing) return;
      mapActiveChapter = getChapterForLevel(currentLevelIndex);
      updateHomeStats();
      showMapPhase("route");
      renderStoryRoute(mapActiveChapter);
      showScreen("map");
    });
  }
  if (modalMapBtn) {
    modalMapBtn.addEventListener("click", function () {
      hideModal();
      mapActiveChapter = getChapterForLevel(currentLevelIndex);
      updateHomeStats();
      showMapPhase("route");
      renderStoryRoute(mapActiveChapter);
      showScreen("map");
    });
  }
  if (mapBackWorldBtn) {
    mapBackWorldBtn.addEventListener("click", function () {
      clearVnTyping();
      showMapPhase("world");
      renderWorldMap();
    });
  }
  if (mapReplayStoryBtn) {
    mapReplayStoryBtn.addEventListener("click", function () {
      enterChapterExpedition(mapActiveChapter);
    });
  }
  if (vnBriefingNextBtn) {
    vnBriefingNextBtn.addEventListener("click", advanceVnLine);
  }
  if (vnAssemblyNextBtn) {
    vnAssemblyNextBtn.addEventListener("click", advanceVnLine);
  }
  if (vnBriefingSkipBtn) {
    vnBriefingSkipBtn.addEventListener("click", function () {
      const narr = getMapChapterNarrative(mapActiveChapter);
      skipVnSequence(function () {
        showMapPhase("assembly");
        startVnSequence(
          "assembly",
          narr && narr.assembly ? narr.assembly : [],
          narr && narr.assemblyTitle ? narr.assemblyTitle : "小队集合",
          function () {
            showMapPhase("route");
            renderStoryRoute(mapActiveChapter);
          }
        );
      });
    });
  }
  if (vnAssemblySkipBtn) {
    vnAssemblySkipBtn.addEventListener("click", function () {
      skipVnSequence(function () {
        showMapPhase("route");
        renderStoryRoute(mapActiveChapter);
      });
    });
  }
  if (boosterHammerBtn) {
    boosterHammerBtn.addEventListener("click", function () {
      if (hammerLeft <= 0 || processing || gameOver) return;
      hammerMode = !hammerMode;
      updateBoosterUi();
      setMessage(hammerMode ? "⛏ 点选一格清理" : "");
    });
  }
  if (boosterShuffleBtn) {
    boosterShuffleBtn.addEventListener("click", function () {
      if (shuffleLeft <= 0 || processing || gameOver) return;
      shuffleLeft -= 1;
      updateBoosterUi();
      shuffleBoardFree();
    });
  }
  if (boosterHintBtn) {
    boosterHintBtn.addEventListener("click", showHint);
  }

  loadAdStats();
  loadLevelStars();
  syncStoryTheme();
  loadStorySeen();
  loadCodexState();
  loadExpeditionState();
  syncBeatenFromProgress();
  initEvolution();
  loadProgress();

  showHome();
})();
