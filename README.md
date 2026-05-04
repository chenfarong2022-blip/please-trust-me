# Please Trust Me - 请相信我

## 游戏简介

一人猜、四人辩、找真凶。一个谎言鉴别类游戏，核心玩法是一人猜、四人辩、找真凶。

## 部署架构

### 服务架构

```
用户手机/电脑
      │
      ▼
  Vercel (网站托管)
      │
      ▼
  Upstash Redis (数据存储)
```

### 技术栈

| 技术 | 说明 |
|------|------|
| Next.js 14 | React 框架 (App Router) |
| TypeScript | 类型安全 |
| Tailwind CSS | 样式 |
| QRCode | 生成二维码 |
| Upstash Redis | 数据存储 |
| Vercel | 网站托管 |

## 服务清单

### 🗄️ 数据库
| 服务 | 用途 | 地址 |
|------|------|------|
| Upstash | Redis 数据库，存储房间和玩家数据 | informed-baboon-73064.upstash.io |

### 🌐 托管平台
| 服务 | 用途 | 备注 |
|------|------|------|
| Vercel | 托管 Next.js 网站 | 免费额度足够 |

### 📦 代码仓库
| 服务 | 用途 |
|------|------|
| GitHub | 存储代码仓库 | chenfarong2022-blip/please-trust-me |

### 💻 本地开发
| 工具 | 用途 |
|------|------|
| Node.js | 运行开发服务器 |
| npm | 包管理器 |
| Git | 版本控制 |

## 费用

| 服务 | 费用 |
|------|------|
| Vercel | 免费 |
| Upstash | 免费（每天 10,000 次写入） |
| GitHub | 免费 |

## 快速开始

### 本地开发

```bash
cd C:\projects\please-trust-me
npm install
npm run dev
```

访问 http://localhost:3000

### 部署到 Vercel

1. 将代码推送到 GitHub 仓库
2. 在 Vercel 导入项目
3. 配置环境变量：
   - `UPSTASH_REDIS_REST_URL` = Upstash Redis URL
   - `UPSTASH_REDIS_REST_TOKEN` = Upstash Redis Token
4. 点击 Deploy

## 环境变量

在 Vercel 项目设置中添加以下环境变量：

| Name | Value |
|------|-------|
| UPSTASH_REDIS_REST_URL | https://informed-baboon-73064.upstash.io |
| UPSTASH_REDIS_REST_TOKEN | 你的 Upstash Token |

## 游戏规则

1. 房主创建房间，设置答题者人数（3-12）和真答案数量
2. 答题者扫码加入房间
3. 房主发题：随机分配或自定义题目
4. 每人获得题目：真答案或空白
5. 主持人可查看所有人真实身份
6. 观众通过答题者的回答猜测谁拿真答案

## 项目结构

```
please-trust-me/
├── app/
│   ├── page.tsx              # 首页（创建/加入房间）
│   ├── layout.tsx            # 根布局
│   ├── globals.css           # 全局样式
│   ├── host/[roomId]/page.tsx    # 主持人控制台
│   ├── join/[roomId]/page.tsx    # 答题者加入页
│   ├── play/[token]/page.tsx     # 答题者游戏页
│   └── api/                      # API 路由
├── lib/
│   ├── types.ts              # 类型定义
│   ├── storage.ts            # Upstash 存储
│   └── questions.ts          # 题库
├── package.json
├── tsconfig.json
└── .env.local
```
