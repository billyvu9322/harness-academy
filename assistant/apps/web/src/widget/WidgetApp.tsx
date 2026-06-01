import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ChatPage } from '../components/chat/ChatPage';
import { useChatUiStore } from '../stores/chatUiStore';
import { buildContextPrefill, type WidgetConfig } from './config';

const queryClient = new QueryClient();

interface WidgetAppProps {
  config: WidgetConfig;
  open: boolean;
  onClose: () => void;
}

/**
 * The slide-in panel shell rendered inside the widget's Shadow DOM. Wraps the reused ChatPage,
 * shows a context chip for the current academy doc, and prefills the composer with an editable
 * scope hint. Open state is driven by the host element's `open` attribute.
 */
export function WidgetApp({ config, open, onClose }: WidgetAppProps) {
  useEffect(() => {
    const prefill = buildContextPrefill(config.academyTitle);
    if (prefill) useChatUiStore.getState().setDraft(prefill);
    // Prefill once when the widget first mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <div
        onClick={onClose}
        aria-hidden
        className={`fixed inset-0 bg-black/30 transition-opacity duration-300 z-[2147483646] ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />
      <aside
        role="dialog"
        aria-label="Harness Assistant"
        aria-hidden={!open}
        className={`fixed top-0 right-0 h-screen w-[min(440px,100vw)] bg-surface shadow-2xl z-[2147483647] flex transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <ChatPage onClose={onClose} contextLabel={config.academyTitle} />
      </aside>
    </QueryClientProvider>
  );
}
