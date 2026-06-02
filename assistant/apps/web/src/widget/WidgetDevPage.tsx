import { useEffect } from 'react';

function WidgetDevHost() {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (customElements.get('harness-assistant')) return;
    void import('./index');
  }, []);

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-900 p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Widget Dev
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Harness Assistant Widget Sandbox</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Trang nay mount thang <code>{'<harness-assistant />'}</code> de debug button,
            modal, shadow DOM, va chat UI ma khong can academy.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Host element
              </p>
              <p className="mt-1 text-sm text-slate-600">Mo widget tu button render ben trong custom element.</p>
            </div>
            <harness-assistant
              id="assistant-root"
              data-api-base-url="http://localhost:3001"
              data-academy-route="/widget-dev"
              data-academy-title="Harness Assistant Widget Sandbox"
            />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
              <p className="font-medium text-slate-900">Gia lap context</p>
              <ul className="mt-2 space-y-1 font-mono text-xs">
                <li>API: http://localhost:3001</li>
                <li>Route: /widget-dev</li>
                <li>Title: Harness Assistant Widget Sandbox</li>
              </ul>
            </div>
            <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
              <p className="font-medium text-slate-900">Checklist</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Button co render trong Shadow DOM khong</li>
                <li>Click co mo modal chat khong</li>
                <li>Context chip co hien title dung khong</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function WidgetDevPage() {
  return <WidgetDevHost />;
}
