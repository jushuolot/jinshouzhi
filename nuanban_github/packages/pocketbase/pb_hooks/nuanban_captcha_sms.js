/// 自建短信验证码 + 人工图画点选（无第三方短信平台）
/// 验证码在服务器生成、校验；发件记录供运营人工核对。

var nb = require(__hooks + "/nuanban_lib.js");

var CAPTCHA_STORE = {};
var CAPTCHA_TOKEN_STORE = {};
var SMS_OTP_STORE = {};
var SMS_OUTBOX = [];
var SMS_DELIVERY_STORE = {};

var DEMO_MASTER_CODE = "000000";

var CAPTCHA_TOPICS = [
  { label: "动物", pool: ["🐱", "🐶", "🐰", "🐻", "🦁", "🐼", "🐮", "🐷"] },
  { label: "水果", pool: ["🍎", "🍌", "🍇", "🍉", "🍓", "🍑", "🍊", "🥝"] },
  { label: "交通工具", pool: ["🚗", "🚌", "✈️", "🚲", "🚢", "🚆", "🛵", "🚕"] },
  { label: "食物", pool: ["🍜", "🍚", "🥟", "🍞", "🥗", "🍕", "🌮", "🍲"] },
];

function nowMs() {
  return Date.now();
}

function randInt(max) {
  return Math.floor(Math.random() * max);
}

function shuffle(arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = randInt(i + 1);
    var t = a[i];
    a[i] = a[j];
    a[j] = t;
  }
  return a;
}

function pickMany(pool, n) {
  return shuffle(pool).slice(0, n);
}

function normalizePhone(phone) {
  return String(phone || "").replace(/\D/g, "");
}

function captchaPrune() {
  var t = nowMs();
  var keys = Object.keys(CAPTCHA_STORE);
  for (var i = 0; i < keys.length; i++) {
    if (CAPTCHA_STORE[keys[i]].expiresAt < t) delete CAPTCHA_STORE[keys[i]];
  }
  keys = Object.keys(CAPTCHA_TOKEN_STORE);
  for (var j = 0; j < keys.length; j++) {
    if (CAPTCHA_TOKEN_STORE[keys[j]].expiresAt < t) delete CAPTCHA_TOKEN_STORE[keys[j]];
  }
}

function captchaCreateChallenge() {
  captchaPrune();
  var topic = CAPTCHA_TOPICS[randInt(CAPTCHA_TOPICS.length)];
  var otherPools = [];
  for (var i = 0; i < CAPTCHA_TOPICS.length; i++) {
    if (CAPTCHA_TOPICS[i].label !== topic.label) {
      otherPools = otherPools.concat(CAPTCHA_TOPICS[i].pool);
    }
  }
  var correctCount = 3 + randInt(2);
  var wrongCount = 9 - correctCount;
  var correctEmojis = pickMany(topic.pool, correctCount);
  var wrongEmojis = pickMany(otherPools, wrongCount);
  var tiles = [];
  var correctIds = [];
  var idx = 0;
  for (var c = 0; c < correctEmojis.length; c++) {
    var id = "t" + idx;
    tiles.push({ id: id, emoji: correctEmojis[c] });
    correctIds.push(id);
    idx++;
  }
  for (var w = 0; w < wrongEmojis.length; w++) {
    tiles.push({ id: "t" + idx, emoji: wrongEmojis[w] });
    idx++;
  }
  tiles = shuffle(tiles);
  var challengeId = "cap_" + nowMs() + "_" + randInt(100000);
  CAPTCHA_STORE[challengeId] = {
    correctIds: correctIds.sort().join(","),
    expiresAt: nowMs() + 5 * 60 * 1000,
    used: false,
  };
  return {
    challengeId: challengeId,
    prompt: "请点选所有【" + topic.label + "】图案",
    tiles: tiles,
    expiresIn: 300,
  };
}

function captchaVerifyChallenge(challengeId, selectedIds) {
  captchaPrune();
  var ch = CAPTCHA_STORE[challengeId];
  if (!ch || ch.used || ch.expiresAt < nowMs()) {
    return { ok: false, message: "安全验证已过期，请刷新" };
  }
  if (!selectedIds || !selectedIds.length) {
    return { ok: false, message: "请点选图案" };
  }
  var picked = selectedIds.slice().sort().join(",");
  if (picked !== ch.correctIds) {
    return { ok: false, message: "点选不正确，请重试" };
  }
  ch.used = true;
  var token = "cpt_" + nowMs() + "_" + randInt(1000000);
  CAPTCHA_TOKEN_STORE[token] = {
    expiresAt: nowMs() + 5 * 60 * 1000,
    used: false,
  };
  return { ok: true, captchaToken: token, expiresIn: 300 };
}

function smsExposeCodeToClient(e) {
  if (nb.isFormalAuthMode()) return false;
  try {
    var origin = "";
    var hdr = e.request.header.get("Origin") || e.request.header.get("origin") || "";
    var referer = e.request.header.get("Referer") || e.request.header.get("referer") || "";
    origin = hdr || referer || "";
    if (origin.indexOf("localhost") >= 0 || origin.indexOf("127.0.0.1") >= 0) return true;
  } catch (_) {}
  return false;
}

