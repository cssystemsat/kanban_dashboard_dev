import { jsPDF } from "jspdf";
import type { ClientData } from "@/hooks/useKanbanData";
import type { ObjectiveCompletionMetric } from "@/lib/biMetrics";
import {
  calculateAverageTTV,
  groupAverageTTVByObjective,
  parseBoleto,
} from "@/lib/biMetrics";

type ReportClient = Pick<
  ClientData,
  "nome" | "tags" | "marco" | "ultimoBoleto" | "atendente"
>;

type ReportTTVClient = Pick<ClientData, "id" | "nome" | "entrada" | "tags">;

export type BIManagementReportInput = {
  unflaggedImplantation: ReportClient[];
  flaggedImplantation: ReportClient[];
  ttvClients: ReportTTVClient[];
  completions: ObjectiveCompletionMetric[];
  selectedObjectives?: string[];
  csmLabel?: string;
  searchLabel?: string;
};

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 10;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const DARK_BLUE = [0, 31, 63] as const;
const MUTED = [90, 105, 120] as const;
const BORDER = [218, 226, 234] as const;

function cleanText(value: string | undefined | null, fallback = "—") {
  const text = (value ?? "").replace(/[\r\n]+/g, " ").trim();
  return text || fallback;
}

function formatCurrency(value: string | undefined) {
  const parsed = parseBoleto(value);
  return parsed > 0
    ? parsed.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : "—";
}

function formatObjectiveTags(tags: string[] | undefined) {
  const objectives = (tags ?? []).map(tag => cleanText(tag, "")).filter(Boolean);
  return objectives.length ? objectives.join(", ") : "Não informado";
}

