const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const { StringSession } = require("telegram/sessions");
const { AuthKey } = require("telegram/crypto/AuthKey");
const fs = require("fs");
class FdyConvertorError extends Error {
  constructor(message) {
    super(message);
    this.name = "FdyConvertorError";
  }
}

class FdyConvertor {
  #sessions = [];
  #path = null;
  #savePath = null;
  #fileExt = null;
  #prefix = "fdy_";
  #files = [];
  #dcs = {
    1: { serverAddress: "pluto.web.telegram.org", ipAddress: "149.154.175.53" },
    2: { serverAddress: "venus.web.telegram.org", ipAddress: "149.154.167.51" },
    3: {
      serverAddress: "aurora.web.telegram.org",
      ipAddress: "149.154.175.100",
    },
    4: { serverAddress: "vesta.web.telegram.org", ipAddress: "149.154.167.91" },
    5: { serverAddress: "flora.web.telegram.org", ipAddress: "91.108.56.130" },
  };
  /**
   * @typedef {{ path: string, savePath: string, fileExt: string, prefix: string }} FdyConvertorOptions
   * @param {FdyConvertorOptions} [options]
   */
  constructor(options = {}) {
    this.#path = options.path;
    this.#savePath = options.savePath;
    this.#fileExt = options.fileExt;
    this.#prefix = options.prefix || "fdy_";
  }

  async convert(files = []) {
    try {
      if (!this.#path) {
        throw new FdyConvertorError("path is required");
      }
      if (!this.#fileExt) {
        throw new FdyConvertorError("fileExt is required");
      }

      let dbs = [];

      // If files are provided, validate and process them
      if (files.length > 0) {
        this.#files = files.map((file) => {
          return this.#fileExt.includes(".")
            ? file // if file extension is already present
            : `${file}.${this.#fileExt}`; // append extension if not present
        });

        // Check existence of files and open databases
        dbs = await Promise.all(
          this.#files.map((file) => {
            const resolvedPath = path.resolve(this.#path, file);
            if (!fs.existsSync(resolvedPath)) {
              throw new FdyConvertorError(`File ${file} not found`);
            }
            return open({
              filename: resolvedPath,
              driver: sqlite3.Database,
            });
          })
        );
      } else {
        // If no files provided, retrieve session files
        this.#files = await this.#getSessionFiles();

        if (this.#files.length === 0) {
          throw new FdyConvertorError(
            "No session files found in path " + this.#path
          );
        }

        // Open databases for the found session files
        dbs = await Promise.all(
          this.#files.map((file) =>
            open({
              filename: path.resolve(this.#path, file),
              driver: sqlite3.Database,
            })
          )
        );
      }

      // Process the session records from the databases
      this.#sessions = await Promise.allSettled(
        dbs.map((db, index) =>
          db.get("select * from sessions").then((session) => ({
            ...session,
            filename: this.#files[index], // Attach the corresponding file name
          }))
        )
      );

      // Filter to keep only fulfilled promises (successful database reads)
      this.#sessions = this.#sessions
        .filter(({ status }) => status === "fulfilled")
        .map(({ value }) => value);

      return this;
    } catch (error) {
      throw new FdyConvertorError(error.message);
    }
  }

  save({ apiId, apiHash }) {
    if (!this.#savePath) {
      throw new FdyConvertorError("savePath is required");
    }
    if (!apiId || !apiHash) {
      throw new FdyConvertorError("apiId and apiHash are required");
    }
    try {
      const newCreatedFiles = [];
      const oldCreatedFiles = [];
      if (!fs.existsSync(this.#savePath)) {
        fs.mkdirSync(this.#savePath, { recursive: true });
      }
      this.#sessions.map((session) => {
        const ss = new StringSession("");

        const authKey = new AuthKey();

        authKey.setKey(Buffer.from(session.auth_key));
        ss.setDC(session.dc_id, this.#dcs[session.dc_id].ipAddress, 80);
        ss.setAuthKey(authKey);

        const json = {
          apiId: Number(apiId),
          apiHash: String(apiHash),
          sessionString: ss.save(),
        };

        fs.writeFileSync(
          path.resolve(
            this.#savePath,
            this.#prefix + this.#removeExtension(session.filename) + ".session"
          ),
          JSON.stringify(json, null, 2)
        );
        newCreatedFiles.push(
          this.#prefix + this.#removeExtension(session.filename) + ".session"
        );
        oldCreatedFiles.push(session.filename);
      });

      return {
        old: oldCreatedFiles,
        new: newCreatedFiles,
      };
    } catch (error) {
      throw new FdyConvertorError(error.message);
    }
  }

  delete() {
    try {
      let fileNames = [];
      this.#sessions.map((session) => {
        fileNames.push(session.filename);
        fs.unlinkSync(path.resolve(this.#path, session?.filename));
      });
      return fileNames;
    } catch (error) {
      throw new FdyConvertorError(error.message);
    }
  }

  #getSessionFiles() {
    return new Promise((resolve, reject) => {
      fs.readdir(this.#path, (err, files) => {
        if (err) {
          return reject(err); // Handle errors if any
        }

        // Filter files that end with `.session`
        const sessionFiles = files.filter(
          (file) => path.extname(file) === ".session"
        );

        // Check if session files are present
        if (sessionFiles.length > 0) {
          resolve(sessionFiles); // Return the session files
        } else {
          resolve([]); // Return an empty array if no session files are found
        }
      });
    });
  }

  #removeExtension(filename) {
    const parts = filename.split(".");
    if (parts.length > 1) {
      parts.pop(); // Remove the last part (extension)
      return parts.join("_"); // Rejoin the remaining parts
    }
    return filename; // If there's no extension, return the original filename
  }
}

module.exports = FdyConvertor;

module.exports.FdyConvertor = FdyConvertor;
