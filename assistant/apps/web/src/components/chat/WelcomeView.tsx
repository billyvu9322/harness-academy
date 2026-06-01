import { BrandMark } from './BrandMark';
import { ChatComposer } from './ChatComposer';
import { WelcomeExamples } from './WelcomeExamples';

interface WelcomeViewProps {
  isLoading?: boolean;
  onSubmit: (value: string) => Promise<void> | void;
}

export function WelcomeView({ isLoading, onSubmit }: WelcomeViewProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-md overflow-y-auto">
      <div className="w-full max-w-2xl flex flex-col">
        <div className="flex justify-center mb-10">
          <div className="w-16 h-16 flex items-center justify-center">
            <BrandMark size={64} />
          </div>
        </div>
        <div className="mb-10">
          <ChatComposer isLoading={isLoading} onSubmit={onSubmit} />
        </div>
        <WelcomeExamples onPick={(prompt) => void onSubmit(prompt)} />
      </div>
    </div>
  );
}
