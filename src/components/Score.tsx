import {
  calculateScottScore,
  type Candlestick,
  type ScottScoreWeights,
} from "@/fin/scottScore";
import { useYahooStock } from "@/hooks/useYahooStock";
import type { CrossExchangeTickerSymbol } from "@/lib/lib";
import { Card } from "./Card";
import { useState } from "react";

interface ScoreProps {
  ticker: CrossExchangeTickerSymbol;
}

const Score: React.FC<ScoreProps> = (props) => {
  const yh = useYahooStock({ symbol: props.ticker.yahoo });
  const [weights, setWeights] = useState<ScottScoreWeights>({
    // Biases, how important are each of these factors, in relevence to each other.
    // should be a total sum of 1.0...
    proven: 0.5,
    returns: 0.3,
    risk: 0.15,
    liquidity: 0.05,
  });

  const yts = yh.value?.chart.result.at(0)?.timestamp ?? [];
  const yq = yh.value?.chart.result.at(0)?.indicators?.quote.at(0);

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

  const scottScore = calculateScottScore(cs, weights);

  return (
    <Card>
      <h2>{props.ticker.yahoo} Scott Scores</h2>

      <h3>Results</h3>

      <p
        style={{
          color: color(scottScore.trackRecordFactor),
          //fontWeight: weight(scottScore.trackRecordFactor),
          //fontSize: size(scottScore.trackRecordFactor),
        }}
      >
        <strong>Raw Track Record Factor:</strong>
        <br />
        {scottScore.trackRecordFactor}
      </p>

      <p
        style={{
          color: color(scottScore.returnScore),
          //fontWeight: weight(scottScore.returnScore),
          //fontSize: size(scottScore.returnScore),
        }}
      >
        <strong>Raw Return Score:</strong>
        <br />
        {scottScore.returnScore}
      </p>

      <p
        style={{
          color: color(scottScore.riskScore),
          //fontWeight: weight(scottScore.riskScore),
          //fontSize: size(scottScore.riskScore),
        }}
      >
        <strong>Risk Score:</strong>
        <br />
        {scottScore.riskScore}
      </p>

      <p
        style={{
          color: color(scottScore.liquidityFactor),
          //fontWeight: weight(scottScore.liquidityFactor),
          //fontSize: size(scottScore.liquidityFactor),
        }}
      >
        <strong>Raw Liquidity Factor:</strong>
        <br />
        {scottScore.liquidityFactor}
      </p>

      <p
        style={{
          color: color(scottScore.compositeScore),
          //fontWeight: weight(scottScore.compositeScore),
          //fontSize: size(scottScore.compositeScore),
        }}
      >
        <strong>Weighted Composite Score:</strong>
        <br />
        {scottScore.compositeScore}
      </p>

      <h3>Weights</h3>

      <div>
        <label>Track Record:</label>
        <input
          type="number"
          value={weights.proven}
          step={0.01}
          onChange={(e) =>
            setWeights({ ...weights, proven: parseFloat(e.target.value) })
          }
        />
      </div>

      <div>
        <label>Returns:</label>
        <input
          type="number"
          value={weights.returns}
          step={0.01}
          onChange={(e) =>
            setWeights({ ...weights, returns: parseFloat(e.target.value) })
          }
        />
      </div>

      <div>
        <label>Risk Score:</label>
        <input
          type="number"
          value={weights.risk}
          step={0.01}
          onChange={(e) =>
            setWeights({ ...weights, risk: parseFloat(e.target.value) })
          }
        />
      </div>

      <div>
        <label>Liquidity:</label>
        <input
          type="number"
          value={weights.liquidity}
          step={0.01}
          onChange={(e) =>
            setWeights({ ...weights, liquidity: parseFloat(e.target.value) })
          }
        />
      </div>
    </Card>
  );
};

const color = (s: number) => {
  return `hsl(${s * 127}, 100%, 50%)`;
};

const weight = (s: number) => {
  return 100 + 800 * s;
};

const size = (s: number) => {
  return 14 + s * 8;
};

export { Score };
