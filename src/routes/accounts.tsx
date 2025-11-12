import client from "@/client";
import { createFileRoute, Link, useLoaderData } from "@tanstack/react-router";

export const Route = createFileRoute("/accounts")({
  component: AccountsPage,
  loader: async () => await client.api.commsec.accounts.get(),
});

function AccountsPage() {
  const ids = useLoaderData({ from: "/accounts" }).data ?? [];
  return (
    <div>
      <h2>Commsec Accounts</h2>

      <ul>
        {ids.map((id) => (
          <li key={id}>
            <Link to="/accounts/$id" params={{ id: id.toString() }}>
              {id}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
