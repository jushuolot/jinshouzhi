# 每日自主进化 · 夜间 Agent 手册

供 Cursor 定时自动化（或人工触发）每晚执行，用户白天不介入，晚间验收。

## 仓库与发布

| 项 | 值 |
|----|-----|
|  monorepo | `jushuolot/jinshouzhi` · 分支 `main` |
|  游戏 Pages | `match3-game/` → subtree 推 `game` 远端 `main` |
|  线上 | https://jushuolot.github.io/game/ |

```bash
# 发布（在 monorepo 根目录）
git push origin main
git subtree split --prefix=match3-game -b match3-pages-deploy
git push game match3-pages-deploy:main --force
```

## 不可改动

- `story.js` / `map-narrative.js` / `expedition-data.js` 剧情对白（含王墩「胖爷」）
- 不向玩家展示广告收入；管理员口令门 `Mz168`（标题连点 5 次）

## 每夜必做

1. 读 `evolution.json` → `generation` +1，semver patch/minor 合理递增
2. 选 **一个** 聚焦主题（视觉 / 桌面 UX / 地图 / 闯关手感 / 音效 / 图鉴），小步可验收
3. 更新 `evolution.json`、`evolution.js`、启动屏 `Gen.N` 文案
4. 仅改 `match3-game/`，提交并 push monorepo + game subtree
5. 在 commit message 写清「为什么进化」

## 进化主题轮换（建议）

| 星期 | 方向 |
|------|------|
| 一 | 闯关手感 / match-fx / 连击 |
| 二 | 剧情影院 / VN / 发现弹窗 |
| 三 | 地图堪舆 / 探方卷轴 |
| 四 | 立绘 / 妖艳摸金视觉 |
| 五 | 音效 / 章节 BGM / 氛围 |
| 六 | 图鉴 / 结算 / 章节过场 |
| 日 | 桌面宽屏 / 性能 / 修 bug |

## 当前基线

- **Gen.47** · v5.5.0 · 发现探点弹窗 + 三星盛典
- 桌面：VN 分栏、空格继续、堪舆图、继续按钮已修复

## 验收清单（给用户晚间检查）

- [ ] https://jushuolot.github.io/game/ 启动屏显示新 Gen
- [ ] 蜀地地图 → 策划 → 集合 → 探方 流程通畅
- [ ] 电脑端空格/回车可推进剧情
- [ ] 点探点有发现弹窗并可开战
