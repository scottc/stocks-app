import client from "@/client";
import type { Row } from "@/data-loaders/commsec/efts";
import { createFileRoute, Link, useLoaderData } from "@tanstack/react-router";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type AccessorFnColumnDef,
  type AccessorKeyColumnDef,
} from "@tanstack/react-table";

export const Route = createFileRoute("/efts/")({
  component: EftsPage,
  loader: async () => await client.api.commsec.eftscreener.get(),
});

function EftsPage() {
  const data = useLoaderData({ from: "/efts/" });
  const rows: Row[] =
    data.data?.value?.apps.at(0)?.data.data.screenResults.rows ?? [];

  const table = useReactTable({
    columns: columns,
    getCoreRowModel: getCoreRowModel(),
    data: rows, //note: data needs a "stable" reference in order to prevent infinite re-renders
  });

  return (
    <div>
      <h2>EFTs</h2>

      <table>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </th>
              ))}
            </tr>
          ))}
        </thead>

        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>

        <tfoot>
          {table.getFooterGroups().map((footerGroup) => (
            <tr key={footerGroup.id}>
              {footerGroup.headers.map((header) => (
                <th key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.footer,
                        header.getContext(),
                      )}
                </th>
              ))}
            </tr>
          ))}
        </tfoot>
      </table>
    </div>
  );
}

const columns: (
  | AccessorFnColumnDef<Row, any>
  | AccessorKeyColumnDef<Row, any>
)[] = [
  {
    id: "Symbol",
    header: "Symbol",
    accessorFn: (row: Row) =>
      row.results.find((cell) => cell.field.includes("Symbol"))?.value,
    cell: (props) => (
      <>
        ASX:
        <Link
          to="/efts/$id/chart"
          params={{ id: props.getValue().toLowerCase() }}
        >
          {props.getValue()}
        </Link>
      </>
    ),
  },
  {
    id: "FundName",
    header: "Fund Name",
    accessorFn: (row: Row) =>
      row.results.find((cell) => cell.field.includes("FundName"))?.value,
  },
  {
    id: "MaxManagementFee",
    header: "Max Management Fee",
    accessorFn: (row: Row) =>
      row.results.find((cell) => cell.field.includes("MaxManagementFee"))
        ?.value,
  },
  {
    id: "MarketCap",
    header: "Market Cap",
    accessorFn: (row: Row) =>
      row.results.find((cell) => cell.field.includes("MarketCap"))?.value,
  },
  /*
  {
    id: "FundShareClassID",
    header: "Fund Share Class ID",
    accessorFn: (row: Row) =>
      row.results.find((cell) => cell.field.includes("FundShareClassID"))?.value,
  },
   */
  {
    id: "LastClosePrice",
    header: "Last Close Price",
    accessorFn: (row: Row) =>
      row.results.find((cell) => cell.field.includes("LastClosePrice"))?.value,
  },

  {
    id: "TrailingReturnYTD",
    header: "Trailing Return YTD",
    accessorFn: (row: Row) =>
      row.results.find((cell) => cell.field.includes("TrailingReturnYTD"))
        ?.value,
  },
  {
    id: "Volume90DayAverage",
    header: "Volume 90 Day Average",
    accessorFn: (row: Row) =>
      row.results.find((cell) => cell.field.includes("Volume90DayAverage"))
        ?.value,
  },
];
