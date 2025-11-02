/**
 * A Unit type, that represents a single possible value
 * unit(); // Unit
 * [1, 2, 3].map(unit); // [Unit, Unit, Unit]
 */
export interface Unit {
  type: "unit";
}
const UNIT: Unit = { type: "unit" };

const unit = (): Unit => UNIT;

/**
 * Aka
 * The Some type.
 * The Value type.
 * The Result type.
 */
export interface ValueResult<T /* , E = Error*/> {
  type: "value";
  value: T;
  error: undefined;
}

export interface ErrorResult</*T,*/ E = Error> {
  type: "error";
  value: undefined;
  error: E;
}

export interface InitResult /*<T, E = Error>*/ {
  type: "init";
  value: undefined;
  error: undefined;
}

export interface LoadingResult /*<T, E = Error>*/ {
  type: "loading";
  value: undefined;
  error: undefined;
}

export type Result<T, E = Error> =
  | ValueResult<T /*, E*/>
  | ErrorResult</*T, */ E>;

// TODO: rename to AsyncState??
export type AsyncResult<T, E = Error> =
  | InitResult //<T, E>
  | LoadingResult //<T, E>
  | ValueResult<T /*, E*/>
  | ErrorResult</*T, */ E>;

// TODO: rename to errorResult?
function error<T, E = Error>(error: E): Result<T, E> {
  return {
    type: "error",
    error: error,
    value: undefined,
  };
}

// TODO: rename to valueResult?
function value<T, E = Error>(value: T): Result<T, E> {
  return {
    type: "value",
    value: value,
    error: undefined,
  };
}

// TODO: rename to loadingState?
function loading<T, E = Error>(): AsyncResult<T, E> {
  return {
    type: "loading",
    value: undefined,
    error: undefined,
  };
}

// TODO: rename to initState?
function init<T, E = Error>(): AsyncResult<T, E> {
  return {
    type: "init",
    value: undefined,
    error: undefined,
  };
}

interface AsyncResultMatchBody<T, E, R> {
  init: () => R;
  loading: () => R;
  error: (e: E) => R;
  value: (v: T) => R;
}

function match<T, E, R>(
  value: AsyncResult<T, E>,
  body: AsyncResultMatchBody<T, E, R>,
): R {
  switch (value.type) {
    case "init":
      return body.init();
    case "loading":
      return body.loading();
    case "value":
      return body.value(value.value);
    case "error":
      return body.error(value.error);
    default:
      throw new Error(
        `Unexpected, expected value.type to be one of the following init, loading, value or error, but got 'never', see static type vs runtime object: ${JSON.stringify(value)}.`,
      );
  }
}

function first<T>(arr: T[] | undefined): T | undefined {
  return arr?.[0];
}

function last<T>(arr: T[] | undefined): T | undefined {
  return arr?.[(arr?.length ?? 0) - 1];
}

function previous<T>(arr: T[] | undefined, index: number): T | undefined {
  return arr?.[(arr?.length ?? 0) - 1 - index];
}

function pctDiff(close: number, open: number): number {
  if (open === 0) {
    return 0;
    //throw new Error("Cannot calculate percentage change with zero open price.");
  }

  return (close - open) / open;
}

const up = "▲";
const eq = "▶";
const down = "▼";

const upColor = "#00da3c";
const eqColor = "#ecda3c";
const downColor = "#ec0000";

const color = (x: number) => {
  if (x > 0) {
    return upColor;
  } else if (x < 0) {
    return downColor;
  } else {
    return eqColor;
  }
};

const color2 = (x: "hold" | "buy" | "sell") => {
  switch (x) {
    case "buy":
      return upColor;
    case "sell":
      return downColor;
    case "hold":
      return eqColor;
  }
};

const icon = (x: number) => {
  if (x > 0) {
    return up;
  } else if (x < 0) {
    return down;
  } else {
    return eq;
  }
};

const toDecimalAU = (value: number) =>
  new Intl.NumberFormat("en-AU", { style: "decimal" }).format(value);

const toPercentAU = (value: number) =>
  new Intl.NumberFormat("en-AU", {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

//const toUnitAU = (value: number) =>
//  new Intl.NumberFormat("en-AU", { style: "unit" }).format(value);

const toAUD = (value: number | bigint | Intl.StringNumericLiteral): string =>
  new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(
    value,
  );

/**
 * Yahoo:
 * Indexes are prefixed with: ^
 * Australian Exchange Ticker Symbols are suffixed with: .AX
 *
 * Commsec:
 * Ticker Symbols are called stockCode & exchangeCode.
 */
export interface CrossExchangeTickerSymbol {
  commsec: string;
  yahoo: string;
}

const watchList: CrossExchangeTickerSymbol[] = [
  {
    // Top 100 global Big Cap
    commsec: "IOO",
    yahoo: "IOO.AX",
  },
  {
    commsec: "VAE",
    yahoo: "VAE.AX",
  },
  {
    commsec: "TECL",
    yahoo: "TECL",
  },
  {
    // Precious Metals
    commsec: "ETPMPM",
    yahoo: "ETPMPM.AX",
  },
  {
    // Australian Property
    commsec: "VAP",
    yahoo: "VAP.AX",
  },
];

const other = [
  {
    // Vangard Global Big, Medium & Small Cap
    commsec: "VTI",
    yahoo: "VTI",
  },
  {
    // Precious Metals
    commsec: "ETPMPM",
    yahoo: "ETPMPM.AX",
  },
  {
    // Australian Property
    commsec: "VAP",
    yahoo: "VAP.AX",
  },
  {
    commsec: "OZR",
    yahoo: "OZR.AX",
  },
  {
    // Non-Australian Property
    commsec: "GLPR",
    yahoo: "GLPR.AX",
  },
  {
    // Aus Government bonds
    commsec: "GOVT",
    yahoo: "GOVT.AX",
  },
  {
    commsec: "OZF",
    yahoo: "OZF.AX",
  },
  // {
  //   commsec: "XJO",
  //   yahoo: "^AXJO",
  // },
  //{
  //  commsec: "VAS",
  //  yahoo: "VAS.AX",
  //},
];

export {
  watchList,
  UNIT,
  unit,
  value,
  error,
  loading,
  init,
  match,
  first,
  last,
  previous,
  pctDiff,
  toAUD,
  toDecimalAU,
  toPercentAU,
  // toUnitAU,
  color,
  color2,
  icon,
};
