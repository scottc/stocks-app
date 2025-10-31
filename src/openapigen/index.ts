import { error, value, type Result } from "@/lib/lib";
import { file, write } from "bun";

interface OpenApi2SchemaFile {
  swagger: "2.0";
  info: {
    version: string;
    title: string;
    license: {
      name: string;
      url: string;
    };
  };
  host: string;
  basePath: string;
  schemes: "https"[];
  securityDefinitions: {
    api_key: {
      type: string;
      name: string;
      in: string;
    };
  };
  extraDocs: {
    section: null;
    subSection: {
      navHeader: string;
      urlId: string;
      summary: string;
      title: string;
      description: string;
    }[];
  }[];
  orders: string[];
  sampleCodeTemplate: Record<string, string>;
  paths: Record<
    string,
    Record<
      string,
      {
        summary: string;
        description: string;
        operationId: string;
        navHeader: string;
        urlId: string;
        title: string;
        parameters: {
          in: string;
          name: string;
          description: string;
          required: boolean;
          type: string;
        }[];
        responses: Record<
          number,
          { description: string; schema: { type: string; $ref: string } }
        >;
        security: any[];
      }
    >
  >;
  definitions: Record<
    string,
    {
      type: string;
      required: string[];
      properties: Record<
        string,
        {
          type: string;
          description: string;
          items?: { type: string; $ref: string };
        }
      >;
    }
  >;
}

interface OpenApi2TypeDefs {}
interface TypescriptApiClient {
  functionDefinitions: TypescriptFunction[];
}

interface TypescriptFunction {
  name: string;
  args: { name: string; type: TypescriptType }[];
  returns: TypescriptType;
  //... body implementation configuration details...
}

/**
 * Try Expression
 * @param f A function that returns a value.
 * @returns The value, wrapped in a Result<T> monad.
 */
function trye<T>(f: () => T): Result<T> {
  try {
    return value(f());
  } catch (err) {
    return error(
      err instanceof Error
        ? err
        : new Error("An Error Occured, See cause.", { cause: err }),
    );
  }
}

/**
 *
 * @param p A Promise<T>
 * @returns T wrapped in a Result<T, Error> monad.
 */
async function tri<T>(p: Promise<T>): Promise<Result<T, Error>> {
  try {
    return value(await p);
  } catch (err) {
    return error(
      err instanceof Error
        ? err
        : new Error("An Error Occured, see error.cause.", { cause: err }),
    );
  } finally {
    // ...
  }
}

interface TypescriptNamespace {
  name: string;
  types: TypescriptType[];
}

interface TypescriptType {
  type: "object" | "function" | "unknown";
  name: string;
}

// TODO: safely decode at runtime, with validation, don't just cast... could be invalid file.

const toTypescriptNamespace = (x: OpenApi2SchemaFile): TypescriptNamespace => {
  return {
    name: x.info.title.replaceAll(" ", ""),
    types: toTypeDefs(x),
  };
};

const toTypeDefs = (x: OpenApi2SchemaFile): TypescriptType[] =>
  Object.entries(x.definitions).map<TypescriptType>(([name, meta]) => ({
    type: meta.type === "object" ? "object" : "unknown",
    name: `${name}`,
  }));

const typeToString = (t: TypescriptType) =>
  `/** ${t.name} ${t.type} */\nexport type ${t.name.replaceAll("-", "").replaceAll(" ", "")} = ${t.type === "object" ? "{}" : "unknown"};\n`;

const toImpl = (x: OpenApi2SchemaFile): TypescriptApiClient => {
  const ttt = Object.entries(x.paths).map(
    ([path, httpVerbRecord]): TypescriptFunction => ({
      name: "f",
      args: [
        {
          name: "arg1",
          type: {
            name: "string",
            type: "object",
          },
        },
      ],
      returns: {
        name: "HttpResult",
        type: "object",
      },
    }),
  );

  return {
    functionDefinitions: ttt,
  };
};

// TODO: don't cast, validate and safely decode value.
const f = await tri<OpenApi2SchemaFile>(
  file("./src/openapigen/swagger.json").json(),
);

if (f.type === "error") {
  throw f.error;
}

console.log(f, f.value);

const typescriptNamespaceToString = (x: TypescriptNamespace): string =>
  `/** @file foobar */
/** ${x.name} */
export namespace ${x.name} {

/** The Generic Response Type. */
export type HttpResult<S, B> = { type: "httpResult", status: S, body: B };

/** A Network Error, it could be TCP/IP error, timeout error etc. */
export type HttpError = { type: "httpError", error: Error };

${x.types.reduce((pv, cv, _ci, _arr) => `${pv}\n${typeToString(cv)}`, "")}
}
`;

const typescriptApiClienttoString = (x: TypescriptApiClient): string =>
  `
export const client: ApiClient = (baseUrl: string = "") => ({
  baseUrl: baseUrl,

  ${x.functionDefinitions.reduce(
    (pv, cv, _a, _b) => `
    ${pv}

  ${cv.name}: async (${cv.args.reduce((a, b) => `${a}${b.name}: ${b.type.name} `, "")}): Promise<${cv.returns.name} | HttpError> => await fetch(baseUrl + "/foo", {/* options */}),
  `,
    "",
  )}
  })

  `;

const namespace = typescriptNamespaceToString(toTypescriptNamespace(f.value));

const impl = typescriptApiClienttoString(toImpl(f.value));

await tri(
  write(file("./src/openapigen/swagger.json.ts"), `${namespace}\n${impl}`),
);

// Test with: bun ./src/openapigen/index.ts
