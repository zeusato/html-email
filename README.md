# DocxToEmail Converter

A pure client-side web application that transforms Microsoft Word documents (.docx) into responsive, email-ready HTML. 

## Environment Note

**This version has been refactored for browser-only environments.** 
It removes dependency on server-side libraries (Express, Puppeteer) to ensure stability in previews.

## Features

1.  **Docx Conversion**: Uses `mammoth.js` in the browser to convert .docx files.
2.  **Custom Branding**: Upload header and footer images instantly.
3.  **Dual Editing**:
    *   **Visual Editor**: WYSIWYG editing via Quill.js.
    *   **Code Editor**: Direct HTML source editing.
4.  **Export**:
    *   **HTML**: Download clean HTML files.
    *   **PDF**: Uses native browser printing for PDF generation.

## Tech Stack

*   React 18 (Client Side)
*   TypeScript
*   TailwindCSS
*   React-Quill
*   Mammoth.js

## Usage

1.  Upload a `.docx` file.
2.  Upload header/footer images (optional).
3.  Edit the content visually or via code.
4.  Click "Export HTML" to save the file.
