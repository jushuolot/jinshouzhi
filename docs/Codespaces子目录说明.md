# Codespaces 若报找不到 package.json

若仓库结构为「外层还有一个 `jinshouzhi` 文件夹」，在 Codespaces 终端执行：

```bash
cd jinshouzhi
npm run install:all
npm run seed
npm run dev
```

正确推送后，仓库根目录应直接有 `package.json`，无需再 `cd`。
