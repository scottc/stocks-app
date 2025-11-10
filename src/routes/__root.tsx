import { Toolbar } from "@/components/App";
import { Disclaimer } from "@/components/Disclaimer";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";

const RootLayout = () => (
  <>
    <Disclaimer />

    <Toolbar>
      <Link to="/holdings">Holdings</Link>
      {" | "}
      <Link to="/transactions">Transactions</Link>
      {" | "}
      <Link to="/efts">EFTs</Link>
      {" | "}
      <Link to="/sectors">Sectors</Link>
      {" | "}
      <Link to="/compare">Compare</Link>
      {" | "}
      <Link to="/ai">AI</Link>
    </Toolbar>

    <Outlet />

    <TanStackDevtools
      plugins={[
        {
          name: "TanStack Router",
          render: <TanStackRouterDevtoolsPanel />,
        },
      ]}
    />
  </>
);

export const Route = createRootRoute({ component: RootLayout });
