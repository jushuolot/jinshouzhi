/**
 * 广告结算接收服务（本地演示用）
 *
 * 启动：node server.js
 * 默认：http://localhost:3920
 *   POST /settle  — 游戏每次展示/点击会 POST JSON（仅入账事件，无 withdraw）
 *   GET  /stats   — 查看累计笔数与金额
 *   GET  /log     — 最近 50 条原始记录
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT) || 3920;
const LOG_FILE = path.join(__dirname, "settlements.jsonl");

function readLines() {
  if (!fs.existsSync(LOG_FILE)) return [];
  return fs
    .readFileSync(LOG_FILE, "utf8")
    .split("\n")
    .filter(Boolean)
    .map(function (line) {
      try {
        return JSON.parse(line);
      } catch (e) {
        return null;
      }
    })
    .filter(Boolean);
}

function appendRecord(record) {
  fs.appendFileSync(LOG_FILE, JSON.stringify(record) + "\n", "utf8");
}

function sendJson(res, status, data) {
  const body = JSON.stringify(data, null, 2);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(body);
}

function summarize(records) {
  let totalAmount = 0;
  const byType = { impression: 0, click: 0 };
  const bySlot = {};
  records.forEach(function (r) {
    const amt = Math.max(0, Number(r.amount) || 0);
    totalAmount += amt;
    if (r.type) byType[r.type] = (byType[r.type] || 0) + 1;
    if (r.slot) bySlot[r.slot] = (bySlot[r.slot] || 0) + 1;
  });
  return {
    count: records.length,
    totalAmount: Math.round(totalAmount * 1000) / 1000,
    byType: byType,
    bySlot: bySlot,
  };
}

const server = http.createServer(function (req, res) {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    res.end();
    return;
  }

  const url = new URL(req.url, "http://localhost");

  if (req.method === "GET" && url.pathname === "/stats") {
    sendJson(res, 200, summarize(readLines()));
    return;
  }

  if (req.method === "GET" && url.pathname === "/log") {
    const all = readLines();
    sendJson(res, 200, { records: all.slice(-50) });
    return;
  }

  if (req.method === "POST" && url.pathname === "/settle") {
    let body = "";
    req.on("data", function (chunk) {
      body += chunk;
    });
    req.on("end", function () {
      let payload;
      try {
        payload = JSON.parse(body || "{}");
      } catch (e) {
        sendJson(res, 400, { ok: false, error: "invalid json" });
        return;
      }
      if (payload.type === "withdraw") {
        sendJson(res, 403, {
          ok: false,
          error: "withdraw forbidden by virtual account policy",
        });
        return;
      }
      const amount = Number(payload.amount);
      if (!(amount > 0)) {
        sendJson(res, 400, {
          ok: false,
          error: "credit amount must be positive",
        });
        return;
      }
      const record = Object.assign({ receivedAt: new Date().toISOString() }, payload);
      appendRecord(record);
      console.log(
        "[settle]",
        record.type,
        record.slot,
        "+" + record.amount,
        "level",
        record.level
      );
      sendJson(res, 200, { ok: true });
    });
    return;
  }

  sendJson(res, 404, {
    ok: false,
    hint: "Use POST /settle, GET /stats, GET /log",
  });
});

server.listen(PORT, function () {
  console.log("Match3 ad settlement server: http://localhost:" + PORT);
  console.log("  POST /settle");
  console.log("  GET  /stats");
  console.log("  GET  /log");
  console.log("Log file:", LOG_FILE);
});
