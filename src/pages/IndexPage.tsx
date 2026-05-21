import { Link } from '@tanstack/react-router'
import type { Doc } from '@/content'

interface Props {
  title: string
  subtitle: string
  items: Doc[]
  basePath: string
}

export function IndexPage({ title, subtitle, items, basePath }: Props) {
  return (
    <div className="max-w-4xl">
      <header className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
          {title}
        </h1>
        <p className="mt-3 text-lg text-slate-600 dark:text-slate-400">{subtitle}</p>
      </header>

      <ul className="space-y-3">
        {items.map((item, i) => (
          <li key={item.slug}>
            <Link
              to={`${basePath}/${item.slug}`}
              className="group block rounded-xl border border-slate-200 dark:border-slate-800 p-5 bg-white dark:bg-slate-900 hover:border-brand-400 dark:hover:border-brand-500 hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="shrink-0 w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-brand-100 group-hover:text-brand-700 dark:group-hover:bg-brand-900/30 dark:group-hover:text-brand-300 flex items-center justify-center font-mono font-bold text-sm">
                  {String(item.order ?? i + 1).padStart(2, '0')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400">
                      {item.title}
                    </h3>
                    {item.duration && (
                      <span className="text-xs text-slate-500">· {item.duration}</span>
                    )}
                  </div>
                  {item.description && (
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                      {item.description}
                    </p>
                  )}
                  {item.tags && item.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="shrink-0 text-slate-400 group-hover:text-brand-500 group-hover:translate-x-1 transition-all"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
