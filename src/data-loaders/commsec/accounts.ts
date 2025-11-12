import {
  FileSystem,
  Path,
  HttpClient,
  FetchHttpClient,
} from "@effect/platform";
import { Effect, Schema, DateTime } from "effect";

const accountSchema = Schema.Number;

const fetchAccounts = Effect.gen(function* () {
  // list dirs...
  const path = yield* Path.Path;

  const cwd = path.resolve(".");
  const filePath = path.join(cwd, "data", "commsec", "transactions");

  const fs = yield* FileSystem.FileSystem;

  const dirs = yield* fs.readDirectory(filePath);

  const accountIds = yield* Schema.decode(
    Schema.Array(Schema.NumberFromString),
  )(dirs);

  return accountIds;
});

export { fetchAccounts };
