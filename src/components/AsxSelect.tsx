import { useAsxListedCompanies } from "@/hooks/useAsxListedCompanies";
import { match } from "@/lib/lib";
import { ErrorView } from "./Error";
import { useAlphaVantageListingStatus } from "@/hooks/useAlphaVantageListingStatus";

const AsxSelect = () => {
  const listingsState = useAlphaVantageListingStatus();

  return match(listingsState, {
    init: () => <></>,
    loading: () => <></>,
    value: (listings) => (
      <select>
        <optgroup label="EFTs">
          {listings.map((listing) => (
            <option key={`${listing.exchange}/${listing.symbol}`}>
              {listing.symbol} - {listing.name}{" "}
              {new Date(listing.ipoDate).toISOString().substring(0, 10)}
            </option>
          ))}
        </optgroup>
      </select>
    ),
    error: (e) => <ErrorView error={e} />,
  });
};

export { AsxSelect };
