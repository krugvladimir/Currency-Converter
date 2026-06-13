

### 2.1 TypeScript (Node.js)

```typescript
#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

// Types
type Rates = Record<string, number>;
interface CacheData { timestamp: number; rates: Rates; }
interface ConversionHistory { from: string; to: string; amount: number; result: number; rate: number; timestamp: number; }

// Конфигурация
const CACHE_FILE = path.join(__dirname, '.cache.json');
const CACHE_TTL = 3600000; // 1 hour
const HISTORY_SIZE = 10;
const FALLBACK_RATES: Rates = {
  USD: 1, EUR: 0.9165, GBP: 0.7923, JPY: 147.88, CAD: 1.352, AUD: 1.518, CHF: 0.882, CNY: 7.193, RUB: 91.45
};

// Вспомогательные функции
function detectCurrencyFromSymbol(input: string): string | null {
  if (input.startsWith('$')) return 'USD';
  if (input.startsWith('€')) return 'EUR';
  if (input.startsWith('£')) return 'GBP';
  if (input.startsWith('¥')) return 'JPY';
  return null;
}

function parseAmountAndCurrency(arg: string): { amount?: number; currency?: string } {
  const symbolMatch = arg.match(/^([$€£¥])(\d+(?:\.\d+)?)$/);
  if (symbolMatch) {
    const currency = detectCurrencyFromSymbol(symbolMatch[1]);
    const amount = parseFloat(symbolMatch[2]);
    return { amount, currency: currency || undefined };
  }
  const numeric = parseFloat(arg);
  if (!isNaN(numeric)) return { amount: numeric };
  return { currency: arg.toUpperCase() };
}

async function fetchRates(): Promise<Rates> {
  // Check cache
  if (fs.existsSync(CACHE_FILE)) {
    const cache: CacheData = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    if (Date.now() - cache.timestamp < CACHE_TTL) {
      console.error('[cache] using cached rates');
      return cache.rates;
    }
  }
  try {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const rates = data.rates as Rates;
    fs.writeFileSync(CACHE_FILE, JSON.stringify({ timestamp: Date.now(), rates }, null, 2));
    console.error('[api] rates updated');
    return rates;
  } catch (err) {
    console.error('[warn] API failed, using fallback rates');
    return FALLBACK_RATES;
  }
}

function convert(amount: number, from: string, to: string, rates: Rates): { result: number; rate: number } {
  if (!rates[from] || !rates[to]) throw new Error(`Unsupported currency: ${from} or ${to}`);
  const rate = rates[to] / rates[from];
  return { result: amount * rate, rate };
}

function formatOutput(amount: number, from: string, to: string, result: number, rate: number, format: 'text' | 'json' | 'table'): string {
  if (format === 'json') {
    return JSON.stringify({ amount, from, to, result: parseFloat(result.toFixed(4)), rate: parseFloat(rate.toFixed(4)) }, null, 2);
  }
  if (format === 'table') {
    return `${from.padEnd(5)} → ${to.padEnd(5)} : ${amount.toFixed(2)} = ${result.toFixed(4)} (курс ${rate.toFixed(4)})`;
  }
  return `${amount.toFixed(2)} ${from} = ${result.toFixed(4)} ${to} (курс: ${rate.toFixed(4)})`;
}

// История (in-memory)
let history: ConversionHistory[] = [];

function addToHistory(conv: ConversionHistory) {
  history.unshift(conv);
  if (history.length > HISTORY_SIZE) history.pop();
}

function showHistory() {
  if (history.length === 0) console.log('История пуста');
  else history.forEach((h, i) => {
    const date = new Date(h.timestamp).toLocaleTimeString();
    console.log(`${i+1}) ${date} | ${h.amount} ${h.from} → ${h.to} = ${h.result.toFixed(4)} (курс ${h.rate.toFixed(4)})`);
  });
}

// Интерактивный режим
async function interactive(rates: Rates) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const question = (q: string): Promise<string> => new Promise(resolve => rl.question(q, resolve));
  console.log('Интерактивный конвертер валют. Команды: 100 USD EUR, history, exit');
  while (true) {
    const input = await question('> ');
    const cmd = input.trim();
    if (cmd === 'exit') break;
    if (cmd === 'history') { showHistory(); continue; }
    const parts = cmd.split(/\s+/);
    if (parts.length < 3) { console.log('Формат: <сумма> <из> <в>'); continue; }
    let amount: number, fromCurr: string, toCurr: string;
    // Попытка распознать сумму с символом
    const first = parseAmountAndCurrency(parts[0]);
    if (first.amount !== undefined) amount = first.amount;
    else { console.log('Неверная сумма'); continue; }
    fromCurr = first.currency || parts[1].toUpperCase();
    toCurr = parts[2].toUpperCase();
    try {
      const { result, rate } = convert(amount, fromCurr, toCurr, rates);
      console.log(formatOutput(amount, fromCurr, toCurr, result, rate, 'text'));
      addToHistory({ from: fromCurr, to: toCurr, amount, result, rate, timestamp: Date.now() });
    } catch (e: any) { console.log(`Ошибка: ${e.message}`); }
  }
  rl.close();
}

// CLI
async function main() {
  const args = process.argv.slice(2);
  const formatFlag = args.includes('--json') ? 'json' : args.includes('--table') ? 'table' : 'text';
  const interactiveMode = args.includes('interactive');
  const rates = await fetchRates();

  if (interactiveMode) {
    await interactive(rates);
    return;
  }
  // Однократная конвертация
  if (args.length < 3 && !interactiveMode) {
    console.log('Usage: converter.ts [--json|--table] <amount> <from> <to>   or   converter.ts interactive');
    process.exit(1);
  }
  // Фильтруем флаги
  const nonFlags = args.filter(a => !a.startsWith('--'));
  if (nonFlags.length < 3) { console.log('Не хватает аргументов'); process.exit(1); }
  const first = parseAmountAndCurrency(nonFlags[0]);
  if (first.amount === undefined) { console.log('Сумма не распознана'); process.exit(1); }
  const amount = first.amount;
  const fromCurr = first.currency || nonFlags[1].toUpperCase();
  const toCurr = nonFlags[2].toUpperCase();
  try {
    const { result, rate } = convert(amount, fromCurr, toCurr, rates);
    console.log(formatOutput(amount, fromCurr, toCurr, result, rate, formatFlag));
    addToHistory({ from: fromCurr, to: toCurr, amount, result, rate, timestamp: Date.now() });
  } catch (e: any) { console.error(e.message); process.exit(1); }
}

main().catch(console.error);
