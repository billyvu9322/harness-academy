import { Link, useParams } from "@tanstack/react-router";
import { MarkdownView } from "@/components/MarkdownView";
import { TableOfContents } from "@/components/TableOfContents";
import type { Doc } from "@/content";
import { NotFoundPage } from "./NotFoundPage";

interface Props {
  collection: Doc[];
  basePath: string;
}

export function DocPage({ collection, basePath }: Props) {
  const { slug } = useParams({ strict: false }) as { slug: string };
  const idx = collection.findIndex((d) => d.slug === slug);
  if (idx === -1) return <NotFoundPage />;

  const doc = collection[idx];
  const prev = idx > 0 ? collection[idx - 1] : null;
  const next = idx < collection.length - 1 ? collection[idx + 1] : null;

  return (
    <div className="flex gap-10">
      <div className="flex-1 min-w-0 max-w-3xl">
        <div className="mb-6 text-sm text-slate-500">
          <Link to={basePath} className="hover:text-brand-600">
            ← Quay lại
          </Link>
        </div>

        <header className="mb-8 pb-6 border-b border-slate-200 dark:border-slate-800">
          {doc.duration && (
            <div className="text-xs uppercase tracking-wider font-bold text-brand-600 dark:text-brand-400 mb-2">
              {doc.duration}
            </div>
          )}
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            {doc.title}
          </h1>
          {doc.description && (
            <p className="mt-3 text-lg text-slate-600 dark:text-slate-400">
              {doc.description}
            </p>
          )}
        </header>

        <MarkdownView source={doc.body} />

        <nav className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-4">
          {prev ? (
            <Link
              to={`${basePath}/${prev.slug}`}
              className="group rounded-lg border border-slate-200 dark:border-slate-800 p-4 hover:border-brand-400 transition-colors"
            >
              <div className="text-xs text-slate-500">← Trước</div>
              <div className="mt-1 font-medium text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400">
                {prev.title}
              </div>
            </Link>
          ) : (
            <div />
          )}
          {next ? (
            <Link
              to={`${basePath}/${next.slug}`}
              className="group rounded-lg border border-slate-200 dark:border-slate-800 p-4 hover:border-brand-400 transition-colors text-right"
            >
              <div className="text-xs text-slate-500">Tiếp →</div>
              <div className="mt-1 font-medium text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400">
                {next.title}
              </div>
            </Link>
          ) : (
            <div />
          )}
        </nav>
      </div>

      <aside className="hidden xl:block w-56 shrink-0">
        <div className="sticky top-20">
          <TableOfContents source={doc.body} />
        </div>
      </aside>
    </div>
  );
}
