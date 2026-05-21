import { Link } from "@tanstack/react-router";
import { lectures, projects, skills, references } from "@/content";

const tools = [
  {
    name: "Claude Code",
    vendor: "Anthropic",
    color: "from-orange-500 to-red-500",
    desc: "CLI agent với Skill, Hook, Sub-agent, MCP. Mặc định cho dev pro.",
  },
  {
    name: "Codex",
    vendor: "OpenAI",
    color: "from-teal-500 to-emerald-500",
    desc: "Sandbox isolation chặt, approval policy theo level. AGENTS.md.",
  },
  {
    name: "OpenCode",
    vendor: "sst (OSS)",
    color: "from-violet-500 to-purple-500",
    desc: "Provider-agnostic. Plug Claude / GPT / local model. TUI lightweight.",
  },
];

const pillars = [
  {
    title: "Skill",
    desc: "Đơn vị nguyên thủy. Progressive disclosure. Trigger-based.",
  },
  {
    title: "Tool",
    desc: "Read, Edit, Bash, Glob, Grep + MCP. Deterministic action.",
  },
  {
    title: "Hook",
    desc: "Script chạy trên tool event. SessionStart/End. Observability.",
  },
  {
    title: "Permission",
    desc: "Allowlist + sandbox + plan mode. Chặn destructive.",
  },
  {
    title: "Memory",
    desc: "Repo as SoR. CLAUDE.md/AGENTS.md. Feedback persistence.",
  },
];

export function HomePage() {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-slate-200 dark:border-slate-800">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-brand-50 via-white to-orange-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900" />
        <div className="absolute inset-0 -z-10 [background:radial-gradient(circle_at_20%_20%,rgba(237,114,32,0.18),transparent_40%),radial-gradient(circle_at_80%_70%,rgba(237,114,32,0.12),transparent_45%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
              Tài liệu mở · Tiếng Việt
            </span>
            <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 dark:text-white">
              Học{" "}
              <span className="text-brand-600 dark:text-brand-400">
                Harness Engineering
              </span>
              <br />
              từ đam mê đến kỹ sư thực thụ
            </h1>
            <p className="mt-6 text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              Model giỏi không đủ — <strong>harness</strong> mới quyết định kết
              quả. Học cách tiếp cận, build workflow cho AI Agent với{" "}
              <strong>Claude Code</strong>, <strong>Codex</strong>. Từ nền tảng
              tới project thực hành test automation.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/lectures"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-medium shadow-sm"
              >
                Bắt đầu học
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M5 12h14M13 5l7 7-7 7" />
                </svg>
              </Link>
              <Link
                to="/projects"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium"
              >
                Xem project mẫu
              </Link>
            </div>
            <div className="mt-10 grid grid-cols-4 gap-4 max-w-lg">
              <Stat value={lectures.length} label="Lectures" />
              <Stat value={projects.length} label="Projects" />
              <Stat value={skills.length} label="Skills" />
              <Stat value={references.length} label="References" />
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-bold mb-2">3 tool AI nên biết</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-8">
          Khác bề mặt — chung triết lý "harness bao quanh LLM".
        </p>
        <div className="grid md:grid-cols-3 gap-5">
          {tools.map((t) => (
            <div
              key={t.name}
              className="group rounded-xl border border-slate-200 dark:border-slate-800 p-6 bg-white dark:bg-slate-900 hover:shadow-lg transition-shadow"
            >
              <div
                className={`w-10 h-10 rounded-lg bg-gradient-to-br ${t.color} mb-4`}
              />
              <div className="text-xs text-slate-500 uppercase tracking-wide">
                {t.vendor}
              </div>
              <div className="text-lg font-bold mt-1">{t.name}</div>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                {t.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-50 dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl font-bold mb-2">5 trụ của một Harness</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            Master 5 trụ này = Harness Engineer thực thụ.
          </p>
          <div className="grid md:grid-cols-5 gap-4">
            {pillars.map((p, i) => (
              <div
                key={p.title}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5"
              >
                <div className="text-xs font-mono text-brand-600 dark:text-brand-400">
                  0{i + 1}
                </div>
                <div className="text-base font-bold mt-1">{p.title}</div>
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {p.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <PathCard
            title="Lectures"
            badge="Nền tảng"
            desc="13 bài giảng — vì sao agent fail và cách harness fix nó."
            to="/lectures"
            count={lectures.length}
          />
          <PathCard
            title="Projects"
            badge="Thực hành"
            desc="Build workflow AI agent thật. Code automation test với Playwright MCP."
            to="/projects"
            count={projects.length}
          />
          <PathCard
            title="Skills"
            badge="Kỹ năng"
            desc="Template + best practice. Đơn vị nguyên thủy của harness."
            to="/skills"
            count={skills.length}
          />
          <PathCard
            title="References"
            badge="Tham chiếu"
            desc="Doc gốc, paper, MCP server, link cộng đồng để đào sâu thêm."
            to="/references"
            count={references.length}
          />
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 text-white p-8 lg:p-12">
          <div className="max-w-2xl">
            <h2 className="text-2xl lg:text-3xl font-bold">
              Lộ trình đề xuất cho người mới
            </h2>
            <ol className="mt-6 space-y-3 text-slate-200">
              {[
                "Đọc Lecture 01-02: hiểu vì sao model giỏi vẫn fail",
                "Cài Claude Code hoặc Codex CLI, làm quen tool basic",
                "Đọc Lecture 03-06: kiến trúc — repo as SoR, instruction split, continuity",
                "Đọc Lecture 07-12: kỷ luật — scope, verification, e2e, observability",
                "Làm Project 01: build harness test automation với Playwright MCP",
                "Tạo Skill riêng cho workflow của bạn",
              ].map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="shrink-0 w-7 h-7 rounded-full bg-brand-500 text-white font-bold text-sm flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
            <div className="mt-8">
              <Link
                to="/lectures/01-vi-sao-agent-fail"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white text-slate-900 hover:bg-slate-100 font-medium"
              >
                Vào Lecture 01
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M5 12h14M13 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <div className="text-3xl font-bold text-slate-900 dark:text-white">
        {value}
      </div>
      <div className="text-xs uppercase tracking-wider text-slate-500">
        {label}
      </div>
    </div>
  );
}

function PathCard({
  title,
  badge,
  desc,
  to,
  count,
}: {
  title: string;
  badge: string;
  desc: string;
  to: string;
  count: number;
}) {
  return (
    <Link
      to={to}
      className="group rounded-xl border border-slate-200 dark:border-slate-800 p-6 bg-white dark:bg-slate-900 hover:border-brand-400 dark:hover:border-brand-500 hover:shadow-lg transition-all"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300">
          {badge}
        </span>
        <span className="text-xs text-slate-500">{count} mục</span>
      </div>
      <div className="mt-4 text-xl font-bold group-hover:text-brand-600 dark:group-hover:text-brand-400">
        {title}
      </div>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{desc}</p>
      <div className="mt-4 text-sm text-brand-600 dark:text-brand-400 font-medium flex items-center gap-1">
        Khám phá
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className="group-hover:translate-x-1 transition-transform"
        >
          <path d="M5 12h14M13 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}
