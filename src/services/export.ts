// Shared client-side export helpers (CSV / PDF)

function escapeCSVValue(value: string | number): string {
  const str = String(value ?? '');
  // Wrap in quotes and escape embedded quotes if the value contains special chars
  if (/[",\n\r]/.test(str)) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

/**
 * Generates and triggers a CSV file download in the browser.
 * Uses UTF-8 BOM so Excel renders accented/special characters correctly.
 */
export const downloadCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
  const csvLines = [
    headers.map(escapeCSVValue).join(','),
    ...rows.map((row) => row.map(escapeCSVValue).join(','))
  ];
  const blob = new Blob(['\uFEFF' + csvLines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
