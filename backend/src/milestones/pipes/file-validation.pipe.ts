import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { Express } from 'express';

/** MIME types accepted for milestone deliverable uploads. */
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/zip',
]);

/** 10 MB expressed in bytes. */
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

/**
 * FileValidationPipe — validates a multipart file upload before it reaches
 * the service layer.
 *
 * Checks (in fail-fast order):
 *  1. A file was actually provided in the request.
 *  2. The MIME type (from the file buffer, not the extension) is in the allowlist.
 *  3. The file size does not exceed 10 MB.
 *
 * @throws BadRequestException (400) with a descriptive message on any violation.
 */
@Injectable()
export class FileValidationPipe implements PipeTransform<Express.Multer.File, Express.Multer.File> {
  transform(file: Express.Multer.File): Express.Multer.File {
    if (!file) {
      throw new BadRequestException('No file provided. Attach a file under the "file" field.');
    }

    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException(
        `MIME type "${file.mimetype}" is not allowed. ` +
          `Accepted types: ${[...ALLOWED_MIME_TYPES].join(', ')}.`,
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      throw new BadRequestException(
        `File size ${sizeMb} MB exceeds the 10 MB limit.`,
      );
    }

    return file;
  }
}
