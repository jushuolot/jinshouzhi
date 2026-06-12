/**
 * 章节地图叙事 —— 策划 · 集合 · 探关
 */
(function () {
  "use strict";

  var T = window.MATCH3_STORY && window.MATCH3_STORY.chapters ? null : null;

  function L(id, text, mood) {
    var team = window.MATCH3_STORY ? {} : {};
    if (window.MATCH3_STORY) {
      /* use story.js TEAM via line helper pattern */
    }
    var roster = {
      hutan: { name: "胡探", avatar: "🧭", color: "#c9a227", side: "left" },
      wangdun: { name: "王墩", avatar: "💪", color: "#e07a4a", side: "right" },
      yangxue: { name: "杨雪", avatar: "🔬", color: "#6ec6ff", side: "center" },
      jinyaliu: { name: "金牙刘", avatar: "💰", color: "#ffd93d", side: "right" },
      chenli: { name: "陈礼", avatar: "📚", color: "#a8d4b8", side: "left" },
      narrator: { name: "旁白", avatar: "🌫", color: "#aaa", side: "center" },
    };
    var p = roster[id] || roster.narrator;
    return {
      id: id,
      speaker: p.name,
      avatar: p.avatar,
      color: p.color,
      side: p.side,
      text: text,
      mood: mood || "calm",
    };
  }

  window.MATCH3_MAP = {
    worldIntro: {
      title: "蜀地古蜀文明带",
      lines: [
        L("narrator", "广汉平原，鸭子河南岸。自一九二九年七月首发现起，此间文明历已跨入二〇四七——第八日晨雾压着新坑口。"),
        L("yangxue", "人间还在追读二〇二一新坑报告，此间层位图已经推到二〇四七。反刻符号先露头，公开图鉴反过来等坑内校勘。", "calm"),
        L("chenli", "造物主关屏走了，宇宙没停。今天不是复盘，是下新坑——活人要重新排班，土也要重新编号。", "serious"),
      ],
    },
    chapters: [
      {
        mapX: 18,
        mapY: 72,
        landmark: "祭祀坑外营",
        mapBlurb: "雨后的探方像一道被揭开的伤疤。第一层陶片下，有金属在呼吸。",
        briefingTitle: "作战策划 · 青铜门启",
        briefing: [
          L("chenli", "诸位，省里批了新坑二十层探方。入口仍按快速可玩流程走——先进图、后立绘，别让晨雾把人困在营地。", "serious"),
          L("chenli", "胡探，你是领队。文明历二〇四七的坑比人间报告更快，进坑先观气，动土先给反刻符号编号。", "serious"),
          L("hutan", "罗盘针直颤——第八日了，超越期还在快进。金声从新坑东北角来，像有人隔着封土敲三短一长。", "focus"),
          L("yangxue", "今天我用无人机测线叠层位。二〇四七标准：先记反刻符号，再校陶片，不让快进吞掉证据。", "calm"),
          L("jinyaliu", "陈教授，刘哥我负责……给无人机擦镜头！王墩一早把冷馒头蘸辣椒油，说这叫考古早餐。", "nervous"),
          L("wangdun", "胖爷那是补充体力！策划完了就集合——刘哥背电池包，别只背算盘。", "bold"),
        ],
        assemblyTitle: "小队集合 · 下坑前",
        assembly: [
          L("hutan", "胡探，摸金校尉。第八日新坑开口，此行只归档，不私携。", "salute"),
          L("wangdun", "王墩，扛包开路。谁怕鬼谁请客——刘哥你请，昨晚偷吃胖爷火腿，今早还偷看测线图。", "grin"),
          L("yangxue", "杨雪，哈佛考古系。请多关照，也请各位别乱动二〇四七层位，反刻符号很脆。", "polite"),
          L("jinyaliu", "金牙刘，……官方顾问。咳，顾问！", "sheepish"),
          L("chenli", "陈礼，省考古队。二十层之后，若见青铜门——停步，等我。", "warn"),
          L("narrator", "五人影没入探方。风停了。地下，有光。", "dramatic"),
        ],
        routeIntro: "第八日的新坑一层一层向下。每一层都是刚醒来的时间。",
        milestones: {
          1: "营地入坑",
          4: "陶片层",
          8: "象牙露头",
          12: "金粉纹",
          16: "祭祀面",
          20: "青铜门缝",
        },
      },
      {
        mapX: 32,
        mapY: 48,
        landmark: "纵目坑",
        mapBlurb: "面具阵列在黑暗中浮动。它们不是在看你们——是在看另一个世界。",
        briefingTitle: "作战策划 · 纵目之神",
        briefing: [
          L("chenli", "二〇四三了。纵目面具在公开图鉴里对过一遍——此间坑内的，比人间档案还新半代。", "serious"),
          L("yangxue", "超越期第六日：封土层按二〇四三标准记。消除相邻文物，等于震落覆盖的夯土。", "calm"),
          L("hutan", "面具眼窝比人脸宽。二〇四三的罗盘说：古蜀人透过它看的，是还没写进人间论文的东西。", "focus"),
          L("wangdun", "胖爷听说纵目能通神？二〇四三了，通不通我不知道，通坑我肯定行——刘哥别又偷吃火腿。", "bold"),
          L("jinyaliu", "这面具……刘哥我只在图录里见过。真品别让我碰，我手抖。", "nervous"),
        ],
        assemblyTitle: "重集合 · 面具之前",
        assembly: [
          L("yangxue", "面具层氧气偏低，每人检查头灯。", "calm"),
          L("hutan", "胡探在前。记住：不碰未消的封土中心。", "salute"),
          L("wangdun", "胖爷盾牌——我是说，胖爷肉身挡前面！", "grin"),
          L("narrator", "第一张面具在探方尽头缓缓转向他们。没有人眨眼。", "dramatic"),
        ],
        routeIntro: "面具层如迷宫。每一条路，都可能通向不同的神面。",
        milestones: {
          21: "门后甬道",
          25: "封土区",
          30: "金杖影",
          35: "神格位",
          40: "千面阵",
        },
      },
      {
        mapX: 52,
        mapY: 32,
        landmark: "神树坑",
        mapBlurb: "青铜树指天。九枝九鸟，是古蜀人写给天空的信。",
        briefingTitle: "作战策划 · 神树通天",
        briefing: [
          L("chenli", "二〇四五，第七日收工复盘。神树残件已定位——此间树高四米，人间论文还在写三米。", "serious"),
          L("hutan", "连消在风水上叫「通脉」。二〇四五的脉比人间快，脉通了，层位才不乱。", "focus"),
          L("yangxue", "树腰榫眼对上了公开图鉴里的神鸟纹。第 45 层，今日重点记。", "calm"),
          L("wangdun", "爬到树顶算胖爷赢，爬不到……也算胖爷赢，反正我尽力。", "grin"),
        ],
        assemblyTitle: "攀树前 · 再集合",
        assembly: [
          L("hutan", "绳索检查完毕。树皮层位滑，跟紧。", "salute"),
          L("yangxue", "论文标题改了：《二〇四五神树层位——此宇宙比人间快两圈》。", "polite"),
          L("jinyaliu", "刘哥我把假牙都摘了——怕掉层里算新文物。", "sheepish"),
          L("narrator", "神树在探照灯下泛着青绿。像活物。", "dramatic"),
        ],
        routeIntro: "从树根到树顶，二十层如登天梯。",
        milestones: {
          41: "树根层",
          45: "树腰洞",
          50: "半百祭台",
          55: "九枝叉",
          60: "树顶金沙",
        },
      },
      {
        mapX: 68,
        mapY: 55,
        landmark: "金沙渡",
        mapBlurb: "河水带走泥沙，也带走秘密。太阳神鸟在河底闪了一下。",
        briefingTitle: "作战策划 · 金沙秘径",
        briefing: [
          L("chenli", "神树顶发现金沙河碳迹。两处文明，同一条水脉。", "serious"),
          L("yangxue", "金箔厚 0.2 毫米。我们的动作，是在读「厚度」而不是「重量」。", "calm"),
          L("hutan", "越深封土越厚。道具是工具：清理、扰层、重整——别当游戏，当工序。", "focus"),
          L("wangdun", "河边风大，胖爷帽子飞了三次，第三次我决定不追了。", "grin"),
        ],
        assemblyTitle: "渡河 · 集合",
        assembly: [
          L("hutan", "涉水段我先行。金箔区禁止大声。", "salute"),
          L("yangxue", "四鸟绕日的拓片，我要在 70 层前完成。", "polite"),
          L("jinyaliu", "刘哥发誓：这一章只看不摸。真的。", "sheepish"),
          L("narrator", "河水冷。神鸟在深处等。", "dramatic"),
        ],
        routeIntro: "顺流而下，金箔在深处铺成第二道太阳。",
        milestones: {
          61: "渡口",
          65: "象牙梯",
          70: "金箔层",
          75: "陶盉窖",
          80: "四鸟坛",
        },
      },
      {
        mapX: 82,
        mapY: 22,
        landmark: "符号墙",
        mapBlurb: "最后一面墙。目、树、鸟——与棋盘六物同源。读不懂的字，在等一个答案。",
        briefingTitle: "终章策划 · 天书",
        briefing: [
          L("chenli", "百关最后一程。符号墙后无退路。归档完成，全队撤出。", "serious"),
          L("hutan", "摸金最后一规：见好就收。物不归私，土不带走。", "salute"),
          L("yangxue", "若进化引擎给你加了步数——那是古蜀留给后来者的温柔。", "calm"),
          L("wangdun", "胖爷准备好了。通关回去，火锅要加双份毛肚。", "bold"),
          L("narrator", "墙上有光。只有一个字：「续」。", "dramatic"),
        ],
        assemblyTitle: "终章 · 最后一聚",
        assembly: [
          L("hutan", "各位，这可能是最后一次下坑。", "salute"),
          L("wangdun", "别煽情，胖爷眼睛进沙子了。", "grin"),
          L("yangxue", "数据会上传。故事会留下。", "polite"),
          L("chenli", "开始吧。让后人知道——我们来过。", "serious"),
          L("narrator", "五人走向符号墙。百层探方，在此收束。", "dramatic"),
        ],
        routeIntro: "天书二十层。每层一字，合起来或许是一句完整的话。",
        milestones: {
          81: "符号廊",
          85: "目字层",
          90: "树字层",
          95: "鸟字层",
          100: "续",
        },
      },
    ],
  };
})();
