import { assign, createActor, setup } from "xstate";
import { createBrowserInspector } from "@statelyai/inspect";
import type { YahooStockData } from "@/data-loaders/yahoo-finance-charts";
import type { CommsecHoldings } from "@/data-loaders/commsec-holdings";
import type { CommsecTransaction } from "@/data-loaders/commsec-transactions";
import type { ScottScoreWeights } from "@/fin/scottScore";

const stocksAppSetup = setup({
  types: {
    context: {} as {
      historyPeriod: number;
      weights: ScottScoreWeights;
      yahoo?: YahooStockData;
      commsecHolding?: CommsecHoldings;
      commsecTransactions?: CommsecTransaction;
      ai: {
        input: string;
      };
    },
    events: {} as
      | {
          type: "ai.input.change";
          value: string;
        }
      | {
          type: "weights.change";
          value: ScottScoreWeights;
        }
      | {
          type: "historyPeriod.change";
          value: number;
        },
  },
  guards: {
    feedbackValid: ({ context }) => context.historyPeriod !== 3,
  },
});

const stocksAppMachine = stocksAppSetup.createMachine({
  id: "stocks-app",
  initial: "init",
  context: {
    ai: {
      input: "What's the temp in Tokyo?",
    },
    historyPeriod: 63,
    weights: {
      // Biases, how important are each of these factors, in relevence to each other.
      // should be a total sum of 1.0...
      proven: 0.5,
      returns: 0.3,
      risk: 0.15,
      liquidity: 0.05,
    },
  },
  states: {
    init: {
      on: {
        /*
        "ai.input.change": {
          actions: assign({
            ai: {
              input: ({ event }) => event.value,
            },
          }),
        },
        */
        "historyPeriod.change": {
          actions: assign({
            historyPeriod: ({ event }) => event.value,
          }),
        },
        "weights.change": {
          actions: assign({
            weights: ({ event }) => event.value,
          }),
        },
      },
    },
  },
});

const { inspect } = createBrowserInspector({
  // Comment out the line below to start the inspector
  autoStart: true, // TODO: dev vs production mode...
  // TODO: wrap inside of a react hook, and component?
  // useBrowserInspector() ...? ... which returns a component?
  iframe: document.getElementById("inspector-iframe") as HTMLIFrameElement,
});

const _options = { inspect: inspect };

const actor = createActor(stocksAppMachine /*, options*/).start();

export { actor };
