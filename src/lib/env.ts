import type { Unit } from "./lib";

console.log(process.env.FINNHUB_API_KEY ?? "foobar");

function finhubApiKey(
  e: NodeJS.ProcessEnv,
): Unit | { type: "value"; value: string } {
  return e.FINNHUB_API_KEY === undefined
    ? { type: "unit" }
    : { type: "value", value: e.FINNHUB_API_KEY };
}
