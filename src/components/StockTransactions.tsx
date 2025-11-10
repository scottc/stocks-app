import { type CSSProperties } from "react";
import { useCommsecTransactions } from "@/hooks/useCommsecTransactions";

import { match, toAUD, type CrossExchangeTickerSymbol } from "@/store/lib";
import { ErrorView } from "./Error";
import { Card } from "./Card";
import { Link } from "@tanstack/react-router";

interface TransactionsProps {
  symbol?: CrossExchangeTickerSymbol;
  history?: number;
}

const style: CSSProperties = {
  border: "2px solid rgb(140 140 140)",
  borderCollapse: "collapse",
};

const Transactions = ({
  symbol,
  //history
}: TransactionsProps) => {
  const transactions = useCommsecTransactions({});

  return (
    <Card>
      <h2>Transactions</h2>

      {match(transactions, {
        init: () => <></>,
        loading: () => <></>,
        value: (v) => {
          return <></>;
        },
        error: (e) => <ErrorView error={e} />,
      })}
    </Card>
  );
};

const Details: React.FC<{ details: string }> = ({ details }) => {
  const ds = details.split(" ");

  return (
    <>
      {ds[0]} {ds[1]}{" "}
      <Link
        to="/efts/$id/chart"
        params={{ id: ds[2]?.toLowerCase() ?? "ID_NOT_FOUND" }}
      >
        {ds[2]}
      </Link>{" "}
      {ds[3]} {ds[4]}
    </>
  );
};

export default Transactions;
