import mammoth from 'mammoth';

export const convertDocxToHtml = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  try {
    const result = await mammoth.convertToHtml({ arrayBuffer });
    return result.value;
  } catch (error) {
    console.error("Conversion error", error);
    throw new Error("Failed to convert DOCX file.");
  }
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Convert modern HTML to Outlook-compatible HTML
 * Handles Outlook 2007-2019 which uses Word rendering engine
 */
const convertToOutlookCompatible = (html: string): string => {
  // Create a temporary DOM to parse and modify HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div id="root">${html}</div>`, 'text/html');
  const root = doc.getElementById('root');

  if (!root) return html;

  // Process all elements to inline critical styles
  const processElement = (element: Element) => {
    const tagName = element.tagName.toLowerCase();
    const existingStyle = element.getAttribute('style') || '';
    let newStyles: string[] = [];

    // Add default styles based on tag type
    switch (tagName) {
      case 'p':
        newStyles.push('margin: 0', 'padding: 0', 'mso-line-height-rule: exactly');
        break;
      case 'h1':
        newStyles.push('margin: 0', 'padding: 0', 'font-size: 24px', 'font-weight: bold', 'mso-line-height-rule: exactly');
        break;
      case 'h2':
        newStyles.push('margin: 0', 'padding: 0', 'font-size: 20px', 'font-weight: bold', 'mso-line-height-rule: exactly');
        break;
      case 'h3':
        newStyles.push('margin: 0', 'padding: 0', 'font-size: 16px', 'font-weight: bold', 'mso-line-height-rule: exactly');
        break;
      case 'img':
        newStyles.push('display: block', 'border: 0', 'outline: none', 'text-decoration: none');
        // Add width/height attributes for Outlook
        const imgEl = element as HTMLImageElement;
        if (imgEl.style.width) {
          element.setAttribute('width', imgEl.style.width.replace('px', ''));
        }
        if (imgEl.style.height) {
          element.setAttribute('height', imgEl.style.height.replace('px', ''));
        }
        break;
      case 'a':
        newStyles.push('color: #0066cc', 'text-decoration: underline');
        break;
      case 'ul':
      case 'ol':
        newStyles.push('margin: 0', 'padding: 0 0 0 20px');
        break;
      case 'li':
        newStyles.push('margin: 0', 'padding: 0');
        break;
      case 'strong':
      case 'b':
        newStyles.push('font-weight: bold');
        break;
      case 'em':
      case 'i':
        newStyles.push('font-style: italic');
        break;
    }

    // Merge existing styles with new ones
    if (newStyles.length > 0) {
      const combinedStyle = existingStyle
        ? `${existingStyle}; ${newStyles.join('; ')}`
        : newStyles.join('; ');
      element.setAttribute('style', combinedStyle);
    }

    // Process children
    Array.from(element.children).forEach(child => processElement(child));
  };

  processElement(root);

  return root.innerHTML;
};

/**
 * Generate full email HTML with optional Outlook compatibility mode
 */
