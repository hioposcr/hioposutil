import type { CorrectionResult } from '../types';

function downloadTextFile(content: string, fileName: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = fileName;
  anchor.click();

  URL.revokeObjectURL(url);
}

export function exportCorrectionFiles(result: CorrectionResult): void {
  downloadTextFile(
    result.correctedJsonText,
    `${result.fileBaseName}.json`,
    'application/json;charset=utf-8'
  );
  downloadTextFile(
    result.correctedXmlText,
    `${result.fileBaseName}.xml`,
    'application/xml;charset=utf-8'
  );
}

export function exportJsonOnly(result: CorrectionResult): void {
  downloadTextFile(
    result.correctedJsonText,
    `${result.fileBaseName}.json`,
    'application/json;charset=utf-8'
  );
}

export function exportXmlOnly(result: CorrectionResult): void {
  downloadTextFile(
    result.correctedXmlText,
    `${result.fileBaseName}.xml`,
    'application/xml;charset=utf-8'
  );
}
