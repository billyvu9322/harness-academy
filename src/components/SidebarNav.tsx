import { Link, useLocation } from '@tanstack/react-router'
import { lectures, projects, skills, references, type Doc } from '@/content'

interface Section {
  title: string
  basePath: string
  items: Doc[]
}

const sections: Section[] = [
  { title: 'Lectures', basePath: '/lectures', items: lectures },
  { title: 'Projects', basePath: '/projects', items: projects },
  { title: 'Skills', basePath: '/skills', items: skills },
  { title: 'References', basePath: '/references', items: references },
]

export function SidebarNav() {
  const location = useLocation()
  return (
    <nav className="space-y-6 text-sm">
      {sections.map((section) => (
        <div key={section.basePath}>
          <Link
            to={section.basePath}
            className="block uppercase tracking-wider text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 hover:text-brand-600 dark:hover:text-brand-400"
          >
            {section.title}
          </Link>
          <ul className="space-y-0.5 border-l border-slate-200 dark:border-slate-800">
            {section.items.map((item) => {
              const href = `${section.basePath}/${item.slug}`
              const active = location.pathname === href
              return (
                <li key={item.slug}>
                  <Link
                    to={href}
                    className={`block pl-3 -ml-px py-1.5 border-l text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 ${
                      active
                        ? 'border-brand-500 text-brand-600 dark:text-brand-400 font-medium'
                        : 'border-transparent'
                    }`}
                  >
                    {item.title}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}
