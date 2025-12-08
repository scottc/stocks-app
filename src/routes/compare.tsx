import client from "@/client";
import Holdings from "@/components/StockHoldings";
import type { YahooChartResultItem } from "@/data-loaders/yahoo-finance-charts";
import { createFileRoute, useLoaderData } from "@tanstack/react-router";

interface SearchParams {}

export const Route = createFileRoute("/compare")({
  component: ComparePage,
  loader: async () => {
    // TODO: parallelize in Promise.all()...

    const efts =
      (await client.api.commsec.eftscreener.get()).data?.apps[0]?.data.data
        .screenResults.rows ?? [];

    const accountIds = (await client.api.commsec.accounts.get()).data ?? [];

    const fetchIds = accountIds.map((id) =>
      client.api.commsec.accounts({ id }).holdings.get(),
    );

    const holdings = (await Promise.all(fetchIds))
      .map((r) => r.data?.value)
      .filter((acc) => acc !== undefined);

    const codes = holdings.flatMap((h) => h.holdings).map((h) => h.code); // TODO filter by unique...

    const fetchData = codes.map((c) =>
      client.api.yahoo
        .chart({ symbol: `${c}.AX` })({ interval: "1d" })
        .get(),
    );

    const securities = (await Promise.all(fetchData))
      .map((r) => r.data?.value?.chart.result[0])
      .filter((x) => x !== undefined);

    const hs = holdings
      .flatMap((h) => h.holdings)
      .map((h) => ({
        holding: h,
        security: securities.find((s) => s.meta.symbol === h.code + ".AX"),
      }));

    return {
      accountIds,
      efts: efts,
      holdings,
      securities,
      hs,
    };
  },
  validateSearch: (search: Record<string, unknown>): SearchParams => ({}),
});

