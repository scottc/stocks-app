import { HttpClient, HttpClientRequest } from "@effect/platform";
import type { Cookie } from "@effect/platform/Cookies";
import { Effect, Schema } from "effect";
import type { ReadonlyRecord } from "effect/Record";

const getCommsecLoginCookies = Effect.gen(function* () {
  const client = yield* HttpClient.HttpClient;
  const response = yield* client.get(
    "https://www2.commsec.com.au/secure/login",
  );
  return response;
});

const loginBodySchema = Schema.Struct({
  username: Schema.String,
  password: Schema.String,
  query: Schema.String,
});

const postCommsecLogin = (username: string, password: string) =>
  Effect.gen(function* () {
    const resp1 = yield* getCommsecLoginCookies;

    const client = yield* HttpClient.HttpClient;

    const foobar = Object.entries(resp1.cookies.cookies)
      .reduce(
        (prev, [_key, value]) =>
          `${prev}${value.name ?? ""}=${value.value ?? ""};`,
        "",
      )
      .trim();

    const resp2 = yield* HttpClientRequest.post(
      "https://www2.commsec.com.au/secure/api/login",
    ).pipe(
      HttpClientRequest.setHeader(
        "x-xsrf-token",
        resp1.cookies.cookies["XSRF-TOKEN"]?.value ?? "",
      ),
      HttpClientRequest.setHeader("cookie", foobar),
      HttpClientRequest.schemaBodyJson(loginBodySchema)({
        username: username,
        password: password,
        query: "?icid=LogInButton-cus-unt-eng-pen-pulibu-20210805-1",
      }),
      Effect.flatMap(client.execute),
    );

    return {
      resp1,
      resp2,
      resp1Cookies: resp1.cookies.cookies,
      resp2Cookies: resp2.cookies.cookies,
    };
  });

export { getCommsecLoginCookies, postCommsecLogin };
