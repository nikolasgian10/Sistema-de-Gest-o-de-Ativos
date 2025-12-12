import { createCanvas } from 'canvas';
import fs from 'fs';
import path from 'path';

// Dimensões em mm
const WIDTH_MM = 100;
const HEIGHT_MM = 30;

// Conversão mm para pixels (96 DPI padrão)
const DPI = 96;
const MM_TO_PX = DPI / 25.4;

const WIDTH_PX = WIDTH_MM * MM_TO_PX;
const HEIGHT_PX = HEIGHT_MM * MM_TO_PX;

// Cria o canvas
const canvas = createCanvas(WIDTH_PX, HEIGHT_PX);
const ctx = canvas.getContext('2d');

// Fundo cinza
ctx.fillStyle = '#e0e0e0';
ctx.fillRect(0, 0, WIDTH_PX, HEIGHT_PX);

// Define as áreas do layout
const logoWidth = 22 * MM_TO_PX;
const gap = 4 * MM_TO_PX;
const textWidth = 48 * MM_TO_PX;
const qrSize = 20 * MM_TO_PX;
const marginRight = 2 * MM_TO_PX;

// Desenha áreas com bordas para visualização (pode remover depois)
// Logo area
ctx.strokeStyle = '#999';
ctx.lineWidth = 1;
ctx.strokeRect(0, 0, logoWidth, HEIGHT_PX);

// Espaço
ctx.strokeRect(logoWidth, 0, gap, HEIGHT_PX);

// Texto area
const textX = logoWidth + gap;
ctx.strokeRect(textX, 0, textWidth, HEIGHT_PX);

// QR area
const qrX = textX + textWidth;
ctx.strokeRect(qrX, 0, qrSize, HEIGHT_PX);

// Margem
ctx.strokeRect(qrX + qrSize, 0, marginRight, HEIGHT_PX);

// Texto informativo nas áreas (para visualização)
ctx.fillStyle = '#999';
ctx.font = '8px Arial';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';

// Label das áreas
ctx.fillText('LOGO\n22mm', logoWidth / 2, HEIGHT_PX / 2);
ctx.fillText('QR\n20mm', qrX + qrSize / 2, HEIGHT_PX / 2);
ctx.fillText('CÓDIGO\n~48mm', textX + textWidth / 2, HEIGHT_PX / 2);

// Cria diretório se não existir
const templatesDir = path.join(process.cwd(), 'public', 'templates');
if (!fs.existsSync(templatesDir)) {
  fs.mkdirSync(templatesDir, { recursive: true });
}

// Salva a imagem
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync(path.join(templatesDir, 'label-template.png'), buffer);

console.log('Template criado com sucesso!');
console.log(`Dimensões: ${WIDTH_MM}mm × ${HEIGHT_MM}mm (${WIDTH_PX}px × ${HEIGHT_PX}px)`);
console.log(`Logo: 22mm | Espaço: 4mm | Texto: ~48mm | QR: 20mm | Margem: 2mm`);
console.log(`Arquivo: ${path.join(templatesDir, 'label-template.png')}`);
