import type { CSSProperties } from "react";
import { Card } from "./Card";

const buttonStyle: CSSProperties = {
  // backgroundColor: "#04AA6D",
  border: "none",
  color: "white",
  padding: "20px",
  textAlign: "center",
  textDecoration: "none",
  display: "inline-block",
  fontSize: "16px",
  margin: "4px 2px",
  cursor: "pointer",
  borderRadius: "999px",
};

const LocalLinks = ({ p }: { p: string }) => (
  <Card>
    
    <h2>Yahoo {p} Links</h2>

    <ul>
      <li>
        <a href={`https://finance.yahoo.com/quote/${p}/history/?p=${p}`}>
          View {p} History
        </a>
      </li>
      <li>
        <a target="_blank" href={`https://finance.yahoo.com/chart/${p}`}>
          View {p} Chart
        </a>
      </li>
      <li>
        <a
          target="_blank"
          href={`https://query1.finance.yahoo.com/v8/finance/chart/${p}?period1=0&period2=9999999999&interval=1d&includePrePost=false&includeAdjustedClose=true&events=div%7Csplit`}
        >
          View {p} Raw Chart Data
        </a>
      </li>
    </ul>
  </Card>
);

const YahooLinks = ({ p }: { p: string }) => (
  <Card>
    <h2>Yahoo {p} Links</h2>

    <ul>
      <li>
        <a href={`https://finance.yahoo.com/quote/${p}/history/?p=${p}`}>
          View {p} History
        </a>
      </li>
      <li>
        <a target="_blank" href={`https://finance.yahoo.com/chart/${p}`}>
          View {p} Chart
        </a>
      </li>
      <li>
        <a
          target="_blank"
          href={`https://query1.finance.yahoo.com/v8/finance/chart/${p}?period1=0&period2=9999999999&interval=1d&includePrePost=false&includeAdjustedClose=true&events=div%7Csplit`}
        >
          View {p} Raw Chart Data
        </a>
      </li>
    </ul>
  </Card>
);

const CommsecLinks = ({ code }: { code: string }) => (
  <Card>
    <h2>{code} Commsec Links</h2>
    <a
      target="_blank"
      href={`https://www2.commsec.com.au/Private/EquityTrading/AustralianShares/PlaceOrder.aspx?actionType=buy&stockCode=${code}`}
      style={{ ...buttonStyle, backgroundColor: "#04AA6D" }}
    >
      Buy {code}
    </a>{" "}
    <a
      target="_blank"
      href={`https://www2.commsec.com.au/Private/EquityTrading/AustralianShares/PlaceOrder.aspx?actionType=sell&stockCode=${code}`}
      style={{ ...buttonStyle, backgroundColor: "#f00" }}
    >
      Sell {code}
    </a>
    <a
      target="_blank"
      href={`https://research.commsec.com.au/alerts/create?code=${code}&exchange=ASX`}
      style={{ ...buttonStyle, backgroundColor: "#ff0", color: "#000" }}
    >
      🔔 Create {code} Alert
    </a>
    <ul>
      <li>
        <a
          target="_blank"
          href={`https://www2.commsec.com.au/quotes/derivatives?stockCode=${code}&exchangeCode=ASX`}
        >
          💹 View {code} Derivatives
        </a>
      </li>
      <li>
        <a
          target="_blank"
          href={`https://www2.commsec.com.au/quotes/charts?stockCode=${code}&exchangeCode=ASX`}
        >
          📈 View {code} Charts
        </a>
      </li>
      <li>
        <a
          target="_blank"
          href={`https://www2.commsec.com.au/quotes/announcements?stockCode=${code}&exchangeCode=ASX`}
        >
          📢 View {code} Announcements
        </a>
      </li>
      <li>
        <a
          target="_blank"
          href={`https://www2.commsec.com.au/quotes/summary?stockCode=${code}&exchangeCode=ASX`}
        >
          📑 View {code} Summary
        </a>
      </li>
      <li>
        <a
          target="_blank"
          href={`https://www2.commsec.com.au/Quotes?stockCode=${code}&exchangeCode=ASX`}
        >
          📝 View {code} Quotes
        </a>
      </li>
      {/* {" | "}<a target="_blank" href={``}></a>
            {" | "}<a target="_blank" href={``}></a>
            {" | "}<a target="_blank" href={``}></a>
            {" | "}<a target="_blank" href={``}></a> */}
    </ul>
  </Card>
);

export { CommsecLinks, YahooLinks };
