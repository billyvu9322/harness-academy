import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ChatPage } from "../components/chat/ChatPage";
import type { WidgetConfig } from "./config";

const queryClient = new QueryClient();

interface WidgetAppProps {
  config: WidgetConfig;
}

/**
 * The slide-in panel shell rendered inside the widget's Shadow DOM. Wraps the reused ChatPage,
 * shows a context chip for the current academy doc, and prefills the composer with an editable
 * scope hint. Trigger button and modal state both live inside the widget.
 */
export function WidgetApp({ config }: WidgetAppProps) {
  const [open, setOpen] = useState(false);

  const modalChat = () => {
    return (
      <>
        <div
          onClick={() => setOpen(false)}
          aria-hidden
          className={`fixed inset-0 bg-black/30 transition-opacity duration-300 z-[2147483646] ${
            open ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        />
        <aside
          role="dialog"
          aria-label="Harness Assistant"
          aria-hidden={!open}
          style={{
            minHeight: "calc(100% - 60px)",
            height: "calc(100% - 60px)",
            borderRadius: ".75rem",
          }}
          className={`overflow-hidden fixed top-1/2 -translate-y-1/2 right-5 w-[min(700px,100vw)] bg-surface shadow-2xl z-[2147483647] flex transition-transform duration-300 ${
            open ? "translate-x-0" : "translate-x-[120%] right-0"
          }`}
        >
          <ChatPage
            onClose={() => setOpen(false)}
            contextLabel={config.academyTitle}
          />
        </aside>
      </>
    );
  };

  return (
    <QueryClientProvider client={queryClient}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{ display: open ? "none" : "inline-flex" }}
        className="fixed bottom-6 right-6 z-[2147483645] items-center gap-2 px-4 py-3 rounded-full text-sm font-semibold text-white bg-primary-container shadow-2xl hover:opacity-90 transition-opacity"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden
        >
          <path d="M12 2l1.9 5.1L19 9l-5.1 1.9L12 16l-1.9-5.1L5 9l5.1-1.9L12 2z" />
        </svg>
        Hỏi đáp
      </button>
      {modalChat()}
    </QueryClientProvider>
  );
}
