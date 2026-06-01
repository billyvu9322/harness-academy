# Harness Academy

Tài liệu mở tiếng Việt về **Harness Engineering** — cách build workflow cho AI agent (Claude Code, Codex, OpenCode).

## Nội dung

- **12 Lectures** — nền tảng vì sao agent fail + cách harness fix
- **5 Skills** — template skill production-ready (anatomy, verification, init, cleanup, MCP)
- **1 Project** — build workflow test automation với Playwright MCP

## Stack

- React 19 + TypeScript
- Vite 6
- TanStack Router
- Tailwind CSS 3
- Zustand (theme + sidebar state)
- react-markdown + remark-gfm + rehype-highlight

## Phát triển

```bash
pnpm install     # hoặc npm install
pnpm dev         # localhost:5173
pnpm build       # static dist/
pnpm preview     # preview dist
```

## Cấu trúc

```
harness-academy/
├── content/                 # tất cả markdown
│   ├── lectures/            # 12 bài
│   ├── projects/            # 1 project mẫu
│   └── skills/              # 5 skill template
├── src/
│   ├── pages/               # Home, Index, Doc, NotFound
│   ├── components/          # Layout, Sidebar, Markdown, TOC
│   ├── store/               # Zustand UI store
│   ├── lib/                 # parseDoc (frontmatter)
│   ├── content/             # auto-glob markdown
│   ├── router.tsx           # TanStack Router routes
│   └── main.tsx
└── ...
```

## Thêm bài mới

1. Tạo `content/<lectures|projects|skills>/NN-slug.md`
2. Frontmatter:
   ```yaml
   ---
   title: "Tiêu đề"
   description: "Mô tả ngắn"
   order: 13
   duration: "10 phút đọc"
   tags: [tag1, tag2]
   ---
   ```
3. Restart dev → tự xuất hiện trong sidebar.

## Deploy

`dist/` là static — deploy lên GitHub Pages, Cloudflare Pages, Netlify, Vercel.

## License

CC-BY 4.0. Fork + chỉnh theo nhu cầu dự án của bạn.