function ComparePage() {
  const { accountIds, efts, holdings, securities, hs } = useLoaderData({
    from: "/compare",
  });

  const lastClose = (x: YahooChartResultItem | undefined): number => {
    const li = x?.indicators.quote[0]?.close.findLast(
      (y) => y !== undefined && y !== null,
    );

    return li ?? 0;
  };

  const total = hs.reduce(
    (a, b, _c) => a + lastClose(b.security) * b.holding.availUnits,
    0,
  );

  console.log("totatl:", total, hs);

  return (
    <div>
      <DataList id="efts" rows={efts} />
      <h2>Compare</h2>

      <table>
        <thead>
          <tr>
            <th>Security</th>
            <th>Holdings %</th>
            <th>Portfolio A %</th>
            <th>Portfolio B %</th>
            <th>Portfolio C %</th>
          </tr>
        </thead>
        <tbody>
          {hs.map((x) => (
            <tr key={x.holding.code}>
              <td>
                <input list="efts" disabled={true} value={x.holding.code} />
              </td>
              <td>
                <input
                  type="number"
                  disabled={true}
                  value={
                    ((x.holding.availUnits * lastClose(x.security)) / total) *
                    100
                  }
                ></input>
              </td>
              <td>
                <input value={0}></input>
              </td>
              <td>
                <input value={0}></input>
              </td>
              <td>
                <input value={0}></input>
              </td>
            </tr>
          ))}
          <tr>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
          </tr>
          <tr>
            <td>
              <input list="efts" value={""} />
            </td>
            <td>
              <input type="number" disabled={true} value={0} />
            </td>
            <td>
              <input type="number" value={100} />
            </td>
            <td>
              <input type="number" value={0} />
            </td>
            <td>
              <input type="number" value={0} />
            </td>
          </tr>
          <tr>
            <td>
              <input list="efts" value={""} />
            </td>
            <td>
              <input type="number" disabled={true} value={0} />
            </td>
            <td>
              <input type="number" value={0} />
            </td>
            <td>
              <input type="number" value={50} />
            </td>
            <td>
              <input type="number" value={0} />
            </td>
          </tr>
          <tr>
            <td>
              <input list="efts" value={""} />
            </td>
            <td>
              <input type="number" disabled={true} value={0} />
            </td>
            <td>
              <input type="number" value={0} />
            </td>
            <td>
              <input type="number" value={50} />
            </td>
            <td>
              <input type="number" value={33} />
            </td>
          </tr>
          <tr>
            <td>
              <input list="efts" value={""} />
            </td>
            <td>
              <input type="number" disabled={true} value={0} />
            </td>
            <td>
              <input type="number" value={0} />
            </td>
            <td>
              <input type="number" value={0} />
            </td>
            <td>
              <input type="number" value={33} />
            </td>
          </tr>
          <tr>
            <td>
              <input list="efts" value={""} />
            </td>
            <td>
              <input type="number" disabled={true} value={0} />
            </td>
            <td>
              <input type="number" value={0} />
            </td>
            <td>
              <input type="number" value={0} />
            </td>
            <td>
              <input type="number" value={34} />
            </td>
          </tr>
          <tr>
            <td>
              <input list="efts" value={""} />
            </td>
            <td>
              <input type="number" disabled={true} value={0} />
            </td>
            <td>
              <input type="number" value={0} />
            </td>
            <td>
              <input type="number" value={0} />
            </td>
            <td>
              <input type="number" value={0} />
            </td>
          </tr>
        </tbody>
      </table>

      <h3>Backtest Simulation</h3>

      <div>
        <label>Initial Value:</label>
        <input type="number" value={10000.0} />
      </div>
      <div>
        <label>Start Date:</label>
        <input type="date" value={"2024-01-01"} />
      </div>
      <div>
        <label>End Date:</label>
        <input type="date" value={"2025-01-01"} />
      </div>

      <table>
        <thead>
          <tr>
            <th>D</th>
            <th>H</th>
            <th>A</th>
            <th>B</th>
            <th>C</th>
          </tr>
        </thead>
        <tbody>
          {Array(100)
            .fill(0)
            .map((_x, i) => {
              return (
                <tr key={i}>
                  <td>{i}</td>
                  <td>
                    {hs.reduce(
                      (pv, s) =>
                        pv +
                        s.holding.availUnits *
                          (s.security?.indicators.quote[0]?.close[
                            s.security?.indicators.quote[0]?.close.length -
                              1 -
                              i
                          ] ?? 0),
                      0,
                    )}
                  </td>
                  <td>
                    {100 *
                      (securities[0]?.indicators.quote[0]?.close[
                        securities[0]?.indicators.quote[0]?.close.length - 1 - i
                      ] ?? 0)}
                  </td>
                  <td>
                    {100 *
                      (securities[1]?.indicators.quote[0]?.close[
                        securities[1]?.indicators.quote[0]?.close.length - 1 - i
                      ] ?? 0)}
                  </td>
                  <td>
                    {100 *
                      (securities[2]?.indicators.quote[0]?.close[
                        securities[2]?.indicators.quote[0]?.close.length - 1 - i
                      ] ?? 0)}
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}

interface Row {
  readonly results: readonly {
    readonly value: string | number | null;
    readonly field: string;
  }[];
}

const SecuritySelect: React.FC<{
  value: string;
  disabled?: boolean;
  rows: readonly Row[];
}> = ({ value, rows, disabled }) => (
  <select value={value} disabled={disabled}>
    {rows.map((row) => (
      <option
        key={
          row.results.find((cell) => cell.field.includes("Symbol"))?.value ?? ""
        }
        value={
          row.results.find((cell) => cell.field.includes("Symbol"))?.value ?? ""
        }
      >
        {row.results.find((cell) => cell.field.includes("Symbol"))?.value ??
          "NOT_FOUND"}
        {" - "}
        {row.results.find((cell) => cell.field.includes("FundName"))?.value ??
          "NOT_FOUND"}
      </option>
    ))}
  </select>
);

const DataList: React.FC<{
  id: string;
  rows: readonly Row[];
}> = ({ id, rows }) => (
  <datalist id={id}>
    {rows.map((row) => (
      <option
        key={
          row.results.find((cell) => cell.field.includes("Symbol"))?.value ?? ""
        }
        value={
          row.results.find((cell) => cell.field.includes("Symbol"))?.value ?? ""
        }
      >
        {row.results.find((cell) => cell.field.includes("FundName"))?.value ??
          ""}
      </option>
    ))}
  </datalist>
);
