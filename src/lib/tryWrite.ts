import { write } from "bun";
import { error, value, type Result } from "../store/lib";

type WriteOptions = {
  mode?: number;
  createPath?: boolean;
};

/**
 *
 * @param path
 * @param filename
 * @param contents
 * @returns bytesWritten, wrapped in a Promise<Result<number>>
 */
export const tryWrite = async (
  destination: Bun.BunFile | Bun.S3File | Bun.PathLike,
  contents:
    | Blob
    | NodeJS.TypedArray
    | ArrayBufferLike
    | string
    | Bun.BlobPart[],
  options?: WriteOptions,
): Promise<Result<number>> => {
  try {
    return value(await write(destination, contents, options));
  } catch (err: unknown) {
    return error(err as Error);
  }
};
