import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Conversão mm para pixels (96 DPI)
const DPI = 96;
const MM_TO_PX = DPI / 25.4;

// Dimensões do template em mm
const TEMPLATE_WIDTH_MM = 100;
const TEMPLATE_HEIGHT_MM = 30;

// Layout do template
const LOGO_WIDTH_MM = 10;
const LOGO_MARGIN_MM = 4; // 4mm da borda
const LOGO_GAP_MM = 2;
const TEXT_WIDTH_MM = 58;
const QR_SIZE_MM = 26;
const QR_MARGIN_MM = 4;

function mmToPx(mm: number): number {
  return Math.round(mm * MM_TO_PX);
}

function ptToPx(pt: number): number {
  return (pt * 96) / 72;
}

export async function generateSingleLabel(assetCode: string, qrCodeDataUrl: string) {
  // Template: 100mm x 30mm
  // Logo: 22mm (left)
  // Gap: 4mm
  // Código: ~48mm (center)
  // QR: 20mm (right)
  // Margem: 2mm

  const labelWidthPx = mmToPx(TEMPLATE_WIDTH_MM);
  const labelHeightPx = mmToPx(TEMPLATE_HEIGHT_MM);

  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.width = `${labelWidthPx}px`;
  container.style.height = `${labelHeightPx}px`;
  container.style.backgroundColor = '#e0e0e0';
  container.style.padding = '0';
  container.style.fontFamily = '"Arial", sans-serif';
  container.style.display = 'flex';
  container.style.flexDirection = 'row';
  container.style.justifyContent = 'flex-start';
  container.style.alignItems = 'flex-start';
  container.style.boxSizing = 'border-box';
  container.style.overflow = 'hidden';
  container.style.border = '2px solid #003A78';
  container.style.paddingLeft = `${mmToPx(LOGO_MARGIN_MM)}px`;
  container.style.paddingRight = `${mmToPx(QR_MARGIN_MM)}px`;
  container.style.paddingTop = '3px';

  // Left column - logo + code stacked
  const leftCol = document.createElement('div');
  leftCol.style.display = 'flex';
  leftCol.style.flexDirection = 'column';
  leftCol.style.justifyContent = 'flex-start';
  leftCol.style.alignItems = 'center';
  leftCol.style.flex = '1 1 auto';
  leftCol.style.gap = '3px';
  leftCol.style.overflow = 'visible';

  // Logo left - 10mm
  const logoDiv = document.createElement('div');
  const logoWidthPx = mmToPx(LOGO_WIDTH_MM);
  logoDiv.style.width = `${logoWidthPx}px`;
  logoDiv.style.height = `${logoWidthPx}px`;
  logoDiv.style.flex = '0 0 auto';
  logoDiv.style.fontSize = `${Math.round(logoWidthPx * 0.5)}px`;
  logoDiv.style.fontWeight = '700';
  logoDiv.style.color = '#003A78';
  logoDiv.style.display = 'flex';
  logoDiv.style.alignItems = 'center';
  logoDiv.style.justifyContent = 'center';
  logoDiv.style.whiteSpace = 'nowrap';
  logoDiv.textContent = 'MAHLE';
  leftCol.appendChild(logoDiv);

  // Code center - ~58mm, single line
  const codeDiv = document.createElement('div');
  const textWidthPx = mmToPx(TEXT_WIDTH_MM);
  // Remove "QR Code - " prefix if exists
  const cleanCode = assetCode.replace(/^QR Code - /, '').trim();
  codeDiv.style.width = `${textWidthPx}px`;
  codeDiv.style.fontSize = `${ptToPx(9)}px`;
  codeDiv.style.fontWeight = '600';
  codeDiv.style.color = '#000';
  codeDiv.style.textAlign = 'center';
  codeDiv.style.display = 'flex';
  codeDiv.style.alignItems = 'center';
  codeDiv.style.justifyContent = 'center';
  codeDiv.style.whiteSpace = 'nowrap';
  codeDiv.style.overflow = 'visible';
  codeDiv.style.flex = 'auto';
  codeDiv.textContent = cleanCode;
  leftCol.appendChild(codeDiv);

  container.appendChild(leftCol);

  // QR right - 26mm
  const qrDiv = document.createElement('div');
  const qrSizePx = mmToPx(QR_SIZE_MM);
  qrDiv.style.width = `${qrSizePx}px`;
  qrDiv.style.height = `${qrSizePx}px`;
  qrDiv.style.flex = '0 0 auto';
  qrDiv.style.display = 'flex';
  qrDiv.style.alignItems = 'center';
  qrDiv.style.justifyContent = 'center';
  qrDiv.style.padding = '0';
  qrDiv.style.margin = '0';
  qrDiv.style.overflow = 'hidden';
  qrDiv.style.marginLeft = '2px';
  const qrImg = document.createElement('img');
  qrImg.src = qrCodeDataUrl;
  qrImg.alt = '';
  qrImg.title = '';
  qrImg.style.width = '100%';
  qrImg.style.height = '100%';
  qrImg.style.objectFit = 'contain';
  qrImg.style.maxWidth = `${qrSizePx}px`;
  qrImg.style.maxHeight = `${qrSizePx}px`;
  qrImg.style.display = 'block';
  qrDiv.appendChild(qrImg);
  container.appendChild(qrDiv);

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      backgroundColor: '#e0e0e0',
      scale: 2,
      logging: false,
      useCORS: true,
    });

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [TEMPLATE_WIDTH_MM, TEMPLATE_HEIGHT_MM],
    });

    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, 0, TEMPLATE_WIDTH_MM, TEMPLATE_HEIGHT_MM);

    const filename = `etiqueta-${assetCode.replace(/\//g, '-')}-${Date.now()}.pdf`;
    pdf.save(filename);
  } finally {
    document.body.removeChild(container);
  }
}

