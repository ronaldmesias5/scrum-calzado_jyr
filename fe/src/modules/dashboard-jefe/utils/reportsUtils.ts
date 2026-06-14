import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { EmployeeReportResponse, CustomerReportResponse, OrderSummary, TaskDetail, DashboardReportResponse } from '../services/reportsApi';

const PROCESS_DISPLAY: Record<string, string> = {
  cortador: 'Corte',
  guarnecedor: 'Guarnición',
  solador: 'Soladura',
  emplantillador: 'Emplantillado',
};

function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .trim();
}

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

function formatDateTime(iso?: string): string {
  return new Date(iso ?? new Date().toISOString()).toLocaleString('es-CO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

/** Carga el logo desde la carpeta public y lo redimensiona a 35x35px vía Canvas */
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

function addHeader(doc: jsPDF, title: string, subtitle?: string, logoBase64?: string | null, occupation?: string, generatedAt?: string) {
  const genStr = `Generado: ${generatedAt ?? formatDateTime()}`;
  if (logoBase64) {
    // ── Cabecera corporativa con logo, marca y cargo ──────────────────────
    doc.setFillColor(...COLORS.primary);
    doc.rect(0, 0, 210, 54, 'F');
    doc.setTextColor(255, 255, 255);

    // Fecha de generación (esquina superior derecha)
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.text(genStr, 196, 9, { align: 'right' });

    // Logo redimensionado
    doc.addImage(logoBase64, 'PNG', 14, 4, 18, 18);

    // Marca
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('CALZADO J&R', 37, 14);

    // Eslogan
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('Fábrica de Calzado', 37, 19);

    // Línea separadora
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.3);
    doc.line(14, 27, 196, 27);

    // Título del reporte
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 14, 38);

    // Subtítulo + cargo
    const parts: string[] = [];
    if (occupation) parts.push(`Cargo: ${occupation}`);
    if (subtitle) parts.push(subtitle);
    if (parts.length > 0) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(parts.join('  │  '), 14, 46);
    }
  } else {
    // ── Cabecera simple (customer / production PDFs) ──────────────────────
    doc.setFillColor(...COLORS.primary);
    doc.rect(0, 0, 210, 32, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 14, 16);
    // Fecha de generación
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

// ─── Employee PDF ─────────────────────────────────────────────────────────────

export async function exportEmployeePDF(
  data: EmployeeReportResponse,
  title?: string,
  startDate?: string,
  endDate?: string,
  returnBase64?: boolean,
): Promise<string | void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const reportTitle = title || `Reporte de Empleado: ${data.name}`;

  // Compute date range from actual task dates (completed_at → earliest → latest)
  const tasks = data.tasks_list || [];
  const tasksWithDates = tasks.filter(t => t.completed_at || t.created_at);
  let dateRangeStr: string | undefined;
  if (tasksWithDates.length > 0) {
    const timestamps = tasksWithDates.map(t => new Date(t.completed_at || t.created_at).getTime());
    dateRangeStr = `Período: ${formatDate(new Date(Math.min(...timestamps)).toISOString())} — ${formatDate(new Date(Math.max(...timestamps)).toISOString())}`;
  } else if (startDate && endDate) {
    dateRangeStr = `Período: ${formatDate(startDate)} — ${formatDate(endDate)}`;
  }

  const logo = await loadLogoBase64();
  addHeader(doc, reportTitle, dateRangeStr, logo, data.occupation, formatDateTime());

  // ── Resumen ────────────────────────────────────────────────────────────
  const summaryY = 56;
  const grandTotal = tasks.reduce((sum, t) => sum + (t.task_total_price || 0), 0);

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
  summaryValue(formatCurrency(grandTotal), 146, summaryY + 13, COLORS.accent);

  const tableStartY = summaryY + 21;

  // Single table: each task is one row, sorted by vale_number ascending
  if (tasks.length > 0) {
    const sortedTasks = [...tasks].sort((a, b) => (a.vale_number ?? Infinity) - (b.vale_number ?? Infinity));
    autoTable(doc, {
      startY: tableStartY,
      head: [['Nº Vale', 'Producto', 'Color', 'Cant.', 'Estado', 'Fecha Completado', 'Valor x Par', 'Total']],
      body: sortedTasks.map(t => [
        t.vale_number != null ? `#${t.vale_number}` : '—',
        t.product_name || '—',
        t.colour || '—',
        String(t.amount),
        t.status === 'pagado' ? 'Pagado' : t.status === 'completado' ? 'Completado' : t.status || '—',
        t.completed_at ? formatDate(t.completed_at) : (t.created_at ? formatDate(t.created_at) : '—'),
        t.price_per_dozen ? formatCurrency(t.price_per_dozen / 12) : '—',
        t.task_total_price ? formatCurrency(t.task_total_price) : '$0',
      ]),
      foot: [['', '', '', '', '', '', 'TOTAL', formatCurrency(grandTotal)]],
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
  if (returnBase64) {
    return doc.output('datauristring');
  }
  doc.save(`${sanitizeFilename(reportTitle)}.pdf`);
}

// ─── Customer PDF ─────────────────────────────────────────────────────────────

export async function exportCustomerPDF(
  data: CustomerReportResponse,
  title?: string,
  startDate?: string,
  endDate?: string,
  returnBase64?: boolean,
): Promise<string | void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const reportTitle = title || `Reporte de Cliente: ${data.name}`;
  const subtitle = startDate && endDate
    ? `Período: ${formatDate(startDate)} — ${formatDate(endDate)}`
    : undefined;

  const logo = await loadLogoBase64();
  addHeader(doc, reportTitle, subtitle, logo, undefined, formatDateTime());

  // ── Resumen ────────────────────────────────────────────────────────────
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

  summaryLabel('TOTAL PEDIDOS', 16, summaryY + 5);
  summaryValue(String(data.total_orders), 16, summaryY + 13, [60, 60, 60]);

  summaryLabel('TOTAL PARES', 76, summaryY + 5);
  summaryValue(String(data.total_pairs), 76, summaryY + 13, COLORS.green);

  // ── Tabla agrupada por pedido ──────────────────────────────────────────
  const tableStartY = summaryY + 21;

  if (data.orders?.length) {
    // Construir filas: ID/Fecha/Estado solo en la primera fila de cada pedido
    const allRows: (string | number)[][] = [];
    const rowGroups: number[] = []; // índice del grupo (pedido) al que pertenece cada fila

    for (let g = 0; g < data.orders.length; g++) {
      const order = data.orders[g];
      if (!order?.items?.length) continue;
      for (let i = 0; i < order.items.length; i++) {
        const item = order.items[i];

        allRows.push([
          i === 0 ? (order.id?.substring(0, 8) || '—') : '',
          i === 0 ? formatDate(order.created_at) : '',
          item!.product_name || '—',
          item!.category_name || '—',
          item!.colour || '—',
          String(item!.amount),
          i === 0 ? (order.state || '').toUpperCase() : '',
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
          // Alternar color de fondo por grupo de pedido
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
  if (returnBase64) {
    return doc.output('datauristring');
  }
  doc.save(`${sanitizeFilename(reportTitle)}.pdf`);
}

// ── Orders PDF (Reporte General de Pedidos) ──────────────────────────────────

export async function exportOrdersPDF(
  orders: OrderSummary[],
  totalOrders: number,
  totalPairs: number,
  startDate?: string,
  endDate?: string,
  returnBase64?: boolean,
): Promise<string | void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const subtitle = startDate && endDate
    ? `Período: ${formatDate(startDate)} — ${formatDate(endDate)}`
    : undefined;

  const logo = await loadLogoBase64();
  addHeader(doc, 'Reporte General de Pedidos', subtitle, logo, undefined, formatDateTime());

  // ── Resumen ────────────────────────────────────────────────────────────
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
  sv(String(totalOrders), 16, summaryY + 13, [60, 60, 60]);

  sl('TOTAL PARES', 96, summaryY + 5);
  sv(String(totalPairs), 96, summaryY + 13, COLORS.green);

  // ── Tabla agrupada por pedido ──────────────────────────────────────────
  const tableStartY = summaryY + 21;

  if (orders.length) {
    const allRows: (string | number)[][] = [];
    const rowGroups: number[] = [];

    for (let g = 0; g < orders.length; g++) {
      const order = orders[g];
      if (!order?.items?.length) continue;
      for (let i = 0; i < order.items.length; i++) {
        const item = order.items[i];
        allRows.push([
          i === 0 ? (order.id?.substring(0, 8) || '—') : '',
          i === 0 ? formatDate(order.created_at) : '',
          item!.product_name || '—',
          item!.category_name || '—',
          item!.colour || '—',
          String(item!.amount),
          i === 0 ? (order.state || '').toUpperCase() : '',
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
  if (returnBase64) {
    return doc.output('datauristring');
  }
  doc.save('Reporte_General_Pedidos.pdf');
}

// ─── Tasks PDF (Reporte General de Tareas) ────────────────────────────────────

export async function exportTasksPDF(
  tasks: TaskDetail[],
  totalTasks: number,
  totalPairs: number,
  startDate?: string,
  endDate?: string,
  returnBase64?: boolean,
): Promise<string | void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const subtitle = startDate && endDate
    ? `Período: ${formatDate(startDate)} — ${formatDate(endDate)}`
    : undefined;

  const logo = await loadLogoBase64();
  addHeader(doc, 'Reporte General de Tareas', subtitle, logo, undefined, formatDateTime());

  // ── Resumen ────────────────────────────────────────────────────────────
  const summaryY = 56;
  const grandTotal = tasks.reduce((sum, t) => sum + (t.task_total_price || 0), 0);

  // Compute breakdown by process (tareas + pares + dinero) from actual data values
  const processStats: Record<string, { tasks: number; pairs: number; total: number }> = {};
  tasks.forEach(t => {
    const key = t.process_name || 'otro';
    if (!processStats[key]) processStats[key] = { tasks: 0, pairs: 0, total: 0 };
    processStats[key].tasks++;
    processStats[key].pairs += t.amount || 0;
    processStats[key].total += t.task_total_price || 0;
  });
  const breakdownItems = Object.entries(processStats).map(([key, stats]) => ({
    displayName: PROCESS_DISPLAY[key] || key.charAt(0).toUpperCase() + key.slice(1),
    tasks: stats.tasks,
    pairs: stats.pairs,
    total: stats.total,
  }));

  // Bigger summary box to fit breakdown
  doc.setDrawColor(...COLORS.primary);
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(10, summaryY, 190, 30, 2, 2, 'FD');

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

  // Row 1: labels
  sl('TOTAL TAREAS', 16, summaryY + 5);
  sl('TOTAL PARES', 86, summaryY + 5);
  sl('TOTAL DINERO', 146, summaryY + 5);

  // Row 2: values
  sv(String(totalTasks), 16, summaryY + 13, [60, 60, 60]);
  sv(String(totalPairs), 86, summaryY + 13, COLORS.green);
  sv(formatCurrency(grandTotal), 146, summaryY + 13, COLORS.accent);

  // Row 3: breakdown by process (tareas + pares por cargo)
  if (breakdownItems.length > 0) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    let bx = 16;
    const bgap = 190 / breakdownItems.length;
    breakdownItems.forEach(item => {
      doc.text(`${item.displayName}: ${item.tasks}t, ${item.pairs}p, ${formatCurrency(item.total)}`, bx, summaryY + 24);
      bx += bgap;
    });
  }

  // ── Tabla de tareas ────────────────────────────────────────────────────
  const tableStartY = summaryY + 35;
  const sortedTasks = [...tasks].sort((a, b) => (a.vale_number ?? Infinity) - (b.vale_number ?? Infinity));

  if (sortedTasks.length > 0) {
    autoTable(doc, {
      startY: tableStartY,
      head: [['N° Vale', 'Tipo', 'Producto', 'Color', 'Cant.', 'Estado', 'Valor x Par', 'Total']],
      body: sortedTasks.map(t => [
        t.vale_number != null ? `#${t.vale_number}` : '—',
        PROCESS_DISPLAY[t.process_name] || t.process_name || '—',
        t.product_name || '—',
        t.colour || '—',
        String(t.amount),
        t.status === 'pagado' ? 'Pagado' : t.status === 'completado' ? 'Completado' : t.status || '—',
        t.price_per_dozen ? formatCurrency(t.price_per_dozen / 12) : '—',
        t.task_total_price ? formatCurrency(t.task_total_price) : '$0',
      ]),
      foot: [['', '', '', '', '', '', 'TOTAL', formatCurrency(grandTotal)]],
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
  if (returnBase64) {
    return doc.output('datauristring');
  }
  doc.save('Reporte_General_Tareas.pdf');
}

// ── Dashboard PDF ──────────────────────────────────────────────────────────────

export async function exportDashboardPDF(
  data: DashboardReportResponse,
  days: number,
  returnBase64?: boolean,
): Promise<string | void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const subtitle = `Período: Últimos ${days} días`;

  const logo = await loadLogoBase64();
  addHeader(doc, 'Dashboard General', subtitle, logo, undefined, formatDateTime());

  // ── KPIs ───────────────────────────────────────────────────────────────
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
  sv(String(data.kpis.total_orders), 16, summaryY + 13, [60, 60, 60]);

  sl('PARES VENDIDOS', 76, summaryY + 5);
  sv(String(data.kpis.total_pairs_sold), 76, summaryY + 13, COLORS.green);

  sl('TAREAS COMPLETADAS', 136, summaryY + 5);
  sv(String(data.kpis.total_tasks_completed), 136, summaryY + 13, COLORS.accent);

  // ── Ventas por Categoría ────────────────────────────────────────────────
  let y = summaryY + 22;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.primary);
  doc.text('Ventas por Categoría', 14, y);
  y += 4;

  if (data.sales_by_category.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Categoría', 'Pares Vendidos', 'Porcentaje']],
      body: data.sales_by_category.map(c => [
        c.category_name,
        String(c.pairs_sold),
        `${c.percentage.toFixed(1)}%`,
      ]),
      theme: 'grid',
      headStyles: { fillColor: COLORS.primary, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 7 },
      margin: { left: 10, right: 10 },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  } else {
    doc.setTextColor(...COLORS.gray);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('No hay datos disponibles.', 14, y);
    y += 8;
  }

  // ── Top Productos ───────────────────────────────────────────────────────
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.primary);
  doc.text('Productos Más Vendidos', 14, y);
  y += 4;

  if (data.top_products.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Producto', 'Pares Vendidos']],
      body: data.top_products.map(p => [p.product_name, String(p.sales)]),
      theme: 'grid',
      headStyles: { fillColor: COLORS.primary, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 7 },
      margin: { left: 10, right: 10 },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  } else {
    doc.setTextColor(...COLORS.gray);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('No hay datos disponibles.', 14, y);
    y += 8;
  }

  // ── Top Empleados ───────────────────────────────────────────────────────
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.primary);
  doc.text('Mejores Empleados por Cargo', 14, y);
  y += 4;

  if (data.top_employees.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Nombre', 'Cargo', 'Tareas Completadas']],
      body: data.top_employees.map(e => [e.name, e.occupation, String(e.completed_tasks)]),
      theme: 'grid',
      headStyles: { fillColor: COLORS.primary, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 7 },
      margin: { left: 10, right: 10 },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  } else {
    doc.setTextColor(...COLORS.gray);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('No hay datos disponibles.', 14, y);
    y += 8;
  }

  // ── Top Clientes ────────────────────────────────────────────────────────
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.primary);
  doc.text('Top Clientes', 14, y);
  y += 4;

  if (data.top_customers.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Nombre', 'Pedidos', 'Pares']],
      body: data.top_customers.map(c => [c.name, String(c.total_orders), String(c.total_pairs)]),
      theme: 'grid',
      headStyles: { fillColor: COLORS.primary, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 7 },
      margin: { left: 10, right: 10 },
    });
  } else {
    doc.setTextColor(...COLORS.gray);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('No hay datos disponibles.', 14, y);
  }

  addFooter(doc);
  if (returnBase64) {
    return doc.output('datauristring');
  }
  doc.save('Dashboard_General.pdf');
}

// ─── Production PDF ────────────────────────────────────────────────────────────

export async function exportProductionPDF(
  orders: OrderSummary[],
  tasks: TaskDetail[],
  startDate?: string,
  endDate?: string,
  returnBase64?: boolean,
): Promise<string | void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const subtitle = startDate && endDate
    ? `Período: ${formatDate(startDate)} — ${formatDate(endDate)}`
    : undefined;

  const logo = await loadLogoBase64();
  addHeader(doc, 'Reporte de Producción y Ventas', subtitle, logo, undefined, formatDateTime());

  // ── Resumen Pedidos ─────────────────────────────────────────────────────
  const totalOrders = orders.length;
  const totalPairsOrders = orders.reduce((sum, o) => sum + (o.total_pairs || 0), 0);
  const totalPairsTasks = tasks.reduce((sum, t) => sum + (t.amount || 0), 0);
  const grandTotal = tasks.reduce((sum, t) => sum + (t.task_total_price || 0), 0);

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
  sv(String(totalOrders), 16, summaryY + 13, [60, 60, 60]);

  sl('PARES PEDIDOS', 76, summaryY + 5);
  sv(String(totalPairsOrders), 76, summaryY + 13, COLORS.green);

  sl('PARES PRODUCIDOS', 136, summaryY + 5);
  sv(String(totalPairsTasks), 136, summaryY + 13, COLORS.accent);

  // ── Tabla de Pedidos ────────────────────────────────────────────────────
  let y = summaryY + 22;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.primary);
  doc.text('Pedidos', 14, y);
  y += 4;

  if (orders.length > 0) {
    const allRows: (string | number)[][] = [];
    const rowGroups: number[] = [];
    for (let g = 0; g < orders.length; g++) {
      const order = orders[g];
      if (!order?.items?.length) continue;
      for (let i = 0; i < order.items.length; i++) {
        const item = order.items[i];
        allRows.push([
          i === 0 ? (order.id?.substring(0, 8) || '—') : '',
          i === 0 ? formatDate(order.created_at) : '',
          item!.product_name || '—',
          item!.category_name || '—',
          item!.colour || '—',
          String(item!.amount),
          i === 0 ? (order.state || '').toUpperCase() : '',
        ]);
        rowGroups.push(g);
      }
    }
    autoTable(doc, {
      startY: y,
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
    y = (doc as any).lastAutoTable.finalY + 8;
  } else {
    doc.setTextColor(...COLORS.gray);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('No hay pedidos en este período.', 14, y);
    y += 8;
  }

  // ── Tabla de Tareas ─────────────────────────────────────────────────────
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.primary);
  doc.text('Tareas de Producción', 14, y);
  y += 4;

  if (tasks.length > 0) {
    const sortedTasks = [...tasks].sort((a, b) => (a.vale_number ?? Infinity) - (b.vale_number ?? Infinity));
    autoTable(doc, {
      startY: y,
      head: [['N° Vale', 'Tipo', 'Producto', 'Color', 'Cant.', 'Estado', 'Valor x Par', 'Total']],
      body: sortedTasks.map(t => [
        t.vale_number != null ? `#${t.vale_number}` : '—',
        PROCESS_DISPLAY[t.process_name] || t.process_name || '—',
        t.product_name || '—',
        t.colour || '—',
        String(t.amount),
        t.status === 'pagado' ? 'Pagado' : t.status === 'completado' ? 'Completado' : t.status || '—',
        t.price_per_dozen ? formatCurrency(t.price_per_dozen / 12) : '—',
        t.task_total_price ? formatCurrency(t.task_total_price) : '$0',
      ]),
      foot: [['', '', '', '', '', '', 'TOTAL', formatCurrency(grandTotal)]],
      theme: 'grid',
      headStyles: { fillColor: COLORS.primary, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      footStyles: { fillColor: COLORS.lightGray, textColor: [...COLORS.primary], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 7 },
      margin: { left: 10, right: 10 },
    });
  } else {
    doc.setTextColor(...COLORS.gray);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('No hay tareas en este período.', 14, y);
  }

  addFooter(doc);
  if (returnBase64) {
    return doc.output('datauristring');
  }
  doc.save('Reporte_Produccion_Ventas.pdf');
}
