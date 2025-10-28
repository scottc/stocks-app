// csvLoader.ts
import { file } from "bun";
import { readdir } from "fs/promises";
import { join } from "path";
import { value, error, type Result } from "@/lib";

const TRANSACTIONS_DIR = join(process.cwd(), "data", "transactions");

export interface CommsecTransaction {
  date: string;
  reference: string;
  details: string;
  debit: number;
  credit: number;
  balance: number;
}

// In-memory cache: filename → parsed data
const csvCache = new Map<
  string,
  { data: CommsecTransaction[]; timestamp: number }
>();
const CACHE_TTL = 60 * 60 * 1000 * 23; // 23 hour in ms

// Helper: Parse CSV string into array of objects
function parseCsv(content: string): CommsecTransaction[] {
  const lines = content.trim().split("\n");
  const headers = lines[0]?.split(",");

  return lines
    .slice(1)
    .map((line, i): CommsecTransaction => {

      const values = line.split(",");
      
      // if (values.length !== headers?.length) {
      //   console.warn(`Skipping malformed line ${i + 2}: ${line}`);
      //   return null;
      // }

      const x: CommsecTransaction = {
        date: values[0]?.trim() ?? "",
        reference: values[1]?.trim() ?? "",
        details: values[2]?.trim() ?? "",
        debit: parseFloat(values[3]?.trim() ?? ""),
        credit: parseFloat(values[4]?.trim() ?? ""),
        balance: parseFloat(values[5]?.trim() ?? ""),
      };

      return x;
    });
}

// Main function
export async function loadLatestTransactions(): Promise<
  Result<CommsecTransaction[]>
> {
  try {
    // 1. Read directory
    const files = await readdir(TRANSACTIONS_DIR);
    const csvFiles = files
      .filter((f) => f.startsWith("Transactions_") && f.endsWith(".csv"))
      .sort()
      .reverse(); // Latest first

    if (csvFiles.length === 0) {
      return error(new Error("No transaction CSV files found"));
    }

    const latestFile = csvFiles[0] ?? "";
    const filePath = join(TRANSACTIONS_DIR, latestFile);
    const fileObj = file(filePath);

    // 2. Check in-memory cache
    const now = Date.now();
    const cached = csvCache.get(latestFile);
    if (cached && now - cached.timestamp < CACHE_TTL) {
      console.log(`[Cache] Serving ${latestFile} from memory`);
      return value(cached.data);
    }

    // 3. Read & parse file
    if (!(await fileObj.exists())) {
      return error(new Error(`File not found: ${filePath}`));
    }

    const content = await fileObj.text();
    const data = parseCsv(content);

    // 4. Cache in memory
    csvCache.set(latestFile, { data, timestamp: now });
    console.log(`[Disk] Loaded and cached ${latestFile} (${data.length} rows)`);

    return value(data);
  } catch (err) {
    console.error("Failed to load transactions:", err);
    return error(err instanceof Error ? err : new Error(String(err)));
  }
}
