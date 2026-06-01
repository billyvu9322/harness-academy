interface UserMessageProps {
  text: string;
  animationDelay?: string;
}

export function UserMessage({ text, animationDelay }: UserMessageProps) {
  return (
    <div
      className="flex justify-end message-transition"
      style={animationDelay ? { animationDelay } : undefined}
    >
      <div className="max-w-[85%] bg-forge-orange text-white px-4 py-2.5 rounded-lg font-body-md shadow-sm">
        {text}
      </div>
    </div>
  );
}
