import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { EmployeeReportResponse, CustomerReportResponse, ProductionGlobalReport } from '../services/reportsApi';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const COLORS = {
  primary: [30, 64, 175] as [number, number, number],       // #1e40af
  dark: [30, 58, 138] as [number, number, number],           // #1e3a8a
  accent: [217, 119, 6] as [number, number, number],         // #d97706
  green: [22, 163, 74] as [number, number, number],          // #16a34a
  red: [220, 38, 38] as [number, number, number],            // #dc2626
  gray: [107, 114, 128] as [number, number, number],         // #6b7280
  lightGray: [243, 244, 246] as [number, number, number],    // #f3f4f6
};

function formatDate(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatCurrency(value: number): string {
  return `$${value.toLocaleString('es-CO')}`;
}

function addHeader(doc: jsPDF, title: string, subtitle?: string) {
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, 210, 32, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 16);
  if (subtitle) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(subtitle, 14, 24);
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

// ─── Employee PDF ─────────────────────────────────────────────────────────────

export function exportEmployeePDF(
  data: EmployeeReportResponse,
  title?: string,
  startDate?: string,
  endDate?: string,
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const reportTitle = title || `Reporte de Empleado: ${data.name}`;
  const subtitle = startDate && endDate
    ? `Período: ${formatDate(startDate)} — ${formatDate(endDate)}`
    : undefined;

  addHeader(doc, reportTitle, subtitle);

  // Summary section
  let y = 40;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumen', 14, y);
  y += 7;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Tareas completadas: ${data.total_tasks_completed}`, 14, y);
  y += 5;
  doc.text(`Pares producidos: ${data.total_pairs_produced}`, 14, y);
  y += 5;
  if (data.total_earnings && data.total_earnings > 0) {
    doc.setTextColor(...COLORS.green);
    doc.setFont('helvetica', 'bold');
    doc.text(`Ganancias totales: ${formatCurrency(data.total_earnings)}`, 14, y);
    doc.setTextColor(0, 0, 0);
    y += 5;
  }

  // Breakdown table
  if (data.tasks_breakdown?.length) {
    y += 3;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Desglose por Etapa', 14, y);
    y += 5;

    autoTable(doc, {
      startY: y,
      head: [['Etapa', 'Cantidad']],
      body: data.tasks_breakdown.map(b => [b.process_name.toUpperCase(), String(b.count)]),
      theme: 'grid',
      headStyles: { fillColor: COLORS.primary, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      margin: { left: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 6;
  }

  // Tasks detail table
  if (data.tasks_list?.length) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Detalle de Tareas', 14, y);
    y += 5;

    autoTable(doc, {
      startY: y,
      head: [['Vale #', 'Producto', 'Etapa', 'Pares', 'Precio/Doc', 'Total', 'Estado']],
      body: data.tasks_list.map(t => [
        t.vale_number != null ? `#${t.vale_number}` : '—',
        t.product_name || '—',
        t.process_name?.toUpperCase() || '—',
        String(t.amount),
        t.price_per_dozen ? formatCurrency(t.price_per_dozen) : '—',
        t.task_total_price ? formatCurrency(t.task_total_price) : '—',
        t.status?.toUpperCase() || '—',
      ]),
      theme: 'grid',
      headStyles: { fillColor: COLORS.dark, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 7 },
      margin: { left: 14 },
    });
  }

  addFooter(doc);
  doc.save(`${reportTitle.replace(/\s+/g, '_')}.pdf`);
}

// ─── Customer PDF ─────────────────────────────────────────────────────────────

