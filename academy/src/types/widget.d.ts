declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'harness-assistant': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        id?: string;
        'data-academy-route'?: string;
        'data-academy-title'?: string;
        'data-chat-open'?: string;
      };
    }
  }
}

export {};
