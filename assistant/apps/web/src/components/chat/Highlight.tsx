import type { ReactNode } from 'react';

export function Highlight({ children }: { children: ReactNode }) {
  return <span className="text-primary font-medium">{children}</span>;
}
