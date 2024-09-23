# Fdy-convertor

**Fdy-convertor** is a utility designed to convert Pyrogram and Telethon session Gramjs String sessions. This project simplifies the management of Telegram sessions, allowing developers to easily convert and save session strings for future use.

## Features

- Convert SQLite sessions from Pyrogram and Telethon to Gramjs String Sessions.
- Save session strings with customizable file names.
- Supports bulk processing of session files.
- Automatically handles file extensions for sessions.

## Installation

To use **Fdy-convertor**, clone the repository and install the necessary dependencies:

```bash
npm install fdy-convertor
```

## Usage

### Initialize the Converter

You can initialize the converter by providing the required options:

```javascript
const FdyConvertor = require("fdy-convertor");

const options = {
  path: "./path/to/session/files",
  savePath: "./path/to/save/converted/files",
  fileExt: "session", // Specify the file extension for session files
  prefix: "fdy_", // Optional: prefix for saved files
};

const converter = new FdyConvertor(options);
```

### Convert Sessions

To convert session files, use the `convert` method:

```javascript
await converter.convert(); // Automatically detects session files in the specified path
```

You can also pass specific files:

```javascript
await converter.convert(["file1.session", "file2.session"]);
//OR
await converter.convert(["file1", "file2"]);
```

### Save Converted Sessions

After conversion, save the sessions with:

```javascript
const { old, new } = converter.save({ apiId: 'yourApiId', apiHash: 'yourApiHash' });
console.log('Old Files:', old);
console.log('New Files:', new);
```

### Delete Session Files

To delete the original session files after conversion:

```javascript
const deletedFiles = converter.delete();
console.log("Deleted Files:", deletedFiles);
```

## Error Handling

The converter throws custom errors, `FdyConvertorError`, to indicate various issues, such as missing paths or file not found errors.

## License

This project is licensed under the MIT License.

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue.

## Acknowledgments

- Thanks to the developers of Pyrogram, Telethon and GramJs for their incredible libraries.