export async function generateMultipleLabels(
  assets: Array<{ id: string; asset_code: string; qrCodeDataUrl: string }>
) {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210; // A4 width in mm
  const pageHeight = 297; // A4 height in mm
  const labelWidth = TEMPLATE_WIDTH_MM;
  const labelHeight = TEMPLATE_HEIGHT_MM;
  const marginX = 5;
  const marginY = 5;
  const gapX = 3;
  const gapY = 2;

  // Calculate labels per row and column for A4 (2 columns only)
  const labelsPerRow = 2;
  const labelsPerCol = Math.floor((pageHeight - marginY * 2 + gapY) / (labelHeight + gapY));

  let labelIndex = 0;

  for (const asset of assets) {
    const row = Math.floor(labelIndex / labelsPerRow) % labelsPerCol;
    const col = labelIndex % labelsPerRow;

    // Add new page if needed
    if (labelIndex > 0 && row === 0 && col === 0) {
      pdf.addPage();
    }

    const x = marginX + col * (labelWidth + gapX);
    const y = marginY + row * (labelHeight + gapY);

    // Create label container
    const labelWidthPx = mmToPx(labelWidth);
    const labelHeightPx = mmToPx(labelHeight);

    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = `${labelWidthPx}px`;
    container.style.height = `${labelHeightPx}px`;
    container.style.backgroundColor = '#e0e0e0';
    container.style.padding = '0';
    container.style.fontFamily = '"Arial", sans-serif';
    container.style.display = 'flex';
    container.style.flexDirection = 'row';
    container.style.justifyContent = 'flex-start';
    container.style.alignItems = 'flex-start';
    container.style.boxSizing = 'border-box';
    container.style.overflow = 'hidden';
    container.style.border = '2px solid #003A78';
    container.style.paddingLeft = `${mmToPx(LOGO_MARGIN_MM)}px`;
    container.style.paddingRight = `${mmToPx(QR_MARGIN_MM)}px`;
    container.style.paddingTop = '3px';

    // Left column - logo + code stacked
    const leftCol = document.createElement('div');
    leftCol.style.display = 'flex';
    leftCol.style.flexDirection = 'column';
    leftCol.style.justifyContent = 'flex-start';
    leftCol.style.alignItems = 'center';
    leftCol.style.flex = '1 1 auto';
    leftCol.style.gap = '3px';
    leftCol.style.overflow = 'visible';

    // Logo left - 10mm
    const logoDiv = document.createElement('div');
    const logoWidthPx = mmToPx(LOGO_WIDTH_MM);
    logoDiv.style.width = `${logoWidthPx}px`;
    logoDiv.style.height = `${logoWidthPx}px`;
    logoDiv.style.flex = '0 0 auto';
    logoDiv.style.fontSize = `${Math.round(logoWidthPx * 0.5)}px`;
    logoDiv.style.fontWeight = '700';
    logoDiv.style.color = '#003A78';
    logoDiv.style.display = 'flex';
    logoDiv.style.alignItems = 'center';
    logoDiv.style.justifyContent = 'center';
    logoDiv.style.whiteSpace = 'nowrap';
    logoDiv.textContent = 'MAHLE';
    leftCol.appendChild(logoDiv);

    // Code center - ~58mm, single line
    const codeDiv = document.createElement('div');
    const textWidthPx = mmToPx(TEXT_WIDTH_MM);
    // Remove "QR Code - " prefix if exists
    const cleanCode = asset.asset_code.replace(/^QR Code - /, '').trim();
    codeDiv.style.width = `${textWidthPx}px`;
    codeDiv.style.fontSize = `${ptToPx(9)}px`;
    codeDiv.style.fontWeight = '600';
    codeDiv.style.color = '#000';
    codeDiv.style.textAlign = 'center';
    codeDiv.style.display = 'flex';
    codeDiv.style.alignItems = 'center';
    codeDiv.style.justifyContent = 'center';
    codeDiv.style.whiteSpace = 'nowrap';
    codeDiv.style.overflow = 'visible';
    codeDiv.style.flex = 'auto';
    codeDiv.textContent = cleanCode;
    leftCol.appendChild(codeDiv);

    container.appendChild(leftCol);

    // QR right - 26mm
    const qrDiv = document.createElement('div');
    const qrSizePx = mmToPx(QR_SIZE_MM);
    qrDiv.style.width = `${qrSizePx}px`;
    qrDiv.style.height = `${qrSizePx}px`;
    qrDiv.style.flex = '0 0 auto';
    qrDiv.style.display = 'flex';
    qrDiv.style.alignItems = 'center';
    qrDiv.style.justifyContent = 'center';
    qrDiv.style.padding = '0';
    qrDiv.style.margin = '0';
    qrDiv.style.overflow = 'hidden';
    qrDiv.style.marginLeft = '2px';
    const qrImg = document.createElement('img');
    qrImg.src = asset.qrCodeDataUrl;
    qrImg.alt = '';
    qrImg.title = '';
    qrImg.style.width = '100%';
    qrImg.style.height = '100%';
    qrImg.style.objectFit = 'contain';
    qrImg.style.maxWidth = `${qrSizePx}px`;
    qrImg.style.maxHeight = `${qrSizePx}px`;
    qrImg.style.display = 'block';
    qrDiv.appendChild(qrImg);
    container.appendChild(qrDiv);

    document.body.appendChild(container);

    try {
      const canvas = await html2canvas(container, {
        backgroundColor: '#e0e0e0',
        scale: 2,
        logging: false,
        useCORS: true,
      });

      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', x, y, labelWidth, labelHeight);
    } finally {
      document.body.removeChild(container);
    }

    labelIndex++;
  }

  const filename = `etiquetas-${assets.length}-${Date.now()}.pdf`;
  pdf.save(filename);
}
