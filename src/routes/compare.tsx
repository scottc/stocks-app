import client from "@/client";
import { createFileRoute, useLoaderData } from "@tanstack/react-router";

interface SearchParams {}

export const Route = createFileRoute("/compare")({
  component: ComparePage,
  loader: async () => await client.api.commsec.eftscreener.get(),
  validateSearch: (search: Record<string, unknown>): SearchParams => ({}),
});

function ComparePage() {
  const data = useLoaderData({ from: "/compare" });
  const rows = data.data?.value?.apps[0]?.data.data.screenResults.rows ?? [];

  return (
    <div>
      <h2>Compare</h2>

      <table>
        <thead>
          <tr>
            <th>Stock</th>
            <th>Holdings %</th>
            <th>Portfolio A %</th>
            <th>Portfolio B %</th>
            <th>Portfolio C %</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <select value={"IOO"}>
                {rows.map((row) => (
                  <option>
                    {row.results.find((cell) => cell.field.includes("Symbol"))
                      ?.value ?? "NOT_FOUND"}
                    {" - "}
                    {row.results.find((cell) => cell.field.includes("FundName"))
                      ?.value ?? "NOT_FOUND"}
                  </option>
                ))}
              </select>
            </td>
            <td>
              <input value={"100"} />
            </td>
            <td>
              <input />
            </td>
            <td>
              <input />
            </td>
            <td>
              <input />
            </td>
          </tr>
          <tr>
            <td>
              <select>
                {rows.map((row) => (
                  <option>
                    {row.results.find((cell) => cell.field.includes("Symbol"))
                      ?.value ?? "NOT_FOUND"}
                    {" - "}
                    {row.results.find((cell) => cell.field.includes("FundName"))
                      ?.value ?? "NOT_FOUND"}
                  </option>
                ))}
              </select>
            </td>
            <td>
              <input />
            </td>
            <td>
              <input />
            </td>
            <td>
              <input />
            </td>
            <td>
              <input />
            </td>
          </tr>
          <tr>
            <td>
              <select>
                {rows.map((row) => (
                  <option>
                    {row.results.find((cell) => cell.field.includes("Symbol"))
                      ?.value ?? "NOT_FOUND"}
                    {" - "}
                    {row.results.find((cell) => cell.field.includes("FundName"))
                      ?.value ?? "NOT_FOUND"}
                  </option>
                ))}
              </select>
            </td>
            <td>
              <input />
            </td>
            <td>
              <input />
            </td>
            <td>
              <input />
            </td>
            <td>
              <input />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
