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
          return (
            <>
              <table style={style}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Reference</th>
                    <th>Details</th>
                    <th>Debit</th>
                    <th>Credit</th>
                    <th>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {v.map((t) => (
                    <tr key={t.reference}>
                      <td>{t.date}</td>
                      <td>{t.reference}</td>
                      <td>
                        <Details details={t.details} />
                      </td>
                      <td>{toAUD(t.debit)}</td>
                      <td>{toAUD(t.credit)}</td>
                      <td>{toAUD(t.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <button
                onClick={(_e) => alert("TODO: Implement missing feature.")}
              >
                Import Commsec Transactions
              </button>

              <p>
                Commsec{" | "}
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href="https://www2.commsec.com.au/Portfolio/transactions"
                >
                  Transactions
                </a>
              </p>
            </>
          );
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
      <Link to="/efts/$id" params={{ id: ds[2]?.toLowerCase() }}>
        {ds[2]}
      </Link>{" "}
      {ds[3]} {ds[4]}
    </>
  );
};

export default Transactions;
