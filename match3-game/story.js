/**
 * 古蜀秘档 · 三星堆考古闯关叙事
 * 人物气质参考《鬼吹灯》摸金小队（原创化名，非官方联动）
 */
(function () {
  "use strict";

  var TEAM = {
    hutan: { id: "hutan", name: "胡探", role: "摸金校尉", avatar: "🧭", color: "#c9a227" },
    wangdun: { id: "wangdun", name: "王墩", role: "力士兼炊事", avatar: "💪", color: "#e07a4a" },
    yangxue: { id: "yangxue", name: "杨雪", role: "美籍华裔考古学家", avatar: "🔬", color: "#6ec6ff" },
    jinyaliu: { id: "jinyaliu", name: "金牙刘", role: "古玩掮客", avatar: "💰", color: "#ffd93d" },
    chenli: { id: "chenli", name: "陈礼", role: "蜀地考古权威", avatar: "📚", color: "#a8d4b8" },
  };

  function line(speakerId, text) {
    var p = TEAM[speakerId] || { name: "旁白", avatar: "📜", color: "#ccc" };
    return { speaker: p.name, avatar: p.avatar, color: p.color, text: text };
  }

  window.MATCH3_STORY = {
    title: "古蜀秘档",
    subtitle: "三星堆考古 · 百关闯关",
    tagline: "100 关 · 五章秘史 · 文物消消 · 自主进化",
    relics: ["纵目面具", "金杖", "玉璋", "陶盉", "象牙饰", "神鸟"],
    relicIcons: ["🎭", "🪄", "📜", "🏺", "🦷", "🦅"],
    chapters: [
      {
        id: 0,
        name: "青铜门启",
        icon: "🚪",
        theme: "world-1",
        iceFrom: 999,
        subtitle: "祭祀坑外围 · 陶片与封土",
        prologue: {
          title: "第一章 · 青铜门启",
          lines: [
            line("chenli", "胡探，文明历二〇四七——超越期第八日。昨夜周复盘刚封箱，今晨新坑反刻符号露头，此间又比人间多走两年。"),
            line("hutan", "罗盘偏南三度半，新坑口像刚喘过气。地下有金声，不是凶，是古蜀人在催我们把今天的层位记清。"),
            line("wangdun", "胖爷冷馒头还没咽完，铲子已经醒了！先消表层陶片——金牙刘，你手伸慢点，监控无人机在头顶呢！"),
            line("yangxue", "二〇四七的规矩：无人机测线叠层位，消除同类文物等于完成记录。四连出条纹圣物，五连是爆破符印，别把快进当儿戏。"),
          ],
        },
        epilogue: {
          title: "第一章 完 · 门缝里的光",
          lines: [
            line("yangxue", "层位图对上了！祭祀坑底部有一道青铜门缝，缝里有磷光——像眼睛在眨。"),
            line("jinyaliu", "这门要是能开，胖爷下半辈子就不用倒腾假古董了……"),
            line("hutan", "门后才是纵目之神。休整一夜，明天进第二章。"),
          ],
        },
        beats: {
          1: [line("hutan", "第 1 探方：新坑晨雾没散，先清表层陶盉碎片，让二〇四七的测线露出可交换层。")],
          5: [line("wangdun", "五层了！地下金属回响像敲早饭盆，胖爷保证只敲土，不敲文物。")],
          10: [line("yangxue", "十层记录完成。陶片下出现象牙饰——古蜀人爱用象牙礼器，别漏消。")],
          15: [line("jinyaliu", "十五层有金粉！刘哥我发誓只看一眼……王墩你把锅挪远点，油烟熏文物！")],
          20: [line("chenli", "二十层探方闭合。青铜门已定位，下一章直面纵目之神。")],
        },
      },
      {
        id: 1,
        name: "纵目之神",
        icon: "👁",
        theme: "world-2",
        iceFrom: 20,
        subtitle: "青铜面具层 · 封土障碍出现",
        prologue: {
          title: "第二章 · 纵目之神",
          lines: [
            line("hutan", "门开了。第一张纵目青铜面具悬在半空，眼窝比人脸还宽——古蜀人看见的，也许不是人间。"),
            line("yangxue", "文明历二〇四五，第七日复盘。金面数据早对齐人间二〇二一——封土层照旧，消相邻文物震碎夯土。"),
            line("wangdun", "面具看胖爷我看面具——金牙刘你别在后面估价，估价另算工钱！"),
          ],
        },
        epilogue: {
          title: "第二章 完 · 千面一神",
          lines: [
            line("yangxue", "面具阵列拼合了——它们不是多神，是一神千面。"),
            line("hutan", "神树的方向在西北。王墩，背好绳索，我们要往上爬了。"),
          ],
        },
        beats: {
          21: [line("yangxue", "纵目面具层开启。优先消除面具组，记录神格序列。")],
          25: [line("wangdun", "封土真硬！胖爷锤子道具都省着点用。")],
          30: [line("jinyaliu", "这金杖纹路……我在黑市见过类似的，开价八位数。")],
          35: [line("hutan", "别碰未消的封土中心——风水上叫「墓心煞」，会乱棋盘。")],
          40: [line("chenli", "四十层：纵目阵列归档完毕。神树探方入口已暴露。")],
        },
      },
      {
        id: 2,
        name: "神树通天",
        icon: "🌳",
        theme: "world-3",
        iceFrom: 40,
        subtitle: "青铜神树 · 通天礼器",
        prologue: {
          title: "第三章 · 神树通天",
          lines: [
            line("chenli", "文明历复兴期，神树层位自己往上升——青铜神树高近四米，九枝九鸟。棋盘是缩微神树，此宇宙比人间跑得快。"),
            line("hutan", "连消等于「通脉」。连击越高，得分加成越大——进化引擎会记住你的节奏。"),
            line("wangdun", "胖爷我在树根发现玉璋！消消消，消出一条通天路！"),
          ],
        },
        epilogue: {
          title: "第三章 完 · 树顶金沙",
          lines: [
            line("yangxue", "树顶有金沙遗址的碳迹——两个文明，同一条河。"),
            line("hutan", "顺流而下，第四章：金沙秘径。"),
          ],
        },
        beats: {
          41: [line("yangxue", "神树根层：玉璋与神鸟常伴生，留意对角交换。")],
          45: [line("wangdun", "四十五层！树腰有空洞，风一吹像鬼哭——别怕，是气流。")],
          50: [line("hutan", "半百之关。摸金口诀：一重关，二重关，三重关后见真棺——我们见真树。")],
          55: [line("jinyaliu", "神鸟文物能卖……不对，能换论文署名吗？")],
          60: [line("chenli", "神树归档。金沙河床的探方坐标已写入导航。")],
        },
      },
      {
        id: 3,
        name: "金沙秘径",
        icon: "☀",
        theme: "world-4",
        iceFrom: 60,
        subtitle: "太阳神鸟 · 金箔祭仪",
        prologue: {
          title: "第四章 · 金沙秘径",
          lines: [
            line("yangxue", "金沙「太阳神鸟」金箔只有0.2毫米厚。我们的消除，是在复原文物厚度层。"),
            line("hutan", "探方越深，封土越厚。道具是考古工具：锤=清理，重排=扰层后重整。"),
            line("jinyaliu", "刘哥我声明：金箔我不碰，碰了赔不起。"),
          ],
        },
        epilogue: {
          title: "第四章 完 · 四鸟朝日",
          lines: [
            line("chenli", "四鸟绕日——古蜀与中原，在此交汇。"),
            line("hutan", "最后一章：天书。传说古蜀有未解符号，消完百关，也许能读懂一字。"),
          ],
        },
        beats: {
          61: [line("hutan", "金沙层起。神鸟文物得分高，优先做长链。")],
          65: [line("wangdun", "六十五层挖到象牙——古蜀人把象牙当通天梯。")],
          70: [line("yangxue", "七十层：金箔层完整度 92%，再冲三星！")],
          75: [line("jinyaliu", "这陶盉能装酒……我是说，能装探方编号。")],
          80: [line("chenli", "金沙秘径贯通。天书探方在最后二十层。")],
        },
      },
      {
        id: 4,
        name: "天书终章",
        icon: "📜",
        theme: "world-5",
        iceFrom: 80,
        subtitle: "未解符号 · 百关终局",
        prologue: {
          title: "第五章 · 天书终章",
          lines: [
            line("chenli", "百关最后一程。符号墙上有目、有树、有鸟——与棋盘六类文物一一对应。"),
            line("hutan", "摸金校尉最后一规：见好就收。消完百关，全归档，不带走一片土。"),
            line("yangxue", "若你读到这行：进化引擎已根据你的胜负微调步数——这是古蜀留给玩家的温柔。"),
            line("wangdun", "胖爷我准备好了！百关通关，回去吃回锅肉！"),
          ],
        },
        epilogue: {
          title: "全章完 · 古蜀不灭",
          lines: [
            line("chenli", "百关归档完成。符号墙亮了一瞬——只有一个字：「续」。文明没有终点。"),
            line("hutan", "胡探敬上：墓不盗，物不归私。各位，江湖再见。"),
            line("wangdun", "胖爷我说句实在的——下次还有探方，记得还叫我们！"),
            line("yangxue", "数据已上传。杨雪留。"),
          ],
        },
        beats: {
          81: [line("hutan", "天书第一层：符号与面具同频，先消面具稳盘。")],
          85: [line("wangdun", "八十五层！胖爷手都抖了——是激动，不是怕。")],
          90: [line("yangxue", "九十层：你的三星记录将成为论文附录——谢了，搭档。")],
          95: [line("jinyaliu", "九十五层……刘哥我这次真没拿，就看看，看看总行吧？")],
          100: [line("chenli", "第一百关。消完这一盘，古蜀秘档，杀青。")],
        },
      },
    ],
    winQuotes: [
      { who: "胡探", text: "层位清晰。罗盘还在快进——继续下探。" },
      { who: "王墩", text: "漂亮！胖爷今晚加鸡腿。" },
      { who: "杨雪", text: "记录完美，可以写进报告。" },
      { who: "金牙刘", text: "这手气，刘哥我都想跟你合伙。" },
    ],
    failQuotes: [
      { who: "胡探", text: "别急，换一步风水就转。" },
      { who: "王墩", text: "失败算啥，胖爷摔过的坑比探方还多。" },
      { who: "杨雪", text: "步数用尽不代表层位错了，重来一次。" },
    ],
  };
})();
