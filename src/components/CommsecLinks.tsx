const CommsecLinks = ({ code }: { code: string }) => (
      <div
        style={{
          border: "5px solid black",
          margin: "10px",
          padding: "10px",
          background: "rgba(0,0,0,0.2)",
        }}
      >
        <h2>{code} Commsec Links</h2>

        <p>
            {" | "}<a target="_blank" href={`https://www2.commsec.com.au/Private/EquityTrading/AustralianShares/PlaceOrder.aspx?actionType=buy&stockCode=${code}`}>Buy</a>
            {" | "}<a target="_blank" href={`https://www2.commsec.com.au/Private/EquityTrading/AustralianShares/PlaceOrder.aspx?actionType=sell&stockCode=${code}`}>Sell</a>
            
            {" | "}<a target="_blank" href={`https://research.commsec.com.au/alerts/create?code=${code}&exchange=ASX`}>Create Alert</a>

            {" | "}<a target="_blank" href={`https://www2.commsec.com.au/quotes/derivatives?stockCode=${code}&exchangeCode=ASX`}>Derivatives</a>
            {" | "}<a target="_blank" href={`https://www2.commsec.com.au/quotes/charts?stockCode=${code}&exchangeCode=ASX`}>Charts</a>
            {" | "}<a target="_blank" href={`https://www2.commsec.com.au/quotes/announcements?stockCode=${code}&exchangeCode=ASX`}>Announcements</a>
            {" | "}<a target="_blank" href={`https://www2.commsec.com.au/quotes/summary?stockCode=${code}&exchangeCode=ASX`}>Summary</a>

            {/* {" | "}<a target="_blank" href={``}></a>
            {" | "}<a target="_blank" href={``}></a>
            {" | "}<a target="_blank" href={``}></a>
            {" | "}<a target="_blank" href={``}></a> */}
        </p>
    </div>
);

export {
    CommsecLinks,
};