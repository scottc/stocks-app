import { error, value, type Result } from "@/store/lib";
import {
  FileSystem,
  Path,
  HttpClient,
  FetchHttpClient,
} from "@effect/platform";
import { Effect, Schema, DateTime } from "effect";
import { readdir, readFile } from "fs/promises";
import { join } from "path";

const commsecHoldingEntrySchema = Schema.Struct({
  code: Schema.String,
  availUnits: Schema.Number,
  purchasePrice: Schema.Number,
  lastPrice: Schema.Number,
  changePrice: Schema.Number,
  changePercent: Schema.Number,
  profitLoss: Schema.Number,
  profitLossPercent: Schema.Number,
  marketValue: Schema.Number,
  weightPercent: Schema.Number,
  valueChange: Schema.Number,
});

const commsecSummarySchema = Schema.Struct({
  profitLoss: Schema.Number,
  profitLossPercent: Schema.Number,
  marketValue: Schema.Number,
  weightPercent: Schema.Number,
  valueChange: Schema.Number,
});

const comsecHoldingsSchema = Schema.Struct({
  accountNumber: Schema.String,
  asOfDateTime: Schema.String,
  holdings: Schema.Array(commsecHoldingEntrySchema),
  summary: commsecSummarySchema,
});

type CommsecHoldings = Schema.Schema.Type<typeof comsecHoldingsSchema>;
type HoldingEntry = Schema.Schema.Type<typeof commsecHoldingEntrySchema>;
type HoldingSummary = Schema.Schema.Type<typeof commsecSummarySchema>;

const fetchAllAccountsAllHoldings = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;

  const cwd = path.resolve(".");
  const dir = path.join(cwd, "data", "commsec", "holdings");

  const accountsHoldingsFilePaths = yield* fs.readDirectory(dir, {
    recursive: true,
  });

  const files = accountsHoldingsFilePaths.map((f) => path.join(dir, f));

  const parsed = files.map(parse);

  // TODO: parse using schema.
  // TODO: cache in memory.

  return parsed;
});

const fetchAccountHoldings = (accountId: string) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;

    const cwd = path.resolve(".");
    const dir = path.join(cwd, "data", "commsec", "holdings", accountId);

    console.log(dir);

    const holdings = yield* fs.readDirectory(dir);

    console.log(holdings);

    const contents = yield* fs.readFileString(
      path.join(dir, holdings[0] ?? ""),
    );

    console.log(contents);

    const parsed = parse(contents);

    console.log(parsed);

    // TODO: handle not found.
    // TODO: parse using schema.
    // TODO: cache in memory.

    return parsed;
  });

const toNumber = (val: string): number => {
  if (!val) return 0;
  const cleaned = val.replace(/[$,%]/g, "").trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = "";
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
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
};

const parse = (content: string): Result<CommsecHoldings> => {
  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  let accountNumber = lines.at(0);
  let asOfDateTime = lines.at(1);
  const holdings: HoldingEntry[] = [];
  let summary: HoldingSummary | null = null;

  for (const line of lines) {
    // Skip headers and section titles
    if (
      line.startsWith("Code,") ||
      line.startsWith("CHESS") ||
      line.startsWith("Issuer Sponsored Holdings") ||
      line.startsWith("There are no") ||
      line.includes("Share Holdings")
    ) {
      continue;
    }

    // Account Number
    if (line.startsWith("Account Number:")) {
      accountNumber = line.replace("Account Number:", "").trim();
      continue;
    }

    // "Share Holdings    As of 2:42:03 PM Sydney Time, 28 Oct 2025"
    if (line.includes('"Share Holdings')) {
      asOfDateTime = line;
      continue;
    }

    // Parse CSV rows
    if (line.includes(",")) {
      const cols = parseCSVLine(line);

      // Skip subtotal or empty rows
      if (!cols[0] || cols[0] === "Subtotal") continue;

      // Final Total line
      if (cols[0] === "Total") {
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

  if (!accountNumber) {
    result = error(new Error("Account number not found"));
  } else if (!asOfDateTime) {
    return error(new Error("As-of timestamp not found")); // TODO: fix
  } else if (!summary) {
    result = error(new Error("Summary (Total) line not found"));
  } else {
    result = value({
      accountNumber,
      asOfDateTime: asOfDateTime ?? "",
      holdings,
      summary,
    });
  }

  return result;
};

export {
  fetchAllAccountsAllHoldings,
  fetchAccountHoldings,
  type CommsecHoldings,
  type HoldingEntry,
};