export const generateFullEmailHtml = (
  bodyHtml: string,
  headerImg: string | null,
  footerImg: string | null,
  outlookCompatible: boolean = false,
  maxWidth: number = 600,
  fontFamily: string = 'Arial, sans-serif'
) => {
  // Process body HTML for Outlook if needed
  const processedBody = outlookCompatible ? convertToOutlookCompatible(bodyHtml) : bodyHtml;

  if (outlookCompatible) {
    return generateOutlookEmail(processedBody, headerImg, footerImg, maxWidth, fontFamily);
  }

  // Standard modern email template
  const headerHtml = headerImg
    ? `<div style="text-align: center; margin-bottom: 20px;"><img src="${headerImg}" style="max-width: 100%; height: auto;" alt="Header" /></div>`
    : '';

  const footerHtml = footerImg
    ? `<div style="text-align: center; margin-top: 20px;"><img src="${footerImg}" style="max-width: 100%; height: auto;" alt="Footer" /></div>`
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body { font-family: ${fontFamily}; line-height: 1.6; color: #333; margin: 0; padding: 0; }
  .email-container { max-width: ${maxWidth}px; margin: 0 auto; padding: 20px; }
  .email-content { background: #ffffff; font-family: inherit; }
  img { max-width: 100%; }
  table { width: 100%; border-collapse: collapse; }
  td, th { border: 1px solid #ddd; padding: 8px; }
  strong, b { font-weight: bold; font-family: inherit; }
  em, i { font-style: italic; font-family: inherit; }
  p, div, span, li, td, th, h1, h2, h3, h4, h5, h6 { font-family: inherit; }
</style>
</head>
<body>
  <div class="email-container">
    ${headerHtml}
    <div class="email-content">
      ${processedBody}
    </div>
    ${footerHtml}
  </div>
</body>
</html>`;
};

/**
 * Generate Outlook-compatible email using table-based layout
 * with MSO conditional comments for maximum compatibility
 */
const generateOutlookEmail = (
  bodyHtml: string,
  headerImg: string | null,
  footerImg: string | null,
  maxWidth: number = 600,
  fontFamily: string = 'Arial, Helvetica, sans-serif'
): string => {
  const headerHtml = headerImg
    ? `
    <tr>
      <td align="center" style="padding: 0 0 20px 0;">
        <!--[if mso]>
        <v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:${maxWidth}px;">
        <v:fill type="frame" src="${headerImg}" />
        <v:textbox inset="0,0,0,0">
        <![endif]-->
        <img src="${headerImg}" width="${maxWidth}" style="display: block; width: 100%; max-width: ${maxWidth}px; height: auto; border: 0;" alt="Header" />
        <!--[if mso]>
        </v:textbox>
        </v:rect>
        <![endif]-->
      </td>
    </tr>`
    : '';

  const footerHtml = footerImg
    ? `
    <tr>
      <td align="center" style="padding: 20px 0 0 0;">
        <img src="${footerImg}" width="${maxWidth}" style="display: block; width: 100%; max-width: ${maxWidth}px; height: auto; border: 0;" alt="Footer" />
      </td>
    </tr>`
    : '';

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <!--[if gte mso 9]>
  <xml>
    <o:OfficeDocumentSettings>
      <o:AllowPNG/>
      <o:PixelsPerInch>96</o:PixelsPerInch>
    </o:OfficeDocumentSettings>
  </xml>
  <![endif]-->
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Email</title>
  
  <!--[if mso]>
  <style type="text/css">
    body, table, td, a { font-family: ${fontFamily} !important; }
    table { border-collapse: collapse; }
  </style>
  <![endif]-->
  
  <!--[if !mso]><!-->
  <style type="text/css">
    body {
      margin: 0 !important;
      padding: 0 !important;
      -webkit-text-size-adjust: 100% !important;
      -ms-text-size-adjust: 100% !important;
    }
    img {
      -ms-interpolation-mode: bicubic;
    }
    a[x-apple-data-detectors] {
      color: inherit !important;
      text-decoration: none !important;
    }
  </style>
  <!--<![endif]-->
</head>
<body style="margin: 0 !important; padding: 0 !important; background-color: #f4f4f4;" bgcolor="#f4f4f4">
  
  <!--[if mso]>
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#f4f4f4">
  <tr>
  <td align="center">
  <![endif]-->
  
  <!-- Outer wrapper table for centering -->
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f4;" bgcolor="#f4f4f4">
    <tr>
      <td align="center" style="padding: 20px 10px;">
        
        <!--[if mso]>
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="${maxWidth}" align="center">
        <tr>
        <td>
        <![endif]-->
        
        <!-- Main content table - ${maxWidth}px max width -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: ${maxWidth}px; background-color: #ffffff;" bgcolor="#ffffff">
          
          ${headerHtml}
          
          <!-- Email Body -->
          <tr>
            <td style="padding: 20px; font-family: ${fontFamily}; font-size: 14px; line-height: 1.6; color: #333333;" bgcolor="#ffffff">
              ${bodyHtml}
            </td>
          </tr>
          
          ${footerHtml}
          
        </table>
        <!-- End main content table -->
        
        <!--[if mso]>
        </td>
        </tr>
        </table>
        <![endif]-->
        
      </td>
    </tr>
  </table>
  <!-- End outer wrapper table -->
  
  <!--[if mso]>
  </td>
  </tr>
  </table>
  <![endif]-->
  
</body>
</html>`;
};
