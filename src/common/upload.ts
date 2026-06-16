import { BadRequestException } from '@nestjs/common';

// 15 MB cap for proxied PDF uploads (unsigned/signed contract, W-8BEN). With this
// cap, buffering the file in memory before streaming to Drive is fine.
export const MAX_DOCUMENT_BYTES = 15 * 1024 * 1024;

// Rejects non-PDFs by their declared mime type up front. The %PDF- magic bytes
// are verified server-side as well, since the client-supplied mime is untrusted.
export const pdfFileFilter = (
    _req: unknown,
    file: { mimetype: string },
    cb: (error: Error | null, acceptFile: boolean) => void,
): void => {
    if (file.mimetype !== 'application/pdf') {
        cb(new BadRequestException('Only PDF files are allowed'), false);
        return;
    }
    cb(null, true);
};
