import { useEffect, useState } from 'react'

interface TocItem {
  id: string
  text: string
  level: number
}

export function TableOfContents({ source }: { source: string }) {
  const [items, setItems] = useState<TocItem[]>([])
  const [activeId, setActiveId] = useState<string>('')

  // Build TOC from rendered DOM so IDs match what rehype-slug actually generated.
  useEffect(() => {
    const collect = () => {
      const headings = document.querySelectorAll<HTMLElement>(
        'article.prose-doc h2[id], article.prose-doc h3[id]',
      )
      const list: TocItem[] = []
      headings.forEach((h) => {
        list.push({
          id: h.id,
          text: h.textContent ?? '',
          level: h.tagName === 'H2' ? 2 : 3,
        })
      })
      setItems(list)
    }
    // Defer to next tick so markdown finishes mounting.
    const raf = requestAnimationFrame(collect)
    return () => cancelAnimationFrame(raf)
  }, [source])

  useEffect(() => {
    if (items.length === 0) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        }
      },
      { rootMargin: '-80px 0px -70% 0px' },
    )
    const headings = document.querySelectorAll(
      'article.prose-doc h2[id], article.prose-doc h3[id]',
    )
    headings.forEach((h) => observer.observe(h))
    return () => observer.disconnect()
  }, [items])

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    const el = document.getElementById(id)
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY - 72
    window.scrollTo({ top, behavior: 'smooth' })
    history.replaceState(null, '', `#${id}`)
  }

  if (items.length < 2) return null

  return (
    <nav className="text-sm">
      <div className="uppercase tracking-wider text-xs font-bold text-slate-500 dark:text-slate-400 mb-3">
        Nội dung
      </div>
      <ul className="space-y-1 border-l border-slate-200 dark:border-slate-800">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              onClick={(e) => handleClick(e, item.id)}
              className={`block pl-3 -ml-px py-1 border-l text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 ${
                item.level === 3 ? 'pl-6' : ''
              } ${
                activeId === item.id
                  ? 'border-brand-500 text-brand-600 dark:text-brand-400 font-medium'
                  : 'border-transparent'
              }`}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
