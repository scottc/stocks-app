import client from "@/client";
import { Card } from "@/components/Card";
import Signals from "@/components/Signals";
import type { YahooChartResultItem } from "@/data-loaders/yahoo-finance-charts";
import { calculateScottScore, type Candlestick } from "@/fin/scottScore";
import {
  last,
  toIntegerAU,
  toPercentAU,
  type CrossExchangeTickerSymbol,
} from "@/store/lib";
import { createFileRoute, Link, useLoaderData } from "@tanstack/react-router";
import { useSelector } from "@xstate/react";
import { actor } from "@/store";

import type { CSSProperties } from "react";
import React from "react";

export const Route = createFileRoute("/efts/$id/score")({
  component: EftSignalsPage,
  loader: async ({ params }) =>
    await client.api.yahoo
      .chart({ symbol: `${params.id.toUpperCase()}.AX` })({ interval: "1d" })
      .get(),
});

function EftSignalsPage() {
  const { id } = Route.useParams();
  const d = useLoaderData({ from: "/efts/$id/score" });

  const r = d.data?.value?.chart.result[0];

  return (
    <>
      <ScoreCard
        data={r}
        ticker={{ commsec: id, yahoo: `${id}.AX` }}
      ></ScoreCard>
    </>
  );
}

interface ScoreProps {
  ticker: CrossExchangeTickerSymbol;
  data: YahooChartResultItem | undefined;
}

const ScoreCard: React.FC<ScoreProps> = (props) => {
  const yts = props.data?.timestamp ?? [];
  const yq = props.data?.indicators?.quote.at(0);

  const cs = yts
    .map<Candlestick>((v, i, a) => ({
      timestamp: v,
      close: yq?.close.at(i) ?? 0,
      high: yq?.high.at(i) ?? 0,
      low: yq?.low.at(i) ?? 0,
      open: yq?.open.at(i) ?? 0,
      volume: yq?.volume.at(i) ?? 0,
    }))
    .filter((x) => x.volume !== 0);

  const weights = useSelector(actor, (s) => s.context.weights);
  const scottScore = calculateScottScore(cs, weights);

  return (
    <Card>
      <h2>{props.ticker.commsec} Score</h2>

      <div
        style={{
          width: "100%",
          display: "grid",
          gridTemplateColumns: "25% 25% 25% 25%",
          gridTemplateRows: "auto",
        }}
      >
        <p
          style={{
            color: color(scottScore.trackRecordFactor),
            fontSize: size(weights.proven),
            //fontWeight: weight(scottScore.trackRecordFactor),
            textAlign: "center",
          }}
        >
          <strong>
            {scottScore.trackRecordFactor < 0.333 && "Experimental"}
            {scottScore.trackRecordFactor > 0.333 &&
              scottScore.trackRecordFactor < 0.666 &&
              "Moderate"}
            {scottScore.trackRecordFactor > 0.666 && "Proven"}
            <br />
            Track Record
          </strong>
          <br />
          <br />
          {toIntegerAU(scottScore.ageInDays)}
          <br />
          Days of Data
          <br />
          <small>
            <Score score={scottScore.trackRecordFactor} />
          </small>
        </p>

        <p
          style={{
            color: color(scottScore.returnScore),
            fontSize: size(weights.returns),
            //fontWeight: weight(scottScore.returnScore),
            //fontSize: size(scottScore.returnScore),
            textAlign: "center",
          }}
        >
          <strong>
            {scottScore.returnScore < 0.333 && "Stingy"}
            {scottScore.returnScore > 0.333 &&
              scottScore.returnScore < 0.666 &&
              "Decent"}
            {scottScore.returnScore > 0.666 && "Generous"}
            <br />
            Returns
          </strong>
          <br />
          <br />
          {toPercentAU(scottScore.annualizedReturn)}
          <br />
          <abbr title="Per Annum">PA</abbr>
          <br />
          <small>
            <Score score={scottScore.returnScore} />
          </small>
        </p>

        <p
          style={{
            color: color(scottScore.riskScore),
            fontSize: size(weights.risk),
            //fontWeight: weight(scottScore.riskScore),
            //fontSize: size(scottScore.riskScore),
            textAlign: "center",
          }}
        >
          <strong>
            {scottScore.riskScore < 0.333 && "Dangerous"}
            {scottScore.riskScore > 0.333 &&
              scottScore.riskScore < 0.666 &&
              "Skeptical"}
            {scottScore.riskScore > 0.666 && "Safe"}
            <br />
            Risk
          </strong>
          <br />
          <br />
          {toPercentAU(scottScore.annualizedVolatility)}
          <br />
          <abbr title="Per Annum Volatility">PA Volatility</abbr>
          <br />
          <small>
            <Score score={scottScore.riskScore} />
          </small>
        </p>

        <p
          style={{
            color: color(scottScore.liquidityFactor),
            fontSize: size(weights.liquidity),
            //fontWeight: weight(scottScore.liquidityFactor),
            //fontSize: size(scottScore.liquidityFactor),
            textAlign: "center",
          }}
        >
          <strong>
            {scottScore.liquidityFactor < 0.333 && "Barron"}
            {scottScore.liquidityFactor > 0.333 &&
              scottScore.liquidityFactor < 0.666 &&
              "Moderate"}
            {scottScore.liquidityFactor > 0.666 && "Bustling"}
            <br />
            Liquidity
          </strong>
          <br />
          <br />
          {toIntegerAU(scottScore.avgDailyVolume)}
          <br />
          <abbr title="Average Daily Volume">ADV</abbr>
          <br />
          <small>
            <Score score={scottScore.liquidityFactor} />
          </small>
        </p>
      </div>

      <p
        style={{
          color: color(scottScore.compositeScore),
          //fontWeight: weight(scottScore.compositeScore),
          fontSize: "24px",
          textAlign: "center",
        }}
      >
        <strong>Final Score</strong>
        <br />
        <br />
        <Score score={scottScore.compositeScore} />
      </p>
    </Card>
  );
};

export const Weights: React.FC<{}> = () => {
  const weights = useSelector(actor, (s) => s.context.weights);
  const send = actor.send;

  return (
    <>
      <label>Track Record:</label>
      <input
        type="number"
        value={weights.proven}
        step={0.01}
        onChange={(e) =>
          send({
            type: "weights.change",
            value: { ...weights, proven: parseFloat(e.target.value) },
          })
        }
      />

      <label>Returns:</label>
      <input
        type="number"
        value={weights.returns}
        step={0.01}
        onChange={(e) =>
          send({
            type: "weights.change",
            value: { ...weights, returns: parseFloat(e.target.value) },
          })
        }
      />

      <label>Risk Score:</label>
      <input
        type="number"
        value={weights.risk}
        step={0.01}
        onChange={(e) =>
          send({
            type: "weights.change",
            value: { ...weights, risk: parseFloat(e.target.value) },
          })
        }
      />

      <label>Liquidity:</label>
      <input
        type="number"
        value={weights.liquidity}
        step={0.01}
        onChange={(e) =>
          send({
            type: "weights.change",
            value: { ...weights, liquidity: parseFloat(e.target.value) },
          })
        }
      />
    </>
  );
};

const Score: React.FC<{ score: number }> = (props) => (
  <>{(props.score * 10).toFixed(1)} / 10</>
);

const color = (s: number) => {
  return `hsl(${s * 127}, 100%, 50%)`;
};

const weight = (s: number) => {
  return 100 + 800 * s;
};

const size = (s: number) => {
  return 18;
  //return 14 + s * 10;
};
