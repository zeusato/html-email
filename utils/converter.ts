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
 * Convert HTML content to have inline styles for email compatibility
 * Processes all elements and adds inline styles directly
 */
const inlineStyles = (html: string, fontFamily: string): string => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div id="root">${html}</div>`, 'text/html');
  const root = doc.getElementById('root');

  if (!root) return html;

  const baseStyle = `font-family: ${fontFamily}; font-size: 11pt; color: #333333;`;

  const processElement = (element: Element) => {
    const tagName = element.tagName.toLowerCase();
    let styles: string[] = [];

    switch (tagName) {
      case 'p':
        styles.push(baseStyle, 'text-align: justify', 'padding: 10px 0', 'margin: 0');
        break;
      case 'h1':
        styles.push(baseStyle, 'font-size: 24px', 'font-weight: bold', 'padding: 10px 0', 'margin: 0');
        break;
      case 'h2':
        styles.push(baseStyle, 'font-size: 20px', 'font-weight: bold', 'padding: 10px 0', 'margin: 0');
        break;
      case 'h3':
        styles.push(baseStyle, 'font-size: 16px', 'font-weight: bold', 'padding: 10px 0', 'margin: 0');
        break;
      case 'strong':
      case 'b':
        styles.push('font-weight: bold');
        break;
      case 'em':
      case 'i':
        styles.push('font-style: italic');
        break;
      case 'u':
        styles.push('text-decoration: underline');
        break;
      case 'a':
        styles.push('color: #0066cc', 'text-decoration: underline');
        break;
      case 'ul':
        styles.push('margin: 0', 'padding: 0 0 0 20px');
        break;
      case 'ol':
        styles.push('margin: 0', 'padding: 0 0 0 20px');
        break;
      case 'li':
        styles.push(baseStyle, 'padding: 5px 0', 'margin: 0');
        break;
      case 'img':
        styles.push('max-width: 100%', 'height: auto', 'display: block');
        break;
      case 'div':
        // Check if it's an image container with alignment
        const textAlign = (element as HTMLElement).style.textAlign;
        if (textAlign) {
          styles.push(`text-align: ${textAlign}`, 'margin: 10px 0');
        }
        break;
    }

    // Merge with existing styles
    const existingStyle = element.getAttribute('style') || '';
    if (styles.length > 0) {
      const newStyle = existingStyle ? `${styles.join('; ')}; ${existingStyle}` : styles.join('; ');
      element.setAttribute('style', newStyle);
    }

    // Process children
    Array.from(element.children).forEach(child => processElement(child));
  };

  processElement(root);
  return root.innerHTML;
};

/**
 * Convert content to table rows format (each block element becomes a table row)
 */
const contentToTableRows = (html: string, fontFamily: string): string => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div id="root">${html}</div>`, 'text/html');
  const root = doc.getElementById('root');

  if (!root) return html;

  const baseStyle = `font-family: ${fontFamily}; font-size: 11pt; color: #333333; text-align: justify; padding: 10px 0;`;
  
  let rows = '';
  
  // Process each top-level element
  Array.from(root.children).forEach(child => {
    const tagName = child.tagName.toLowerCase();
    let cellStyle = baseStyle;
    let content = child.innerHTML;
    
    // Handle special tags
    switch (tagName) {
      case 'h1':
        cellStyle = `font-family: ${fontFamily}; font-size: 24px; font-weight: bold; color: #333333; padding: 10px 0;`;
        content = `<strong>${child.innerHTML}</strong>`;
        break;
      case 'h2':
        cellStyle = `font-family: ${fontFamily}; font-size: 20px; font-weight: bold; color: #333333; padding: 10px 0;`;
        content = `<strong>${child.innerHTML}</strong>`;
        break;
      case 'h3':
        cellStyle = `font-family: ${fontFamily}; font-size: 16px; font-weight: bold; color: #333333; padding: 10px 0;`;
        content = `<strong>${child.innerHTML}</strong>`;
        break;
      case 'ul':
      case 'ol':
        cellStyle = `font-family: ${fontFamily}; font-size: 11pt; color: #333333; padding: 5px 0 5px 20px;`;
        content = child.outerHTML;
        break;
      case 'div':
        // Check for image container
        const img = child.querySelector('img');
        if (img) {
          const align = (child as HTMLElement).style.textAlign || 'center';
          const imgSrc = img.getAttribute('src') || '';
          const imgWidth = (img as HTMLImageElement).style.width || '';
          const widthAttr = imgWidth ? `width="${imgWidth.replace('px', '')}"` : '';
          content = `<img src="${imgSrc}" ${widthAttr} style="display: block; max-width: 100%; height: auto;" alt="Image" />`;
          cellStyle = `padding: 10px 0; text-align: ${align};`;
        }
        break;
    }
    
    rows += `
                <tr>
                    <td style="${cellStyle}">
                        ${content}
                    </td>
                </tr>`;
  });
  
  return rows;
};

/**
 * Generate email HTML - simplified format, just the table structure
 * All styles are inline, compatible with Outlook
 */
export const generateFullEmailHtml = (
  bodyHtml: string,
  headerImg: string | null,
  footerImg: string | null,
  outlookCompatible: boolean = false,
  maxWidth: number = 600,
  fontFamily: string = 'Arial, sans-serif'
): string => {
  // Process body HTML to have inline styles
  const processedBody = inlineStyles(bodyHtml, fontFamily);
  
  // Header image row
  const headerHtml = headerImg
    ? `
            <!-- Header Image -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                    <td style="margin: 0; padding: 0;">
                        <img style="width: 100%; max-width: ${maxWidth}px; height: auto; display: block;"
                            src="${headerImg}"
                            width="${maxWidth}" alt="Header">
                    </td>
                </tr>
            </table>`
    : '';

  // Footer image row  
  const footerHtml = footerImg
    ? `
            <!-- Footer Image -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                    <td style="margin: 0; padding: 0;">
                        <img style="width: 100%; max-width: ${maxWidth}px; height: auto; display: block;"
                            src="${footerImg}"
                            width="${maxWidth}" alt="Footer">
                    </td>
                </tr>
            </table>`
    : '';

  // Content rows
  const contentRows = contentToTableRows(processedBody, fontFamily);

  // Generate the simplified email HTML (table only, no DOCTYPE/html/head)
  return `<!--[if mso]>
<table role="presentation" width="${maxWidth}" align="center" cellpadding="0" cellspacing="0" border="0">
<tr><td>
<![endif]-->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
    style="max-width: ${maxWidth}px; margin: 0 auto;">
    <tr>
        <td>${headerHtml}

            <!-- Content -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                style="max-width: ${maxWidth}px;">${contentRows}
            </table>${footerHtml}
        </td>
    </tr>
</table>
<!--[if mso]>
</td></tr>
</table>
<![endif]-->`;
};
