import { type CSSProperties } from "react";
import { useCommsecHoldings } from "@/hooks/useCommsecHoldings";

import { match, type CrossExchangeTickerSymbol } from "@/store/lib";
import { ErrorView } from "./Error";
import { Card } from "./Card";
import { Link } from "@tanstack/react-router";

interface HoldingsProps {
  symbol?: CrossExchangeTickerSymbol;
  history?: number;
}

const style: CSSProperties = {
  border: "2px solid rgb(140 140 140)",
  borderCollapse: "collapse",
};

const Holdings = ({ symbol }: HoldingsProps) => {
  const holdings = useCommsecHoldings({});

  return (
    <Card>
      <h2>Holdings</h2>

      {match(holdings, {
        init: () => <></>,
        loading: () => <></>,
        value: (v) => {
          //const relevant = v.holdings.filter((x) => x.code === symbol.commsec);

          return <></>;
        },
        error: (e) => <ErrorView error={e} />,
      })}

      <button onClick={(_e) => alert("TODO: Not Yet Implemented.")}>
        Import Commsec Holdings CSV
      </button>

      <p>
        Commsec{" | "}
        <a
          target="_blank"
          rel="noopener noreferrer"
          href="https://www2.commsec.com.au/Portfolio/holdings"
        >
          Holdings
        </a>
      </p>
    </Card>
  );
};

export default Holdings;
