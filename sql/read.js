const { readFile } = require("node:fs/promises");
const path = require("node:path");

exports.read = async (fileName) => {
  const fullPath = path.resolve(__dirname, fileName);
  try {
    return await readFile(fullPath, "utf8");
  } catch (error) {
    console.error(`Failed to read SQL file ${fullPath}:`, error.message);
    throw new Error(`Failed to read SQL file ${fullPath}: ${error.message}`, {
      cause: error,
    });
  }
};
