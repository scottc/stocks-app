import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/accounts/$id")({
  component: AccountPage,
});

function AccountPage() {
  const { id } = Route.useParams();

  return (
    <div>
      <h2>Commsec {id} Account</h2>

      <ul>
        <li>
          <Link to="/accounts/$id/holdings" params={{ id }}>
            Holdings
          </Link>
        </li>
        <li>
          <Link to="/accounts/$id/transactions" params={{ id }}>
            Transactions
          </Link>
        </li>
      </ul>
    </div>
  );
}
