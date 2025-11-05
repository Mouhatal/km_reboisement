import * as XLSX from 'xlsx';

interface SheetData {
  name: string;
  headers: string[];
  rows: (string | number | boolean)[][];
}

interface SummaryData {
  title: string;
  data: { label: string; value: string | number }[];
}

export function exportToExcel(
  fileName: string,
  sheets: SheetData[],
  summary?: SummaryData
) {
  const wb = XLSX.utils.book_new();

  if (summary) {
    const summaryRows = [[summary.title]];
    summary.data.forEach(item => {
      summaryRows.push([item.label, item.value]);
    });
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Résumé');
  }

  sheets.forEach(sheet => {
    const data = [sheet.headers, ...sheet.rows];
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, sheet.name);
  });

  XLSX.writeFile(wb, `${fileName}.xlsx`);
}