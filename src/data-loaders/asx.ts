import { file, write } from "bun";
import { join } from "path";
import { mkdirSync } from "fs";
import { readdir } from "fs/promises";
import { error, value, type Result } from "@/lib/lib";

interface ASXListedSecurities {
  datetime: string;
  entries: ASXListedSecurity[];
}

interface ASXListedSecurity {
  companyName: string;
  asxCode: string;
  gicsIndustyGroup: string;
}

const URL = "https://www.asx.com.au/asx/research/ASXListedSecurities.csv";

const CACHE_DIR = join(process.cwd(), "data", "asx", "listedcompanies");

/** Cache time-to-live (TTL) in 3600 seconds = 1 hour x 23 hours */
const CACHE_TTL = 3600 * 23;

let memoryCache: {
  data: ASXListedSecurities | undefined;
  timestamp: number;
} = { timestamp: 0, data: undefined };

// File example
/*
ASX listed companies as at Fri Oct 31 17:00:02 AEDT 2025

Company name,ASX code,GICS industry group
"1414 DEGREES LIMITED","14D","Capital Goods"
"29METALS LIMITED","29M","Materials"
"333D LIMITED","T3D","Commercial & Professional Services"
"360 CAPITAL GROUP","TGP","Financial Services"
*/
const parseFile = (str: string): Result<ASXListedSecurities> => {
  console.log("[DEBUG] parseFile 1");

  const lines = str.split("\n");

  if (lines.at(0)?.startsWith("ASX listed companies as at ") !== true) {
    console.log("[DEBUG]", lines, lines.at(0));

    return error(
      new Error(
        `Expected "ASX listed companies as at ", but got "${lines.at(0)}".`,
      ),
    );
  }

  console.log("[DEBUG] parseFile 2");

  if (lines.at(1) !== "") {
    return error(new Error(`Expected Blank line, but got '${lines.at(1)}'.`));
  }

  console.log("[DEBUG] parseFile 3");

  if (
    lines.at(2)?.includes("Company name,ASX code,GICS industry group") !== true
  ) {
    console.log("[DEBUG] parseFile 33", `"${lines.at(2)}"`);

    return error(
      new Error(
        `Company name,ASX code,GICS industry group", but got "${lines.at(2)}".`,
      ),
    );
  }

  console.log("[DEBUG] parseFile 4");

  if (lines.at(3)?.startsWith('"') !== true) {
    return error(new Error(`Expected '"', but got "${lines.at(3)}".`));
  }

  console.log("[DEBUG] parseFile 5");

  // TODO: parse line function
  const entries = lines
    .slice(3)
    .map<ASXListedSecurity | undefined>((line) => {
      console.log("[DEBUG] parseFile 65", line);

      const cells = line.substring(1, line.length - 1).split('","');

      console.log("[DEBUG] parseFile 6", cells);

      if (cells.length !== 3) {
        console.warn("");
        //throw new Error("unhandled");
        return undefined;
      }

      console.log("[DEBUG] parseFile 67", cells);

      return {
        companyName: cells.at(0) ?? "",
        asxCode: cells.at(1) ?? "",
        gicsIndustyGroup: cells.at(2) ?? "",
      };
    })
    .filter((x) => x !== undefined);

  console.log("[DEBUG] parseFile 69", lines.at(0) ?? "", entries);

  return value({
    datetime: lines.at(0) ?? "",
    entries: entries,
  });
};

const fetchASXListedSecurities = async (): Promise<
  Result<ASXListedSecurities>
> => {
  try {
    console.log("[DEBUG] 1");

    const now = Date.now();

    // 1. Check in-memory cache
    if (memoryCache && now - memoryCache.timestamp <= CACHE_TTL) {
      console.log(`[Memory] Serving asx listed companies`);
      return value(memoryCache.data!);
    }

    console.log("[DEBUG] 2");

    // 2. check disk
    const cacheFiles = await readdir(CACHE_DIR);
    const csvFileName =
      cacheFiles
        .filter((file) => file.endsWith(".csv"))
        .sort()
        .reverse()
        .at(0) ?? ""; // Latest first

    const csvFile = file(join(CACHE_DIR, csvFileName));

    const csvText = await csvFile.text();

    if (csvText.length !== 0) {
      console.log("[DISK] Serving asx listed companies");

      const pf = parseFile(csvText);
      console.log("pf", pf);

      return parseFile(csvText);
    }

    console.log("[DEBUG] 3");

    // 3. check network
    const response = await fetch(URL, {
      headers: {
        "User-Agent": "Bun/1.1.35",
        Accept: "application/json",
      },
    });

    // TODO: perist to cache /data/asx/listedcompanies/{timestamp}.csv
    const text = await response.text();

    console.log("[DEBUG] 4");

    // 4. persist to disk
    await write(file(join(CACHE_DIR, `${now}.csv`)), text);

    const parsedFile = parseFile(text);

    if (parsedFile.type === "value") {
      memoryCache = {
        timestamp: now,
        data: parsedFile.value,
      };
    }

    console.log("[NETWORK] Serving asx listed companies");

    return parsedFile;
  } catch (err) {
    return error(
      new Error("Failed to fetch asx data, see cause...", {
        cause: err,
      }),
    );
  }
};

export { fetchASXListedSecurities };
