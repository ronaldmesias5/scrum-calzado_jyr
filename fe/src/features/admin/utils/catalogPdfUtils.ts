import jsPDF from 'jspdf';
import type { Product } from '@/services/catalogService';
import { API_URL } from '@/services/config';

const COLORS = {
  primary: [30, 64, 175] as [number, number, number],
  dark: [30, 58, 138] as [number, number, number],
  accent: [217, 119, 6] as [number, number, number],
  green: [22, 163, 74] as [number, number, number],
  gray: [107, 114, 128] as [number, number, number],
  lightGray: [243, 244, 246] as [number, number, number],
  border: [209, 213, 219] as [number, number, number],
  white: [255, 255, 255] as [number, number, number]
};

type SizeInfo = { size: string; available: number };

function getSizesForCategory(categoryName?: string | null): SizeInfo[] {
  const cat = (categoryName || '').toLowerCase();
  let sizes: number[] = [];
  if (cat.includes('infantil') || cat.includes('niño') || cat.includes('nino')) {
    sizes = Array.from({ length: 12 }, (_, i) => 21 + i);
  } else if (cat.includes('dama') || cat.includes('mujer')) {
    sizes = Array.from({ length: 6 }, (_, i) => 33 + i);
  } else if (cat.includes('caballero') || cat.includes('hombre')) {
    sizes = Array.from({ length: 11 }, (_, i) => 33 + i);
  } else {
    sizes = Array.from({ length: 11 }, (_, i) => 33 + i);
  }
  return sizes.map((s) => ({ size: String(s), available: 1 }));
}

function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .trim();
}

function formatDateTime(): string {
  return new Date().toLocaleString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

async function loadLogoBase64(): Promise<string | null> {
  try {
    const img = new Image();
    return await new Promise<string | null>((resolve) => {
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 70;
          canvas.height = 70;
          const ctx = canvas.getContext('2d');
          if (!ctx) { resolve(null); return; }
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, 70, 70);
          resolve(canvas.toDataURL('image/png'));
        } catch { resolve(null); }
      };
      img.onerror = () => resolve(null);
      img.src = '/logo.png';
    });
  } catch { return null; }
}

function loadImageBase64(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const maxDim = 400;
        canvas.width = maxDim;
        canvas.height = maxDim;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(null); return; }
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        const aspect = img.width / img.height;
        let sx = 0, sy = 0, sw = img.width, sh = img.height;
        if (aspect > 1) { sx = (img.width - img.height) / 2; sw = img.height; }
        else { sy = (img.height - img.width) / 2; sh = img.width; }
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, maxDim, maxDim);
        resolve(canvas.toDataURL('image/jpeg', 0.95));
      } catch { resolve(null); }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function resolveImageUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('/uploads/')) {
    const filename = url.replace('/uploads/', '');
    return `${API_URL}/api/v1/uploads/${filename}`;
  }
  return url;
}

