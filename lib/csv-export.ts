interface ExportCSVOptions {
  filename: string;
  headers: string[];
  rows: (string | number | boolean | null | undefined)[][];
}

export function exportToCSV({ filename, headers, rows }: ExportCSVOptions): void {
  if (typeof window === 'undefined') return;

  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row
        .map((val) => {
          let stringVal = val === null || val === undefined ? '' : String(val);
          // CSV Injection prevention: prepend tab character for formula-like values
          // This is the OWASP-recommended approach to prevent cell formula execution
          if (/^[=+\-@\t\r]/.test(stringVal) || /\n/.test(stringVal)) {
            stringVal = '\t' + stringVal;
            stringVal = stringVal.replace(/"/g, '""');
            return `"${stringVal}"`;
          }
          if (stringVal.includes(',') || stringVal.includes('"')) {
            stringVal = stringVal.replace(/"/g, '""');
            return `"${stringVal}"`;
          }
          return stringVal;
        })
        .join(',')
    )
  ].join('\n');

  const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 100);
}
