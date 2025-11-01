/** The Generic Response Type. */
export type HttpResult<S, B> = {
  type: "httpResult";
  status: S;
  body: B;
  headers: Headers;
};

export type HttpSuccess = 200 | 201 | 202 | 203 | 204 | 205 | 206;
export type HttpClientError = 400 | 401 | 402 | 403 | 404 | 405 | 406;
export type HttpServerError = 500 | 501 | 502 | 503 | 504 | 505 | 506;

export type HttpStatusCode = HttpSuccess | HttpClientError | HttpServerError;

/** A Network Error, it could be TCP/IP error, timeout error etc. */
export type HttpError = { type: "httpError"; error: Error };

/** helper function */
export async function tryFetchJson<T extends HttpResult<HttpStatusCode, any>>(
  input: string | URL | Request,
): Promise<T | HttpError> {
  try {
    console.log(input);

    const response = await fetch(input);

    console.log(response);

    const json = await response.json();

    const res: HttpResult<HttpStatusCode, any> = {
      type: "httpResult",
      status: response.status as HttpStatusCode,
      headers: response.headers,
      body: json,
    };

    return res as any;
  } catch (err: unknown) {
    return { type: "httpError", error: err as any };
  }
}

export async function tryFetchText<T extends HttpResult<HttpStatusCode, any>>(
  url: string,
): Promise<T | HttpError> {
  try {
    const response = await fetch(url);
    const text = await response.text();

    const result: HttpResult<HttpStatusCode, string> = {
      type: "httpResult",
      status: response.status as HttpStatusCode,
      headers: response.headers,
      body: text,
    };

    return result as any;
  } catch (err: unknown) {
    return { type: "httpError", error: err as any };
  }
}