function drawPageHeader(doc: jsPDF, title: string, subtitle?: string) {
  doc.setFillColor(...DARK_BLUE);
  doc.rect(0, 0, PAGE_WIDTH, 25, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("SYSTEMSAT • GESTÃO DE CLIENTES", MARGIN, 10);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(title, MARGIN, 17);
  if (subtitle) doc.text(subtitle, PAGE_WIDTH - MARGIN, 17, { align: "right" });
  doc.setTextColor(25, 35, 45);
}

function drawFooter(doc: jsPDF) {
  const page = doc.getNumberOfPages();
  doc.setDrawColor(...BORDER);
  doc.line(MARGIN, PAGE_HEIGHT - 10, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 10);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text("Relatório gerado pelo BI • Dados conforme filtros aplicados", MARGIN, PAGE_HEIGHT - 5);
  doc.text(`Página ${page}`, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 5, { align: "right" });
}

function ensureSpace(doc: jsPDF, y: number, required: number, title: string) {
  if (y + required <= PAGE_HEIGHT - 15) return y;
  drawFooter(doc);
  doc.addPage();
  drawPageHeader(doc, title);
  return 34;
}

function drawSectionTitle(doc: jsPDF, y: number, title: string, count: number) {
  const nextY = ensureSpace(doc, y, 15, title);
  doc.setFillColor(239, 246, 255);
  doc.roundedRect(MARGIN, nextY, CONTENT_WIDTH, 9, 2, 2, "F");
  doc.setTextColor(...DARK_BLUE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(title, MARGIN + 4, nextY + 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text(`${count} cliente${count === 1 ? "" : "s"}`, PAGE_WIDTH - MARGIN - 4, nextY + 6, {
    align: "right",
  });
  return nextY + 13;
}

function drawClientTable(doc: jsPDF, startY: number, title: string, rows: ReportClient[]) {
  const columns = [
    { label: "Cliente", width: 45 },
    { label: "Objetivos", width: 61 },
    { label: "Marco atual", width: 22 },
    { label: "Boleto", width: 27 },
    { label: "CSM", width: 35 },
  ];
  let y = drawSectionTitle(doc, startY, title, rows.length);
  const headerHeight = 8;
  const drawTableHeader = (headerY: number) => {
    let x = MARGIN;
    doc.setFillColor(0, 31, 63);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    for (const column of columns) {
      doc.rect(x, headerY, column.width, headerHeight, "F");
      doc.text(column.label, x + 2, headerY + 5.3);
      x += column.width;
    }
    doc.setTextColor(25, 35, 45);
    doc.setFont("helvetica", "normal");
  };
  const drawRow = (row: ReportClient, rowY: number) => {
    const values = [
      cleanText(row.nome),
      formatObjectiveTags(row.tags),
      row.marco ? `Marco ${row.marco}` : "—",
      formatCurrency(row.ultimoBoleto),
      cleanText(row.atendente, "CSM não informado"),
    ];
    const wrapped = values.map((value, index) =>
      doc.splitTextToSize(value, columns[index].width - 4)
    );
    const rowHeight = Math.max(8, ...wrapped.map(lines => lines.length * 3.5 + 4));
    let x = MARGIN;
    doc.setDrawColor(...BORDER);
    doc.setFontSize(7.4);
    wrapped.forEach((lines, index) => {
      doc.rect(x, rowY, columns[index].width, rowHeight);
      doc.text(lines, x + 2, rowY + 4.5, { lineHeightFactor: 1.1 });
      x += columns[index].width;
    });
    return rowHeight;
  };

  if (rows.length === 0) {
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text("Nenhum cliente encontrado nos filtros atuais.", MARGIN + 2, y + 5);
    return y + 12;
  }

  drawTableHeader(y);
  y += headerHeight;
  for (const row of rows) {
    const estimated = 15;
    if (y + estimated > PAGE_HEIGHT - 17) {
      drawFooter(doc);
      doc.addPage();
      drawPageHeader(doc, title);
      y = 34;
      drawTableHeader(y);
      y += headerHeight;
    }
    y += drawRow(row, y);
  }
  return y + 8;
}

export function generateBIManagementReport(input: BIManagementReportInput) {
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const today = new Date().toLocaleDateString("pt-BR");
  const subtitle = `Gerado em ${today}`;
  drawPageHeader(doc, "Relatório gerencial do BI", subtitle);

  let y = 34;
  doc.setTextColor(...MUTED);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(
    `Filtros: CSM ${cleanText(input.csmLabel, "Todos")} • Cliente ${cleanText(input.searchLabel, "Todos")} • Objetivos ${cleanText(input.selectedObjectives?.join(", "), "Todos")}`,
    MARGIN,
    y
  );
  y += 8;

  y = drawClientTable(
    doc,
    y,
    "Clientes atrasados em implantação sem flag",
    input.unflaggedImplantation
  );
  y = drawClientTable(
    doc,
    y,
    "Clientes atrasados em implantação com flag",
    input.flaggedImplantation
  );

  const ttv = calculateAverageTTV(input.ttvClients, input.completions, input.selectedObjectives);
  const ttvByObjective = groupAverageTTVByObjective(
    input.ttvClients,
    input.completions,
    input.selectedObjectives
  );
  y = ensureSpace(doc, y, 55, "TTV médio");
  doc.setFillColor(236, 253, 245);
  doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 14, 2, 2, "F");
  doc.setTextColor(6, 95, 70);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("TTV médio geral", MARGIN + 4, y + 6);
  doc.setFontSize(14);
  doc.text(ttv.averageDays === null ? "Sem dados" : `${ttv.averageDays.toFixed(1)} dias`, MARGIN + 4, y + 11.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text(`${ttv.entries.length} conclusão(ões) datada(s) considerada(s)`, PAGE_WIDTH - MARGIN - 4, y + 8, {
    align: "right",
  });
  y += 21;

  y = ensureSpace(doc, y, 15, "TTV médio por objetivo");
  doc.setTextColor(...DARK_BLUE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("TTV médio por objetivo", MARGIN, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  if (ttvByObjective.length === 0) {
    doc.setTextColor(...MUTED);
    doc.text("Nenhum objetivo com conclusão datada nos filtros atuais.", MARGIN, y + 5);
    y += 12;
  } else {
    for (const row of ttvByObjective) {
      y = ensureSpace(doc, y, 7, "TTV médio por objetivo");
      doc.setDrawColor(...BORDER);
      doc.line(MARGIN, y + 6, PAGE_WIDTH - MARGIN, y + 6);
      doc.setTextColor(45, 55, 65);
      doc.text(cleanText(row.objective), MARGIN, y + 4.5);
      doc.setTextColor(...DARK_BLUE);
      doc.setFont("helvetica", "bold");
      doc.text(row.dias === null ? "Sem conclusão" : `${row.dias.toFixed(1)} dias`, PAGE_WIDTH - MARGIN - 32, y + 4.5, {
        align: "right",
      });
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...MUTED);
      doc.text(`${row.conclusoes} conclusão(ões)`, PAGE_WIDTH - MARGIN, y + 4.5, { align: "right" });
      y += 7;
    }
  }

  drawFooter(doc);
  const filename = `relatorio-bi-gerencial-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
