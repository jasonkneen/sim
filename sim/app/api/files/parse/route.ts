import { NextRequest, NextResponse } from 'next/server'
import { existsSync } from 'fs'
import { readFile, unlink, writeFile } from 'fs/promises'
import { join } from 'path'
import path from 'path'
import { isSupportedFileType, parseFile } from '@/lib/file-parsers'
import { createLogger } from '@/lib/logs/console-logger'
import { downloadFromS3 } from '@/lib/uploads/s3-client'
import { UPLOAD_DIR, USE_S3_STORAGE } from '@/lib/uploads/setup'
import '@/lib/uploads/setup.server'

const logger = createLogger('FilesParseAPI')

interface ParseSuccessResult {
  success: true
  output: {
    content: string
    fileType: string
    size: number
    name: string
    binary: boolean
    metadata?: Record<string, any>
  }
  filePath?: string
}

interface ParseErrorResult {
  success: false
  error: string
  filePath?: string
}

type ParseResult = ParseSuccessResult | ParseErrorResult

// MIME type mapping for various file extensions
const fileTypeMap: Record<string, string> = {
  // Text formats
  txt: 'text/plain',
  csv: 'text/csv',
  json: 'application/json',
  xml: 'application/xml',
  md: 'text/markdown',
  html: 'text/html',
  css: 'text/css',
  js: 'application/javascript',
  ts: 'application/typescript',
  // Document formats
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  // Spreadsheet formats
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  // Presentation formats
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // Image formats
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  // Archive formats
  zip: 'application/zip',
}

// Binary file extensions
const binaryExtensions = [
  'doc',
  'docx',
  'xls',
  'xlsx',
  'ppt',
  'pptx',
  'zip',
  'png',
  'jpg',
  'jpeg',
  'gif',
]

/**
 * Main API route handler
 */
export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json()
    const { filePath, fileType } = requestData

    logger.info('File parse request received:', { filePath, fileType })

    if (!filePath) {
      return NextResponse.json({ error: 'No file path provided' }, { status: 400 })
    }

    // Handle both single file path and array of file paths
    const filePaths = Array.isArray(filePath) ? filePath : [filePath]

    // Parse each file
    const results = await Promise.all(
      filePaths.map(async (singleFilePath) => {
        try {
          return await parseFileSingle(singleFilePath, fileType)
        } catch (error) {
          logger.error(`Error parsing file ${singleFilePath}:`, error)
          return {
            success: false,
            error: (error as Error).message,
            filePath: singleFilePath,
          } as ParseErrorResult
        }
      })
    )

    // If it was a single file request, return a single result
    // Otherwise return an array of results
    if (!Array.isArray(filePath)) {
      // Single file was requested
      const result = results[0]
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 })
      }
      return NextResponse.json(result)
    }

    // Multiple files were requested
    return NextResponse.json({
      success: true,
      results,
    })
  } catch (error) {
    logger.error('Error parsing file(s):', error)
    return NextResponse.json(
      { error: 'Failed to parse file(s)', message: (error as Error).message },
      { status: 500 }
    )
  }
}

/**
 * Parse a single file and return its content
 */
async function parseFileSingle(filePath: string, fileType?: string): Promise<ParseResult> {
  logger.info('Parsing file:', filePath)

  // Check if this is an S3 path
  const isS3Path = filePath.includes('/api/files/serve/s3/')

  // Use S3 handler if it's an S3 path or we're in S3 mode
  if (isS3Path || USE_S3_STORAGE) {
    return handleS3File(filePath, fileType)
  }

  // Use local handler for local files
  return handleLocalFile(filePath, fileType)
}

/**
 * Handle file stored in S3
 */
async function handleS3File(filePath: string, fileType?: string): Promise<ParseResult> {
  try {
    // Extract the S3 key from the path
    const isS3Path = filePath.includes('/api/files/serve/s3/')
    const s3Key = isS3Path
      ? decodeURIComponent(filePath.split('/api/files/serve/s3/')[1])
      : filePath

    logger.info('Extracted S3 key:', s3Key)

    // Download the file from S3
    const fileBuffer = await downloadFromS3(s3Key)
    logger.info(`Downloaded file from S3: ${s3Key}, size: ${fileBuffer.length} bytes`)

    // Extract the filename from the S3 key
    const filename = s3Key.split('/').pop() || s3Key
    const extension = path.extname(filename).toLowerCase().substring(1)

    // Create a temporary file path
    const tempFilePath = join(UPLOAD_DIR, `temp-${Date.now()}-${filename}`)

    try {
      // Save to a temporary file so we can use existing parsers
      await writeFile(tempFilePath, fileBuffer)

      // Process the file based on its type
      const result = isSupportedFileType(extension)
        ? await processWithSpecializedParser(tempFilePath, filename, extension, fileType, filePath)
        : await handleGenericFile(tempFilePath, filename, extension, fileType)

      return result
    } finally {
      // Clean up the temporary file regardless of outcome
      if (existsSync(tempFilePath)) {
        await unlink(tempFilePath).catch((err) => logger.error('Error removing temp file:', err))
      }
    }
  } catch (error) {
    logger.error(`Error handling S3 file ${filePath}:`, error)
    return {
      success: false,
      error: `Error accessing file from S3: ${(error as Error).message}`,
      filePath,
    }
  }
}

/**
 * Handle file stored locally
 */