function addHeader(doc: jsPDF, logoBase64: string | null, totalProducts: number) {
  const pageWidth = 210;
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 46, 'F');
  doc.setTextColor(255, 255, 255);

  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generado: ${formatDateTime()}`, pageWidth - 14, 9, { align: 'right' });

  if (logoBase64) {
    doc.addImage(logoBase64, 'PNG', 14, 4, 16, 16);
  }

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('CALZADO J&R', 34, 13);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Fábrica de Calzado', 34, 18);

  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.3);
  doc.line(14, 23, pageWidth - 14, 23);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Catálogo de Productos', 14, 33);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `${totalProducts} productos  │  Precios al por mayor`,
    14,
    39
  );
}

function addFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  const dateStr = new Date().toLocaleDateString('es-CO');
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.gray);
    doc.text(
      `CALZADO J&R — Catálogo ${dateStr} — Página ${i} de ${pageCount} — WhatsApp: 313-706-1602`,
      14,
      290
    );
  }
}

function getSizeRange(sizes: SizeInfo[]): string {
  const available = sizes.filter((s) => s.available > 0);
  if (available.length === 0) return 'N/A';
  const nums = available.map((s) => parseInt(s.size, 10)).filter((n) => !isNaN(n)).sort((a, b) => a - b);
  if (nums.length === 0) return available.map((s) => s.size).join(', ');
  if (nums.length === 1) return `${nums[0]}`;
  return `${nums[0]} al ${nums[nums.length - 1]}`;
}

function drawProductCard(
  doc: jsPDF,
  x: number,
  y: number,
  cardW: number,
  cardH: number,
  product: Product,
  sizes: SizeInfo[],
  imageBase64: string | null
) {
  doc.setFillColor(...COLORS.white);
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, cardW, cardH, 2, 2, 'FD');

  const padding = 2;
  const imgX = x + padding;
  const imgY = y + padding;
  const imgW = cardW - padding * 2;
  const imgH = 22;

  if (imageBase64) {
    doc.addImage(imageBase64, 'JPEG', imgX, imgY, imgW, imgH);
  } else {
    doc.setFillColor(...COLORS.lightGray);
    doc.roundedRect(imgX, imgY, imgW, imgH, 1, 1, 'F');
    doc.setFontSize(6);
    doc.setTextColor(...COLORS.gray);
    doc.text('Sin imagen', imgX + imgW / 2, imgY + imgH / 2 + 1.5, { align: 'center' });
  }

  const infoY = imgY + imgH + 1.5;
  const colW = (cardW - padding * 2 - 2) / 2;
  const leftX = x + padding;
  const rightX = leftX + colW + 2;
  const lh = 3;

  // Columna izquierda: nombre + marca/estilo
  let ly = infoY + 2.5;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  const nameLines = doc.splitTextToSize(product.name || 'Sin nombre', colW);
  doc.text(nameLines[0], leftX, ly);
  ly += lh;

  if (product.brand_name || product.style_name) {
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.gray);
    const bs = [product.brand_name, product.style_name].filter(Boolean).join(' — ');
    doc.text(doc.splitTextToSize(bs, colW)[0], leftX, ly);
  }

  // Columna derecha: categoría + color + talla
  let ry = infoY + 2.5;
  if (product.category_name) {
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.primary);
    doc.text(product.category_name, rightX, ry);
    ry += lh;
  }

  if (product.color) {
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(`Color: ${product.color}`, rightX, ry);
    ry += lh;
  }

  doc.setFontSize(5.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.dark);
  doc.text(`Talla: ${getSizeRange(sizes)}`, rightX, ry);
}

export async function exportCatalogPDF(
  products: Product[],
  title?: string
): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const reportTitle = title || 'Catálogo de Productos';

  const logo = await loadLogoBase64();
  addHeader(doc, logo, products.length);

  const imageUrls = products.map((p) => resolveImageUrl(p.image_url));
  const images = await Promise.all(
    imageUrls.map((url) => (url ? loadImageBase64(url) : Promise.resolve(null)))
  );

  const marginX = 14;
  const gap = 3;
  const cols = 3;
  const cardW = (210 - marginX * 2 - gap * (cols - 1)) / cols;
  const cardH = 42;
  const startY = 50;

  let curY = startY;

  for (let idx = 0; idx < products.length; idx++) {
    const product = products[idx];
    if (!product) continue;
    const col = idx % cols;
    const pageBottom = 285;

    if (col === 0 && idx > 0) {
      curY += cardH + gap;
    }

    if (curY + cardH > pageBottom) {
      doc.addPage();
      curY = 14;
    }

    const curX = marginX + col * (cardW + gap);
    const sizes = getSizesForCategory(product.category_name);
    drawProductCard(doc, curX, curY, cardW, cardH, product, sizes, images[idx] || null);
  }

  addFooter(doc);
  doc.save(sanitizeFilename(`${reportTitle}_${new Date().toLocaleDateString('es-CO').replace(/\//g, '-')}.pdf`));
}