export function exportCustomerPDF(
  data: CustomerReportResponse,
  title?: string,
  startDate?: string,
  endDate?: string,
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const reportTitle = title || `Reporte de Cliente: ${data.name}`;
  const subtitle = startDate && endDate
    ? `Período: ${formatDate(startDate)} — ${formatDate(endDate)}`
    : undefined;

  addHeader(doc, reportTitle, subtitle);

  let y = 40;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumen', 14, y);
  y += 7;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total de pedidos: ${data.total_orders}`, 14, y);
  y += 5;
  doc.text(`Total de pares: ${data.total_pairs}`, 14, y);
  y += 5;
  doc.setTextColor(...COLORS.green);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total gastado: ${formatCurrency(data.total_spent)}`, 14, y);
  doc.setTextColor(0, 0, 0);
  y += 8;

  // Orders table
  if (data.orders?.length) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Historial de Pedidos', 14, y);
    y += 5;

    autoTable(doc, {
      startY: y,
      head: [['Pedido', 'Fecha', 'Pares', 'Total', 'Estado']],
      body: data.orders.map(o => [
        o.id?.substring(0, 8) || '—',
        formatDate(o.created_at),
        String(o.total_pairs),
        formatCurrency(o.total_price),
        o.state?.toUpperCase() || '—',
      ]),
      theme: 'grid',
      headStyles: { fillColor: COLORS.primary, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      margin: { left: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 6;
  }

  // Products detail per order
  if (data.orders?.some(o => o.items?.length)) {
    for (const order of data.orders) {
      if (!order.items?.length) continue;
      if (y > 240) { doc.addPage(); y = 20; }

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(`Pedido #${order.id?.substring(0, 8)} — Productos`, 14, y);
      y += 5;

      autoTable(doc, {
        startY: y,
        head: [['Producto', 'Cantidad']],
        body: order.items.map(item => [item.product_name || '—', String(item.amount)]),
        theme: 'grid',
        headStyles: { fillColor: COLORS.dark, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fontSize: 7 },
        margin: { left: 14 },
      });
      y = (doc as any).lastAutoTable.finalY + 6;
    }
  }

  addFooter(doc);
  doc.save(`${reportTitle.replace(/\s+/g, '_')}.pdf`);
}

// ─── Production PDF ────────────────────────────────────────────────────────────

export function exportProductionPDF(
  data: ProductionGlobalReport,
  startDate?: string,
  endDate?: string,
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const subtitle = startDate && endDate
    ? `Período: ${formatDate(startDate)} — ${formatDate(endDate)}`
    : undefined;

  addHeader(doc, 'Reporte de Producción Global', subtitle);

  let y = 40;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumen', 14, y);
  y += 7;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Tareas completadas: ${data.total_tasks_period || 0}`, 14, y);
  y += 5;
  doc.text(`Pares fabricados: ${data.total_pairs_period || 0}`, 14, y);
  y += 5;
  doc.text(`Pedidos con producción: ${data.total_orders_period || 0}`, 14, y);
  y += 8;

  // Weekly metrics
  if (data.weekly_metrics?.length) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Métricas Semanales', 14, y);
    y += 5;

    autoTable(doc, {
      startY: y,
      head: [['Semana', 'Tareas', 'Pares']],
      body: data.weekly_metrics.map(w => [w.week, String(w.tasks_completed || 0), String(w.pairs_manufactured || 0)]),
      theme: 'grid',
      headStyles: { fillColor: COLORS.dark, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      margin: { left: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 6;
  }

  // Orders detail
  if (data.orders?.length) {
    if (y > 220) { doc.addPage(); y = 20; }
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Pedidos con Producción', 14, y);
    y += 5;

    autoTable(doc, {
      startY: y,
      head: [['Pedido', 'Fecha', 'Pares', 'Total', 'Estado']],
      body: data.orders.map(o => [
        o.id?.substring(0, 8) || '—',
        formatDate(o.created_at),
        String(o.total_pairs),
        formatCurrency(o.total_price),
        o.state?.toUpperCase() || '—',
      ]),
      theme: 'grid',
      headStyles: { fillColor: COLORS.primary, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      margin: { left: 14 },
    });
  }

  addFooter(doc);
  doc.save('Reporte_Produccion_Global.pdf');
}
