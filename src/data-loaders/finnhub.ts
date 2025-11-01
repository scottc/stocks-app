// finnhub.io

import type { ApiClient } from "@/openapigen/apiclient";
import { client } from "@/openapigen/apiclient";

// Authentication
// All GET request require a token parameter token=apiKey in the URL or a header X-Finnhub-Token : apiKey.
// You can find your API Key under Dashboard. If you are logged in, your API key will be automatically used in the examples so you can copy and paste them as is.

// Rate Limits
// If your limit is exceeded, you will receive a response with status code 429.
// On top of all plan's limit, there is a 30 API calls/ second limit.

const finnhub = client();

const r = await finnhub.bondprice("asdasfas");

switch (r.type) {
  case "httpResult":
    switch (r.status) {
      case 200:
        break;
      case 404:
        break;
    }
    break;
  case "httpError":
    // ...
    break;
}