async function handleLocalFile(filePath: string, fileType?: string): Promise<ParseResult> {
  // Extract the filename from the path
  const filename = filePath.startsWith('/api/files/serve/')
    ? filePath.substring('/api/files/serve/'.length)
    : path.basename(filePath)

  logger.info('Processing local file:', filename)

  // Try several possible file paths
  const possiblePaths = [join(UPLOAD_DIR, filename), join(process.cwd(), 'uploads', filename)]

  // Find the actual file path
  let actualPath = ''
  for (const p of possiblePaths) {
    if (existsSync(p)) {
      actualPath = p
      logger.info(`Found file at: ${actualPath}`)
      break
    }
  }

  if (!actualPath) {
    return {
      success: false,
      error: `File not found: ${filename}`,
      filePath,
    }
  }

  const extension = path.extname(filename).toLowerCase().substring(1)

  // Process the file based on its type
  return isSupportedFileType(extension)
    ? await processWithSpecializedParser(actualPath, filename, extension, fileType, filePath)
    : await handleGenericFile(actualPath, filename, extension, fileType)
}

/**
 * Process a file with a specialized parser
 */
async function processWithSpecializedParser(
  filePath: string,
  filename: string,
  extension: string,
  fileType?: string,
  originalPath?: string
): Promise<ParseResult> {
  try {
    logger.info(`Parsing ${filename} with specialized parser for ${extension}`)
    const result = await parseFile(filePath)

    // Get file stats
    const fileBuffer = await readFile(filePath)
    const fileSize = fileBuffer.length

    // Handle PDF-specific validation
    if (
      extension === 'pdf' &&
      (result.content.includes('\u0000') ||
        result.content.match(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\xFF]{10,}/g))
    ) {
      result.content = createPdfFallbackMessage(result.metadata?.pageCount, fileSize, originalPath)
    }

    return {
      success: true,
      output: {
        content: result.content,
        fileType: fileType || getMimeType(extension),
        size: fileSize,
        name: filename,
        binary: false,
        metadata: result.metadata || {},
      },
      filePath: originalPath || filePath,
    }
  } catch (error) {
    logger.error(`Specialized parser failed for ${extension} file:`, error)

    // Special handling for PDFs
    if (extension === 'pdf') {
      const fileBuffer = await readFile(filePath)
      const fileSize = fileBuffer.length

      // Get page count using a simple regex pattern
      let pageCount = 0
      const pdfContent = fileBuffer.toString('utf-8')
      const pageMatches = pdfContent.match(/\/Type\s*\/Page\b/gi)
      if (pageMatches) {
        pageCount = pageMatches.length
      }

      const content = createPdfFailureMessage(
        pageCount,
        fileSize,
        originalPath || filePath,
        (error as Error).message
      )

      return {
        success: true,
        output: {
          content,
          fileType: fileType || getMimeType(extension),
          size: fileSize,
          name: filename,
          binary: false,
        },
        filePath: originalPath || filePath,
      }
    }

    // For other file types, fall back to generic handling
    return handleGenericFile(filePath, filename, extension, fileType)
  }
}

/**
 * Handle generic file types with basic parsing
 */
async function handleGenericFile(
  filePath: string,
  filename: string,
  extension: string,
  fileType?: string
): Promise<ParseResult> {
  try {
    // Read the file
    const fileBuffer = await readFile(filePath)
    const fileSize = fileBuffer.length

    // Determine if file should be treated as binary
    const isBinary = binaryExtensions.includes(extension)

    // Parse content based on binary status
    const fileContent = isBinary
      ? `[Binary ${extension.toUpperCase()} file - ${fileSize} bytes]`
      : await parseTextFile(fileBuffer)

    return {
      success: true,
      output: {
        content: fileContent,
        fileType: fileType || getMimeType(extension),
        size: fileSize,
        name: filename,
        binary: isBinary,
      },
    }
  } catch (error) {
    logger.error('Error handling generic file:', error)
    return {
      success: false,
      error: `Failed to parse file: ${(error as Error).message}`,
    }
  }
}

/**
 * Parse a text file buffer to string
 */
async function parseTextFile(fileBuffer: Buffer): Promise<string> {
  try {
    return fileBuffer.toString('utf-8')
  } catch (error) {
    return `[Unable to parse file as text: ${(error as Error).message}]`
  }
}

/**
 * Get MIME type from file extension
 */
function getMimeType(extension: string): string {
  return fileTypeMap[extension] || 'application/octet-stream'
}

/**
 * Create a fallback message for PDF files that couldn't be parsed properly
 */
function createPdfFallbackMessage(
  pageCount: number | undefined,
  fileSize: number,
  filePath?: string
): string {
  return `This PDF document could not be parsed for text content. It contains ${pageCount || 'unknown number of'} pages. File size: ${fileSize} bytes.

To view this PDF properly, you can:
1. Download it directly using this URL: ${filePath}
2. Try a dedicated PDF text extraction service or tool
3. Open it with a PDF reader like Adobe Acrobat

PDF parsing failed because the document appears to use an encoding or compression method that our parser cannot handle.`
}

/**
 * Create an error message for PDF files that failed to parse
 */
function createPdfFailureMessage(
  pageCount: number,
  fileSize: number,
  filePath: string,
  errorMessage: string
): string {
  return `PDF parsing failed: ${errorMessage}

This PDF document contains ${pageCount || 'an unknown number of'} pages and is ${fileSize} bytes in size.

To view this PDF properly, you can:
1. Download it directly using this URL: ${filePath}
2. Try a dedicated PDF text extraction service or tool
3. Open it with a PDF reader like Adobe Acrobat

Common causes of PDF parsing failures:
- The PDF uses an unsupported compression algorithm
- The PDF is protected or encrypted
- The PDF content uses non-standard encodings
- The PDF was created with features our parser doesn't support`
}
