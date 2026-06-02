import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { MyTasksReportResponse, MyTaskDetail } from '../services/employeeApi';

const PROCESS_DISPLAY: Record<string, string> = {
  corte: 'Corte',
  guarnicion: 'Guarnición',
  soladura: 'Soladura',
  emplantillado: 'Emplantillado',
};

const COLORS = {
  primary: [30, 64, 175] as [number, number, number],
  accent: [217, 119, 6] as [number, number, number],
  green: [22, 163, 74] as [number, number, number],
  gray: [107, 114, 128] as [number, number, number],
  lightGray: [243, 244, 246] as [number, number, number],
};

function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatCurrency(value: number): string {
  return `$${value.toLocaleString('es-CO')}`;
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

function addHeader(doc: jsPDF, title: string, subtitle?: string, logoBase64?: string | null, generatedAt?: string) {
  const genStr = `Generado: ${generatedAt ?? formatDateTime()}`;
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

    const parts: string[] = [];
    if (subtitle) parts.push(subtitle);
    if (parts.length > 0) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(parts.join('  │  '), 14, 46);
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

export async function exportMyTasksPDF(
  data: MyTasksReportResponse,
  tasks: MyTaskDetail[],
  title?: string,
  startDate?: string,
  endDate?: string,
): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const reportTitle = title || `Reporte de Tareas: ${data.name}`;

  const tasksWithDates = tasks.filter(t => t.completed_at || t.created_at);
  let dateRangeStr: string | undefined;
  if (tasksWithDates.length > 0) {
    const timestamps = tasksWithDates.map(t => new Date(t.completed_at || t.created_at).getTime());
    dateRangeStr = `Período: ${formatDate(new Date(Math.min(...timestamps)).toISOString())} — ${formatDate(new Date(Math.max(...timestamps)).toISOString())}`;
  } else if (startDate && endDate) {
    dateRangeStr = `Período: ${formatDate(startDate)} — ${formatDate(endDate)}`;
  }

  const logo = await loadLogoBase64();
  addHeader(doc, reportTitle, dateRangeStr, logo, formatDateTime());

  const summaryY = 56;
  doc.setDrawColor(...COLORS.primary);
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(10, summaryY, 190, 16, 2, 2, 'FD');

  function summaryLabel(text: string, x: number, y: number) {
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text(text, x, y);
  }
  function summaryValue(text: string, x: number, y: number, color: [number, number, number]) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...color);
    doc.text(text, x, y);
  }

  summaryLabel('TOTAL TAREAS', 16, summaryY + 5);
  summaryValue(String(data.total_tasks_completed), 16, summaryY + 13, [60, 60, 60]);

  summaryLabel('TOTAL PARES', 86, summaryY + 5);
  summaryValue(String(data.total_pairs_produced), 86, summaryY + 13, COLORS.green);

  summaryLabel('TOTAL DINERO', 146, summaryY + 5);
  summaryValue(formatCurrency(data.total_earnings), 146, summaryY + 13, COLORS.accent);

  const tableStartY = summaryY + 21;

  if (tasks.length > 0) {
    const sortedTasks = [...tasks].sort((a, b) => (a.vale_number ?? Infinity) - (b.vale_number ?? Infinity));
    autoTable(doc, {
      startY: tableStartY,
      head: [['Nº Vale', 'Proceso', 'Producto', 'Color', 'Cant.', 'Estado', 'Fecha', 'Valor x Par', 'Total']],
      body: sortedTasks.map(t => [
        t.vale_number != null ? `#${t.vale_number}` : '—',
        PROCESS_DISPLAY[t.process_name] || t.process_name || '—',
        t.product_name || '—',
        t.colour || '—',
        String(t.amount),
        t.status === 'pagado' ? 'Pagado' : 'Completado',
        t.completed_at ? formatDate(t.completed_at) : '—',
        t.price_per_dozen ? formatCurrency(t.price_per_dozen / 12) : '—',
        t.task_total_price ? formatCurrency(t.task_total_price) : '$0',
      ]),
      foot: [['', '', '', '', '', '', '', 'TOTAL', formatCurrency(data.total_earnings)]],
      theme: 'grid',
      headStyles: { fillColor: COLORS.primary, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      footStyles: { fillColor: COLORS.lightGray, textColor: [...COLORS.primary], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 7 },
      margin: { left: 10, right: 10 },
    });
  } else {
    doc.setTextColor(...COLORS.gray);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('No hay tareas registradas en este período.', 14, tableStartY);
  }

  addFooter(doc);
  doc.save(`${reportTitle.replace(/\s+/g, '_')}.pdf`);
}
