import { error, UNIT, value, type Result, type Unit } from "../store/lib";

export const tryJson = async <T>(
  file: Bun.BunFile,
): Promise<Result<T, Error>> => {
  try {
    return value((await file.json()) as T);
  } catch (err: unknown) {
    return error(err as Error);
  }
};
