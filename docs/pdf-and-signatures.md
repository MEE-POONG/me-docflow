# PDF export and online signing

The document detail toolbar offers direct PDF download and a signature pad. Signing requires the active company user's account password and explicit consent. The application records the account name, timestamp, SHA-256 content digest and selected template snapshot in `dataJson.electronicSignature`, plus an audit log. The document is locked after signing. Standard quotations display the signature above the purchase approver line on the original page, without an extra signature page. Other document layouts append a signature record page. This is a drawn electronic signature, not a certificate-based PDF digital signature or an external invitation service.

## Server requirements

- Windows: Google Chrome installed (Playwright uses the `chrome` channel).
- Linux: run `npx playwright install --with-deps chromium` when provisioning the server.
- Optional `PDF_CHROME_PATH`: absolute path to a compatible Chromium executable.
- Optional `DOCUMENT_PDF_BASE_URL`: internal URL of this Next.js application. Default: `http://localhost:${PORT || 3000}`. This must point to the same app and database; it is server configuration, never a user-supplied URL.

The Node route `/api/documents/[id]/pdf` checks company access, loads the print preview, waits for fonts/images, and returns an attachment. It closes the browser even on error and rejects exports if the document changes during generation. Signed documents always use their saved template snapshot.

## Checks

`node --test tests/documents.test.cjs tests/payment-items.test.cjs`

Manual checks: save a document, download the PDF, draw a test signature on a disposable test document, confirm with that test account's password, verify the document is locked, and download again. A standard quotation should show the signature above the purchase approver line on its original page. Other layouts append the signature record. Do not sign a real document as a test.

