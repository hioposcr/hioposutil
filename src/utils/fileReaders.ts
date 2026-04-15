import type { FileType } from '../types';

const FILE_EXTENSIONS: Record<FileType, string[]> = {
  xml: ['.xml'],
  json: ['.json'],
  note: ['.json', '.xml'],
};

export async function readFileAsText(file: File): Promise<string> {
  return file.text();
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 KB';
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }

  return `${(kb / 1024).toFixed(1)} MB`;
}

export function validateFileType(file: File, type: FileType): string | null {
  const extensions = FILE_EXTENSIONS[type];
  const normalizedName = file.name.toLowerCase();
  const isValid = extensions.some((extension) => normalizedName.endsWith(extension));

  if (isValid) {
    return null;
  }

  return `El archivo debe tener una de estas extensiones: ${extensions.join(', ')}.`;
}
