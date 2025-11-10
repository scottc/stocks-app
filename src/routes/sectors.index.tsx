import client from "@/client";
import { Toolbar } from "@/components/App";
import type { Row } from "@/data-loaders/commsec/efts";
import { createFileRoute, Link, useLoaderData } from "@tanstack/react-router";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type AccessorFnColumnDef,
  type AccessorKeyColumnDef,
} from "@tanstack/react-table";

export const Route = createFileRoute("/sectors/")({
  component: EftsPage,
});

function EftsPage() {
  return (
    <>
      <Toolbar>
        <a target="_blank" href="...">
          ...
        </a>
      </Toolbar>
      <div>
        <p>
          Note: These are indexes, which are not directly avaliable for
          purchase, they need to be purchased via an ETF that then tracks the
          index.
        </p>

        <p>
          That said, we can still display price information for the indexes, to
          help inform purchasing decisions. And for benchmarking purposes etc.
        </p>

        <p>
          These are for the GICS sectors... industries, sub such as follows:
        </p>

        <p>Sector &gt; Industry Group &gt; Industry &gt; Sub-Industry</p>

        <p>
          Consumer Staples &gt; Food, Beverage &amp; Tobacco &gt; Food Products
          &gt; Agricultural Products &amp; Services
        </p>

        <p>
          There are: 11 Sectors, 25 Industry Groups, 77 Industries and 174
          Sub-industries.
        </p>

        <h2>All</h2>

        {/* NOTE: the displayed code, is for the ASX, the id is for yahoo... */}

        <a target="_blank" href="https://www.listcorp.com/asx/sectors/">
          See full list...
        </a>

        <div>
          ALL ORDINARIES ASX:{" "}
          <Link to="/sectors/$id/chart" params={{ id: "ord" }}>
            XAO
          </Link>{" "}
          Index
        </div>
        <div>
          S&amp;P/ASX 200 ASX:{" "}
          <Link to="/sectors/$id/chart" params={{ id: "xjo" }}>
            XJO
          </Link>{" "}
          Index
        </div>

        <h2>GICS Sectors</h2>

        <div>S&amp;P/ASX Energy [XEJ]</div>
        <div>S&amp;P/ASX Materials [XMJ]</div>
        <div>S&amp;P/ASX Industrials [XNJ]</div>
        <div>S&amp;P/ASX Consumer Discretionary [XDJ]</div>
        <div>S&amp;P/ASX Consumer Staples [XSJ]</div>
        <div>S&amp;P/ASX Health Care [XHJ]</div>
        <div>S&amp;P/ASX Financials [XFJ]</div>
        <div>S&amp;P/ASX Information Technology [XIJ]</div>
        <div>S&amp;P/ASX Communication Services [XTJ]</div>
        <div>S&amp;P/ASX Utilities [XUJ]</div>
        <div>S&amp;P/ASX Real Estate [XRE]</div>
      </div>
    </>
  );
}
