declare module "FdyConvertor" {
  export interface FdyConvertorOptions {
    path: string;
    savePath: string;
    fileExt: string;
    prefix?: string;
  }

  export default class FdyConvertor {
    constructor(options: FdyConvertorOptions);

    /**
     * Convert session files.
     * @param files - An array of session file names to convert. If not provided, it will detect files automatically.
     */
    convert(files?: string[]): Promise<this>;

    /**
     * Save converted sessions to the specified save path.
     * @param apiId - The API ID.
     * @param apiHash - The API hash.
     * @returns An object containing old and new file names.
     */
    save({ apiId, apiHash }: { apiId: string; apiHash: string }): {
      old: string[];
      new: string[];
    };

    /**
     * Delete original session files after conversion.
     * @returns An array of deleted file names.
     */
    delete(): string[];
  }

  export class FdyConvertorError extends Error {
    constructor(message: string);
  }
}
