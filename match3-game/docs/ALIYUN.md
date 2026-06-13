# 古蜀秘档 · 阿里云同步

与 **暖伴勤工** 同机部署，静态文件目录 `match3-game/`，由 Caddy 提供：

| 环境 | URL |
|------|-----|
| 备案域名 | `https://nuanban.cc/game/` |
| 备案前 IP | `http://你的公网IP/game/` |

## 一键同步（本机）

```bash
cp scripts/aliyun.env.example scripts/aliyun.env
# 编辑 ALIYUN_SSH=root@你的IP

chmod +x scripts/aliyun-sync-all.sh
./scripts/aliyun-sync-all.sh
```

会：`git push` → 服务器 `git pull` → 暖伴 `deploy-public.sh`（含 match3 静态卷）。

## 服务器目录

```
/opt/jinshouzhi/
├── nuanban_github/    # 暖伴（Docker + Caddy）
└── match3-game/       # 古蜀秘档（本目录，只读挂载进 Caddy）
```

首次若无仓库：

```bash
ssh root@你的IP
git clone https://github.com/jushuolot/jinshouzhi.git /opt/jinshouzhi
cd /opt/jinshouzhi/nuanban_github
sudo ./scripts/aliyun-bootstrap.sh
cp config/demo.env.example config/demo.env
# 填 NUANBAN_DOMAIN 或 NUANBAN_STAGING_IP
./scripts/deploy-public.sh   # 或 deploy-staging.sh
```

## 与 GitHub Pages 关系

| 环境 | 地址 |
|------|------|
| GitHub Pages | https://jushuolot.github.io/game/ |
| 阿里云 | https://域名/game/ 或 http://IP/game/ |

进化 push 后跑 `aliyun-sync-all.sh` 即可两边更新。
