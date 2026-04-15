import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileCode, CheckCircle2, AlertCircle, X, RefreshCw } from 'lucide-react';
import type { FileType, UploadedFile } from '../types';

interface Props {
  label: string;
  description: string;
  accept: string;
  fileType: FileType;
  file: UploadedFile | null;
  onFileSelected: (file: File) => void;
  onClear: () => void;
}

export default function FileUploadZone({
  label,
  description,
  accept,
  fileType,
  file,
  onFileSelected,
  onClear,
}: Props) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) {
      onFileSelected(dropped);
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleClear = () => {
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    onClear();
  };

  const isLoading = file?.status === 'loading';

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => {
          const selected = event.target.files?.[0];
          if (selected) {
            onFileSelected(selected);
          }
        }}
      />
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="border-2 border-blue-200 border-dashed rounded-xl bg-blue-50/40 p-6 flex flex-col items-center gap-3"
          >
            <div className="w-9 h-9 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
              <p className="text-sm text-blue-600 font-medium">Procesando archivo…</p>
            </motion.div>
        ) : file ? (
          <motion.div
            key="loaded"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className={`border rounded-xl p-4 flex items-center gap-3 ${
              file.status === 'success'
                ? 'border-emerald-200 bg-emerald-50'
                : 'border-red-200 bg-red-50'
            }`}
          >
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                file.status === 'success' ? 'bg-emerald-100' : 'bg-red-100'
              }`}
            >
              {file.status === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm font-medium truncate ${
                  file.status === 'success' ? 'text-emerald-800' : 'text-red-700'
                }`}
              >
                {file.name}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{file.size}</p>
              {file.errorMessage && (
                <p className="text-xs text-red-600 mt-1">{file.errorMessage}</p>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleClick}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/70 transition-colors"
                title="Reemplazar"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleClear}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-white/70 transition-colors"
                title="Eliminar"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="empty"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            onClick={handleClick}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            whileHover={{ scale: 1.005 }}
            className={`w-full border-2 border-dashed rounded-xl p-6 flex flex-col items-center gap-3 transition-colors cursor-pointer text-center ${
              dragging
                ? 'border-blue-400 bg-blue-50'
                : 'border-slate-200 bg-slate-50/60 hover:border-blue-300 hover:bg-blue-50/40'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center">
              {fileType === 'xml' ? (
                <FileCode className="w-5 h-5 text-blue-500" />
              ) : (
                <FileCode className="w-5 h-5 text-amber-500" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">
                Arrastra el archivo aquí
              </p>
              <p className="text-xs text-slate-400 mt-0.5">{description}</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1 rounded-lg">
              <Upload className="w-3 h-3" />
              Seleccionar {accept.toUpperCase()}
            </div>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
