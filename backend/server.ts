import express from 'express';
import multer from 'multer';
import mammoth from 'mammoth';
import puppeteer from 'puppeteer';
import cors from 'cors';
import path from 'path';

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// POST /api/convert
// Converts Docx to HTML
app.post('/api/convert', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const result = await mammoth.convertToHtml({ buffer: req.file.buffer });
    res.json({ html: result.value, messages: result.messages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Conversion failed' });
  }
});

// POST /api/pdf
// Converts HTML to PDF
app.post('/api/pdf', async (req, res) => {
  const { html } = req.body;
  
  if (!html) {
    return res.status(400).json({ error: 'No HTML content provided' });
  }

  try {
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Length': pdfBuffer.length,
    });
    res.send(pdfBuffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'PDF generation failed' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
