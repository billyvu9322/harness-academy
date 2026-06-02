import { AppShell } from './app/AppShell';
import { WidgetDevPage } from './widget/WidgetDevPage';

export function AppRouter() {
  if (typeof window !== 'undefined' && window.location.pathname === '/widget-dev') {
    return <WidgetDevPage />;
  }

  return <AppShell />;
}
