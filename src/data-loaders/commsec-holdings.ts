import { error, value, type Result } from '@/lib';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

// === Types ===
interface HoldingEntry {
  code: string;
  availUnits: number;
  purchasePrice: number;
  lastPrice: number;
  changePrice: number;
  changePercent: number;
  profitLoss: number;
  profitLossPercent: number;
  marketValue: number;
  weightPercent: number;
  valueChange: number;
}

interface HoldingSummary {
  profitLoss: number;
  profitLossPercent: number;
  marketValue: number;
  weightPercent: number;
  valueChange: number;
}

export interface CommsecHoldings {
  accountNumber: string;
  asOfDateTime: string;
  holdings: HoldingEntry[];
  summary: HoldingSummary;
}

// === In-memory cache (timestamp-based) ===
interface CacheEntry {
  result: Result<CommsecHoldings>;
  cachedAt: number;   // Date.now() when the data was parsed
}

let cache: CacheEntry | null = null;

// === Helpers ===
const toNumber = (val: string): number => {
  if (!val) return 0;
  const cleaned = val.replace(/[$,%]/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
};

// === Find newest file ===
async function findNewestHoldingsFile(): Promise<Result<string>> {
  const dir = join(process.cwd(), 'data', 'commsec', 'holdings');
  const files = await readdir(dir);

  const csvFiles = files
    .filter(f => /^Holdings_\d+_\d{2}-\d{2}-\d{4}\.csv$/.test(f))
    .map(f => {
      const match = f.match(/_(\d{2})-(\d{2})-(\d{4})\.csv$/);
      if (!match) return null;
      const [dd, mm, yyyy] = match.slice(1);
      const date = new Date(`${yyyy}-${mm}-${dd}`);
      return { name: f, time: date.getTime() };
    })
    .filter((f): f is { name: string; time: number } => f !== null)
    .sort((a, b) => b.time - a.time);

  if (csvFiles.length === 0) {
    return error(new Error('No Holdings_*.csv file found in ./data/commsec/holdings/'));
  }

  return value(join(dir, csvFiles[0]?.name ?? ""));
}

export async function loadHoldings(): Promise<Result<CommsecHoldings>> {

   // If we already have a cache for *exactly this file*, return it
 if (cache) { // TODO: implement expiry.
    console.log("[Memory] Retrived commsec holdings.");
   return cache.result;
 }


  const filePath = await findNewestHoldingsFile();

  if(filePath.type === "error") {
    return filePath;
  }

  const content = await readFile(filePath.value, 'utf-8');
  const lines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  let accountNumber = '';
  let asOfDateTime = '';
  const holdings: HoldingEntry[] = [];
  let summary: HoldingSummary | null = null;

  for (const line of lines) {
    // Skip headers and section titles
    if (
      line.startsWith('Code,') ||
      line.startsWith('CHESS') ||
      line.startsWith('Issuer Sponsored Holdings') ||
      line.startsWith('There are no') ||
      line.includes('Share Holdings')
    ) {
      continue;
    }

    // Account Number
    if (line.startsWith('Account Number:')) {
      accountNumber = line.replace('Account Number:', '').trim();
      continue;
    }

    // As-of timestamp (quoted)
    // "Share Holdings    As of 2:42:03 PM Sydney Time, 28 Oct 2025"
    if (line.includes('As of') && line.includes('Sydney Time')) {
      const match = line.match(/"(.+?)"/);
      asOfDateTime = (match ? match[1] : line) ?? "";
      continue;
    }

    // Parse CSV rows
    if (line.includes(',')) {
      const cols = parseCSVLine(line);

      // Skip subtotal or empty rows
      if (!cols[0] || cols[0] === 'Subtotal') continue;

      // Final Total line
      if (cols[0] === 'Total') {
        summary = {
          profitLoss: toNumber(cols[6] ?? ""),
          profitLossPercent: toNumber(cols[7] ?? ""),
          marketValue: toNumber(cols[8] ?? ""),
          weightPercent: toNumber(cols[9] ?? ""),
          valueChange: toNumber(cols[10] ?? ""),
        };
        continue;
      }

      // Real holding entry
      if (cols.length >= 11) {
        const entry: HoldingEntry = {
          code: cols[0],
          availUnits: toNumber(cols[1] ?? ""),
          purchasePrice: toNumber(cols[2] ?? ""),
          lastPrice: toNumber(cols[3] ?? ""),
          changePrice: toNumber(cols[4] ?? ""),
          changePercent: toNumber(cols[5] ?? ""),
          profitLoss: toNumber(cols[6] ?? ""),
          profitLossPercent: toNumber(cols[7] ?? ""),
          marketValue: toNumber(cols[8] ?? ""),
          weightPercent: toNumber(cols[9] ?? ""),
          valueChange: toNumber(cols[10] ?? ""),
        };
        holdings.push(entry);
      }
    }
  }

  let result: Result<CommsecHoldings> | null = null;

  if (!accountNumber){ result = error(new Error('Account number not found')); }
  // if (!asOfDateTime) return error(new Error('As-of timestamp not found')); // TODO: fix
  else if (!summary){ result = error(new Error('Summary (Total) line not found')); }

  else { result = value({ accountNumber, asOfDateTime, holdings, summary }); }

  cache = {
    cachedAt: Date.now(),
    result: result
  };

  console.log("[Disk] Retrived commsec holdings from disk.");
  console.log("[Memory] Cached commsec holdings.");

  return result;
}