import type { EvalCategory, EvalTransport } from './goldenQuestions';

export interface RunOptions {
  id?: string;
  category?: EvalCategory;
  json: boolean;
  runs: number;
  timeout: number;
  model?: string;
  judgeModel?: string;
  transport?: EvalTransport;
}

const DEFAULT_TIMEOUT_MS = 120_000;

function readValue(args: string[], index: number, name: string): string {
  const value = args[index + 1];
  if (!value || value.startsWith('--')) throw new Error(`Missing value for ${name}`);
  return value;
}

function parsePositiveInteger(value: string, name: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) throw new Error(`${name} must be a positive integer`);
  return parsed;
}

export function parseRunOptions(args: string[]): RunOptions {
  const options: RunOptions = {
    json: false,
    runs: 1,
    timeout: DEFAULT_TIMEOUT_MS,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--id':
        options.id = readValue(args, i, arg);
        i++;
        break;
      case '--category':
        options.category = readValue(args, i, arg) as EvalCategory;
        i++;
        break;
      case '--json':
        options.json = true;
        break;
      case '--runs':
        options.runs = parsePositiveInteger(readValue(args, i, arg), 'runs');
        i++;
        break;
      case '--timeout':
        options.timeout = parsePositiveInteger(readValue(args, i, arg), 'timeout');
        i++;
        break;
      case '--model':
        options.model = readValue(args, i, arg);
        i++;
        break;
      case '--judge-model':
        options.judgeModel = readValue(args, i, arg);
        i++;
        break;
      case '--transport': {
        const transport = readValue(args, i, arg);
        if (transport !== 'message' && transport !== 'stream') throw new Error('transport must be message or stream');
        options.transport = transport;
        i++;
        break;
      }
      case '--help':
      case '-h':
        throw new Error('help');
      default:
        throw new Error(`Unknown option: ${arg}`);
    }
  }

  return options;
}

export function printUsage(): void {
  console.log(
    `Usage: pnpm eval -- [options]

Options:
  --id <id>                 Run one golden question
  --category <category>     Filter by eval category
  --json                    Emit JSON only
  --runs <n>                Repeat each selected case (default: 1)
  --timeout <ms>            Timeout per case attempt (default: ${DEFAULT_TIMEOUT_MS})
  --model <model>           Assistant model override for this process
  --judge-model <model>     Judge model override
  --transport <transport>   message or stream
  --help, -h                Show this help`,
  );
}
