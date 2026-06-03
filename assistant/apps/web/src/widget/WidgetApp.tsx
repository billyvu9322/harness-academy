import { useEffect, useRef, useState } from "react";
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
  const [open, setOpen] = useState(Boolean(config.chatOpen));
  const lastRequestedOpen = useRef<boolean>(Boolean(config.chatOpen));

  useEffect(() => {
    const requestedOpen = Boolean(config.chatOpen);
    // Only react to false -> true transitions from host routing state.
    if (requestedOpen && !lastRequestedOpen.current) {
      setOpen(true);
    }
    lastRequestedOpen.current = requestedOpen;
  }, [config.chatOpen]);

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
        className="fixed bottom-6 right-6 z-[2147483645] inline-flex items-center gap-2 rounded-full bg-surface px-3 py-2 font-headline text-[15px] font-semibold text-on-surface shadow-[0_10px_30px_rgba(15,23,42,0.12),0_2px_8px_rgba(15,23,42,0.08)] transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-container text-on-primary-container shadow-[0_6px_14px_rgba(217,92,65,0.28)]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="30"
            height="30"
            viewBox="0 0 40 40"
            fill="none"
          >
            <circle cx="20" cy="20" r="18" fill="#d95c41" />
            <path
              d="M20 10V30M10 20H30M12.93 12.93L27.07 27.07M27.07 12.93L12.93 27.07"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </span>
        <span className="pr-1">Assistant</span>
      </button>
      {modalChat()}
    </QueryClientProvider>
  );
}
