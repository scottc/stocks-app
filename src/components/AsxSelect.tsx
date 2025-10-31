import { useAsxListedCompanies } from "@/hooks/useAsxListedCompanies";
import { match } from "@/lib/lib";
import { ErrorView } from "./Error";

const AsxSelect = () => {
  const asx = useAsxListedCompanies();

  return match(asx, {
    init: () => <></>,
    loading: () => <></>,
    value: (v) => (
      <select>
        <optgroup>{v.datetime}</optgroup>
        {v.entries.map((e) => (
          <option key={e.asxCode}>
            {e.asxCode} - {e.companyName} - {e.gicsIndustyGroup}
          </option>
        ))}
      </select>
    ),
    error: (e) => <ErrorView error={e} />,
  });
};

export { AsxSelect };
