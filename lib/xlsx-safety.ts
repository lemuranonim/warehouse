const LOCAL_FILE_HEADER = 0x04034b50;
const CENTRAL_DIRECTORY_HEADER = 0x02014b50;
const END_OF_CENTRAL_DIRECTORY = 0x06054b50;

export const XLSX_MIME_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export type XlsxArchiveLimits = {
  maxEntries: number;
  maxUncompressedBytes: number;
  maxEntryBytes: number;
  maxCompressionRatio: number;
};

const DEFAULT_LIMITS: XlsxArchiveLimits = {
  maxEntries: 2_000,
  maxUncompressedBytes: 100 * 1024 * 1024,
  maxEntryBytes: 50 * 1024 * 1024,
  maxCompressionRatio: 150,
};

function findEndOfCentralDirectory(buffer: Buffer) {
  const minimumOffset = Math.max(0, buffer.length - 65_557);
  for (let offset = buffer.length - 22; offset >= minimumOffset; offset -= 1) {
    if (buffer.readUInt32LE(offset) === END_OF_CENTRAL_DIRECTORY) return offset;
  }
  return -1;
}

export function inspectXlsxArchive(buffer: Buffer, limits: XlsxArchiveLimits = DEFAULT_LIMITS) {
  if (buffer.length < 22 || buffer.readUInt32LE(0) !== LOCAL_FILE_HEADER) {
    throw new Error("INVALID_XLSX_SIGNATURE");
  }

  const eocdOffset = findEndOfCentralDirectory(buffer);
  if (eocdOffset < 0) throw new Error("INVALID_XLSX_DIRECTORY");

  const entryCount = buffer.readUInt16LE(eocdOffset + 10);
  const centralDirectorySize = buffer.readUInt32LE(eocdOffset + 12);
  const centralDirectoryOffset = buffer.readUInt32LE(eocdOffset + 16);
  if (entryCount === 0xffff) throw new Error("XLSX_ZIP64_NOT_SUPPORTED");
  if (entryCount < 1 || entryCount > limits.maxEntries) throw new Error("XLSX_TOO_MANY_ENTRIES");
  if (centralDirectoryOffset + centralDirectorySize > eocdOffset) throw new Error("INVALID_XLSX_DIRECTORY");

  let offset = centralDirectoryOffset;
  let totalUncompressedBytes = 0;
  let seenEntries = 0;
  let hasContentTypes = false;
  let hasWorkbook = false;

  while (offset < centralDirectoryOffset + centralDirectorySize && seenEntries < entryCount) {
    if (offset + 46 > buffer.length || buffer.readUInt32LE(offset) !== CENTRAL_DIRECTORY_HEADER) {
      throw new Error("INVALID_XLSX_DIRECTORY_ENTRY");
    }

    const flags = buffer.readUInt16LE(offset + 8);
    const method = buffer.readUInt16LE(offset + 10);
    const compressedBytes = buffer.readUInt32LE(offset + 20);
    const uncompressedBytes = buffer.readUInt32LE(offset + 24);
    const fileNameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const nextOffset = offset + 46 + fileNameLength + extraLength + commentLength;
    if (nextOffset > buffer.length) throw new Error("INVALID_XLSX_DIRECTORY_ENTRY");
    if ((flags & 0x1) !== 0) throw new Error("ENCRYPTED_XLSX_NOT_SUPPORTED");
    if (method !== 0 && method !== 8) throw new Error("UNSUPPORTED_XLSX_COMPRESSION");
    if (uncompressedBytes > limits.maxEntryBytes) throw new Error("XLSX_ENTRY_TOO_LARGE");
    if (
      uncompressedBytes > 1024 * 1024
      && compressedBytes > 0
      && uncompressedBytes / compressedBytes > limits.maxCompressionRatio
    ) {
      throw new Error("XLSX_COMPRESSION_RATIO_TOO_HIGH");
    }

    totalUncompressedBytes += uncompressedBytes;
    if (totalUncompressedBytes > limits.maxUncompressedBytes) throw new Error("XLSX_UNCOMPRESSED_SIZE_TOO_LARGE");

    const fileName = buffer.subarray(offset + 46, offset + 46 + fileNameLength).toString("utf8");
    if (fileName === "[Content_Types].xml") hasContentTypes = true;
    if (fileName === "xl/workbook.xml") hasWorkbook = true;
    seenEntries += 1;
    offset = nextOffset;
  }

  if (seenEntries !== entryCount || !hasContentTypes || !hasWorkbook) {
    throw new Error("INVALID_XLSX_STRUCTURE");
  }

  return { entryCount, totalUncompressedBytes };
}
