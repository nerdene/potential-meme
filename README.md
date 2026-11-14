# File Renamer

Static site. Reads clearance certificates and other PDFs in the browser, recognises the document type (SSNIT, tax, power of attorney, labour) or uses the bold heading, and renames the file to `COMPANY-TYPE-CLIENT-MON-YEAR`. Nothing is uploaded; there is no backend or analytics.

## Deploy to Vercel
Make sure `index.html` is at the top level of the project, not inside a subfolder.
1. `npm i -g vercel`
2. In this folder run `vercel --prod` (no framework, no build command, output directory `.`).

Or push these files to GitHub and import the repo at vercel.com/new (Framework: Other).

## Updating
The service worker caches files. After changing anything, bump `V` in `sw.js` (for example `file-renamer-v2`).

## Notes
- Settings (companies, naming formats) are stored in each browser's local storage.
- `vendor/` holds pdf.js 3.11.174 (Apache-2.0) and JSZip 3.10.1 (MIT/GPL dual licence, used under MIT). `fonts/` holds IBM Plex and Fraunces (SIL OFL).
