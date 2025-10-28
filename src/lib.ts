export interface ValueResult<T, E> {
    type: "value";
    value: T;
    error: undefined;
}

export interface ErrorResult<T, E = Error> {
    type: "error";
    value: undefined;
    error: E;
}

export interface InitResult<T, E = Error> {
    type: "init";
    value: undefined;
    error: undefined;
}

export interface LoadingResult<T, E = Error> {
    type: "loading";
    value: undefined;
    error: undefined;
}


export type Result<T, E = Error> = ValueResult<T, E> | ErrorResult<T, E>;

export type AsyncResult<T, E = Error> = InitResult<T, E> | LoadingResult<T, E> | ValueResult<T, E> | ErrorResult<T, E>;

function error<T, E = Error>(error: E): Result<T, E> {
    return ({
        type: "error",
        error: error,
        value: undefined,
    });
}

function value<T, E = Error>(value: T): Result<T, E> {
    return ({
        type: "value",
        value: value,
        error: undefined,
    });
}

function loading<T, E = Error>(): AsyncResult<T, E> {
    return ({
        type: "loading",
        value: undefined,
        error: undefined,
    });
}

function init<T, E = Error>(): AsyncResult<T, E> {
    return ({
        type: "init",
        value: undefined,
        error: undefined,
    });
}

interface AsyncResultMatchBody<T, E, R> {
  init: () => R;
  loading: () => R;
  error: (e: E) => R;
  value: (v: T) => R;
}

function match<T, E, R>(value: AsyncResult<T, E>, body: AsyncResultMatchBody<T, E, R>  ): R {
  switch(value.type) {
    case "init": return body.init();
    case "loading": return body.loading();
    case "value": return body.value(value.value);
    case "error": return body.error(value.error);
    default: throw new Error("Unexpected");
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
  
  return ((close - open) / open);
}

const up = "▲";
const eq = "▶"
const down = "▼";

const upColor = '#00da3c';
const eqColor = '#ecda3c';
const downColor = '#ec0000';

const color = (x :number) => {
  if (x > 0) {
    return upColor;
  } else if (x < 0) {
    return downColor;
  } else {
    return eqColor;
  }
}

const icon = (x :number) => {
  if (x > 0) {
    return up;
  } else if (x < 0) {
    return down;
  } else {
    return eq;
  }
}

const toDecimalAU = (value :number) => 
  new Intl.NumberFormat('en-AU', { style: "decimal" }).format(value);

const toPercentAU = (value :number) => 
  new Intl.NumberFormat('en-AU', { style: "percent", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

const toUnitAU = (value :number) => 
  new Intl.NumberFormat('en-AU', { style: "unit" }).format(value);

const toAUD = (value: number | bigint | Intl.StringNumericLiteral): string => 
  new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(value);

export type StockSymbol = "IOO" | "VAP" | "ETPMPM";
export const symbols: StockSymbol[] = ["IOO", "VAP", "ETPMPM"];

export {
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
    toUnitAU,
    color,
    icon
};