import { treaty } from "@elysiajs/eden";
import type { ServerApi } from ".";

const client = treaty<ServerApi>("localhost:3000");
export default client;