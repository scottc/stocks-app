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

        <div>
          S&amp;P/ASX Energy [
          <Link to="/sectors/$id/chart" params={{ id: "xej" }}>
            XEJ
          </Link>
          ]
        </div>
        <div>
          S&amp;P/ASX Materials [
          <Link to="/sectors/$id/chart" params={{ id: "xmj" }}>
            XMJ
          </Link>
          ]
        </div>
        <div>
          S&amp;P/ASX Industrials [
          <Link to="/sectors/$id/chart" params={{ id: "xnj" }}>
            XNJ
          </Link>
          ]
        </div>
        <div>
          S&amp;P/ASX Consumer Discretionary [
          <Link to="/sectors/$id/chart" params={{ id: "xdj" }}>
            XDJ
          </Link>
          ]
        </div>
        <div>
          S&amp;P/ASX Consumer Staples [
          <Link to="/sectors/$id/chart" params={{ id: "xsj" }}>
            XSJ
          </Link>
          ]
        </div>
        <div>
          S&amp;P/ASX Health Care [
          <Link to="/sectors/$id/chart" params={{ id: "xhj" }}>
            XHJ
          </Link>
          ]
        </div>
        <div>
          S&amp;P/ASX Financials [
          <Link to="/sectors/$id/chart" params={{ id: "xfj" }}>
            XFJ
          </Link>
          ]
        </div>
        <div>
          S&amp;P/ASX Information Technology [
          <Link to="/sectors/$id/chart" params={{ id: "xij" }}>
            XIJ
          </Link>
          ]
        </div>
        <div>
          S&amp;P/ASX Communication Services [
          <Link to="/sectors/$id/chart" params={{ id: "xtj" }}>
            XTJ
          </Link>
          ]
        </div>
        <div>
          S&amp;P/ASX Utilities [
          <Link to="/sectors/$id/chart" params={{ id: "xuj" }}>
            XUJ
          </Link>
          ]
        </div>
        <div>
          S&amp;P/ASX Real Estate [
          <Link to="/sectors/$id/chart" params={{ id: "xre" }}>
            XRE
          </Link>
          ]
        </div>
      </div>
    </>
  );
}
