import { tryJson } from "@/lib/tryRead";
import { file } from "bun";
import { join } from "path";

interface CommsecEftScreener {
  apps: App[];
}

interface App {
  data: {
    data: InnerData;
    savedFilters: null;
    startingCriteria: null;
    symbol: string;
    wsodIssue: null;
    isETF: boolean;
    subscribeLink: string;
    buyStockLink: string;
    sellStockLink: string;
    detailedQuotesLink: string;
    manageOrdersLink: string;
    addToWatchlistLink: string;
    addToAlerts: string;
    resolvedUrl: string;
    resolvedCdnUrl: string;
    isWestpac: boolean;
    isCAS: boolean;
    isCommSec: boolean;
    isPremium: boolean;
    hideSubscribe: boolean;
  };
  html: string;
  id: string;
  status: string;
  statusMessage: null;
}

interface InnerData {
  criteriaRanges: {
    criteriaResults: CriteriaResult[];
  };
  screenResults: ScreenResults;
}

interface CriteriaResult {
  max: number | null;
  min: number | null;
  field: string;
}

interface ScreenResults {
  matches: number;
  rows: Row[];
}

export interface Row {
  results: ScreenerResult[];
}

export interface ScreenerResult {
  field: string;
  value: string | number | null;
}

// https://research.commsec.com.au/F2/Apps/json?params=[{"appId":"com_cs_research_securities_screener","description":"CommSec+OpenF2+App+=>+com_cs_research_securities_screener","name":"CommSec+OpenF2+App+=>+com_cs_research_securities_screener","manifestUrl":"/F2/Apps/json","context":{"containerId":"content_com_cs_research_securities_screener"},"instanceId":"","views":["home"]}]
const commsecEftScreener = await tryJson<CommsecEftScreener>(
  file(
    join(process.cwd(), "data", "commsec", "etfscreener", "1762327556624.json"),
  ),
);

export { commsecEftScreener };
