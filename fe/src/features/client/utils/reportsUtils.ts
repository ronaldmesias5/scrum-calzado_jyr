import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ClientAllOrdersReport } from '@/services/clientApi';

const COLORS = {
  primary: [30, 64, 175] as [number, number, number],
  gray: [107, 114, 128] as [number, number, number],
  lightGray: [243, 244, 246] as [number, number, number],
  green: [22, 163, 74] as [number, number, number],
};

function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .trim();
}

function formatDate(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(): string {
  return new Date().toLocaleString('es-CO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

async function loadLogoBase64(): Promise<string | null> {
  try {
    const img = new Image();
    return await new Promise<string | null>((resolve) => {
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 35;
          canvas.height = 35;
          const ctx = canvas.getContext('2d');
          if (!ctx) { resolve(null); return; }
          ctx.drawImage(img, 0, 0, 35, 35);
          resolve(canvas.toDataURL('image/png'));
        } catch { resolve(null); }
      };
      img.onerror = () => resolve(null);
      img.src = '/logo.png';
    });
  } catch { return null; }
}

function addHeader(doc: jsPDF, title: string, subtitle?: string, logoBase64?: string | null) {
  const genStr = `Generado: ${formatDateTime()}`;
  if (logoBase64) {
    doc.setFillColor(...COLORS.primary);
    doc.rect(0, 0, 210, 54, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.text(genStr, 196, 9, { align: 'right' });
    doc.addImage(logoBase64, 'PNG', 14, 4, 18, 18);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('CALZADO J&R', 37, 14);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('Fábrica de Calzado', 37, 19);
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.3);
    doc.line(14, 27, 196, 27);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 14, 38);
    if (subtitle) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(subtitle, 14, 46);
    }
  } else {
    doc.setFillColor(...COLORS.primary);
    doc.rect(0, 0, 210, 32, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 14, 16);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.text(genStr, 196, 12, { align: 'right' });
    if (subtitle) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(subtitle, 14, 24);
    }
  }
}

function addFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.gray);
    doc.text(
      `CALZADO J&R — Reporte generado el ${formatDate(new Date().toISOString())} — Página ${i} de ${pageCount}`,
      14,
      290,
    );
  }
}

const STATUS_LABELS: Record<string, string> = {
  pendiente: 'Pendiente',
  en_progreso: 'En Progreso',
  completado: 'Completado',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

export async function exportMyOrdersPDF(
  data: ClientAllOrdersReport,
  startDate?: string,
  endDate?: string,
): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const reportTitle = 'Mis Pedidos — Reporte';
  const subtitle = startDate && endDate
    ? `Período: ${formatDate(startDate)} — ${formatDate(endDate)}`
    : undefined;

  const logo = await loadLogoBase64();
  addHeader(doc, reportTitle, subtitle, logo);

  const summaryY = 56;
  doc.setDrawColor(...COLORS.primary);
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(10, summaryY, 190, 16, 2, 2, 'FD');

  function sl(text: string, x: number, y: number) {
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text(text, x, y);
  }
  function sv(text: string, x: number, y: number, color: [number, number, number]) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...color);
    doc.text(text, x, y);
  }

  sl('TOTAL PEDIDOS', 16, summaryY + 5);
  sv(String(data.total_orders), 16, summaryY + 13, [60, 60, 60]);

  sl('TOTAL PARES', 96, summaryY + 5);
  sv(String(data.total_pairs), 96, summaryY + 13, COLORS.green);

  const tableStartY = summaryY + 21;

  if (data.orders?.length) {
    const allRows: (string | number)[][] = [];
    const rowGroups: number[] = [];

    for (let g = 0; g < data.orders.length; g++) {
      const order = data.orders[g];
      if (!order?.items?.length) continue;
      for (let i = 0; i < order.items.length; i++) {
        const item = order.items[i];
        if (!item) continue;
        allRows.push([
          i === 0 ? (order.id?.substring(0, 8) || '—') : '',
          i === 0 ? formatDate(order.created_at) : '',
          item.product_name || '—',
          item.category_name || '—',
          item.colour || '—',
          String(item.amount),
          i === 0 ? (STATUS_LABELS[order.state] || order.state || '').toUpperCase() : '',
        ]);
        rowGroups.push(g);
      }
    }

    autoTable(doc, {
      startY: tableStartY,
      head: [['ID Pedido', 'Fecha', 'Producto', 'Categoría', 'Color', 'Cant.', 'Estado']],
      body: allRows,
      theme: 'grid',
      headStyles: { fillColor: COLORS.primary, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 7 },
      margin: { left: 10, right: 10 },
      didParseCell(cellData) {
        if (cellData.section === 'body') {
          const groupIdx = rowGroups[cellData.row.index];
          if (groupIdx !== undefined) {
            cellData.cell.styles.fillColor = groupIdx % 2 === 0 ? [255, 255, 255] : [245, 247, 250];
          }
        }
      },
    });
  } else {
    doc.setTextColor(...COLORS.gray);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('No hay pedidos registrados en este período.', 14, tableStartY);
  }

  addFooter(doc);
  doc.save(`${sanitizeFilename(reportTitle)}.pdf`);
}