function smsPrune() {
  var t = nowMs();
  var phones = Object.keys(SMS_OTP_STORE);
  for (var i = 0; i < phones.length; i++) {
    if (SMS_OTP_STORE[phones[i]].expiresAt < t) delete SMS_OTP_STORE[phones[i]];
  }
  var dkeys = Object.keys(SMS_DELIVERY_STORE);
  for (var j = 0; j < dkeys.length; j++) {
    if (SMS_DELIVERY_STORE[dkeys[j]].expiresAt < t) delete SMS_DELIVERY_STORE[dkeys[j]];
  }
}

function smsCreateDelivery(phone, code) {
  var deliveryId = "dlv_" + nowMs() + "_" + randInt(1000000);
  SMS_DELIVERY_STORE[deliveryId] = {
    phone: phone,
    code: code,
    expiresAt: nowMs() + 5 * 60 * 1000,
    consumed: false,
  };
  return deliveryId;
}

function smsPollDelivery(phone, deliveryId) {
  smsPrune();
  phone = normalizePhone(phone);
  deliveryId = String(deliveryId || "");
  if (!deliveryId) return { ok: false, message: "缺少投递凭证" };
  var row = SMS_DELIVERY_STORE[deliveryId];
  if (!row || row.expiresAt < nowMs()) {
    return { ok: false, ready: false, message: "验证码投递已过期，请重新获取" };
  }
  if (row.phone !== phone) {
    return { ok: false, message: "手机号与投递记录不匹配" };
  }
  if (row.consumed) {
    return { ok: true, ready: false };
  }
  row.consumed = true;
  return { ok: true, ready: true, code: row.code };
}

function smsConsumeCaptchaToken(captchaToken) {
  captchaPrune();
  var row = CAPTCHA_TOKEN_STORE[captchaToken];
  if (!row || row.used || row.expiresAt < nowMs()) return false;
  row.used = true;
  return true;
}

function smsGenerateCode() {
  var n = randInt(1000000);
  var s = String(1000000 + n).slice(-6);
  return s;
}

function smsPushOutbox(phone, code) {
  SMS_OUTBOX.unshift({
    phone: phone,
    code: code,
    sentAt: new Date().toISOString(),
    channel: "self-hosted",
  });
  if (SMS_OUTBOX.length > 40) SMS_OUTBOX.length = 40;
}

function smsSendCode(phone, captchaToken, e) {
  smsPrune();
  phone = normalizePhone(phone);
  if (phone.length !== 11) {
    return { ok: false, message: "请输入 11 位手机号" };
  }
  if (!smsConsumeCaptchaToken(captchaToken)) {
    return { ok: false, message: "请先完成安全验证" };
  }
  var prev = SMS_OTP_STORE[phone];
  if (prev && prev.sentAt && nowMs() - prev.sentAt < 60 * 1000) {
    return { ok: false, message: "发送过于频繁，请稍后再试" };
  }
  var code = smsGenerateCode();
  SMS_OTP_STORE[phone] = {
    code: code,
    expiresAt: nowMs() + 5 * 60 * 1000,
    sentAt: nowMs(),
    attempts: 0,
  };
  smsPushOutbox(phone, code);
  var deliveryId = smsCreateDelivery(phone, code);
  var resp = {
    ok: true,
    message: "验证码已通过平台自建通道发出",
    expiresIn: 300,
    deliveryId: deliveryId,
  };
  if (smsExposeCodeToClient(e)) {
    resp.devCode = code;
    resp.devHint = "开发环境可直接使用上方验证码";
  }
  return resp;
}

function smsVerifyCode(phone, code) {
  smsPrune();
  phone = normalizePhone(phone);
  code = String(code || "").trim();
  if (!code || code.length !== 6) return false;
  if (!nb.isFormalAuthMode() && code === DEMO_MASTER_CODE) return true;
  var row = SMS_OTP_STORE[phone];
  if (!row || row.expiresAt < nowMs()) return false;
  row.attempts = (row.attempts || 0) + 1;
  if (row.attempts > 8) {
    delete SMS_OTP_STORE[phone];
    return false;
  }
  if (row.code !== code) return false;
  delete SMS_OTP_STORE[phone];
  return true;
}

function smsOutboxList() {
  return SMS_OUTBOX.slice(0, 30);
}

function wipeSmsCaptchaMemory() {
  clearSmsStore(CAPTCHA_STORE);
  clearSmsStore(CAPTCHA_TOKEN_STORE);
  clearSmsStore(SMS_OTP_STORE);
  clearSmsStore(SMS_DELIVERY_STORE);
  SMS_OUTBOX.length = 0;
}

function clearSmsStore(obj) {
  var keys = Object.keys(obj);
  for (var i = 0; i < keys.length; i++) delete obj[keys[i]];
}

module.exports = {
  captchaCreateChallenge: captchaCreateChallenge,
  captchaVerifyChallenge: captchaVerifyChallenge,
  smsSendCode: smsSendCode,
  smsVerifyCode: smsVerifyCode,
  smsPollDelivery: smsPollDelivery,
  smsOutboxList: smsOutboxList,
  wipeSmsCaptchaMemory: wipeSmsCaptchaMemory,
  DEMO_MASTER_CODE: DEMO_MASTER_CODE,
};
