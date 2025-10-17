import React, { useState, useCallback } from 'react';
import { UploadCloud, FileText } from 'lucide-react';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  fileName: string | null;
  isLoading: boolean;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileSelect, fileName, isLoading }) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoading) {
      setIsDragOver(true);
    }
  }, [isLoading]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0 && !isLoading) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  }, [isLoading, onFileSelect]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && !isLoading) {
      onFileSelect(e.target.files[0]);
    }
  };

  const borderStyle = isDragOver ? 'border-blue-500 bg-blue-50' : 'border-slate-300';
  const disabledClass = isLoading ? 'opacity-50 cursor-not-allowed' : '';

  // After a file is successfully loaded, show a compact version.
  if (fileName && !isLoading) {
    return (
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md transition-all duration-300">
        <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center bg-slate-100 px-4 py-2 rounded-lg text-sm w-full sm:w-auto overflow-hidden">
            <FileText className="w-5 h-5 text-slate-500 mr-2 flex-shrink-0" />
            <span className="font-medium text-slate-700 truncate" title={fileName}>{fileName}</span>
          </div>
          <label
            htmlFor="file-input-replace"
            className="w-full sm:w-auto flex-shrink-0 text-center px-4 py-2 text-sm font-semibold text-blue-600 bg-white border border-blue-600 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors"
          >
            ファイルを変更
            <input
              type="file"
              id="file-input-replace"
              className="hidden"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileChange}
              disabled={isLoading}
            />
          </label>
        </div>
      </div>
    );
  }

  // Default view for uploading or when loading
  return (
    <div className={`max-w-4xl mx-auto bg-white rounded-lg p-6 shadow-md ${disabledClass} transition-all duration-300`}>
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center w-full p-8 border-2 border-dashed ${borderStyle} rounded-xl transition-colors duration-300`}
      >
        <UploadCloud className="w-12 h-12 text-slate-400 mb-4" />
        <input
          type="file"
          id="file-input"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          accept=".xlsx, .xls, .csv"
          onChange={handleFileChange}
          disabled={isLoading}
        />
        <label htmlFor="file-input" className="text-center">
            <span className="font-semibold text-blue-600 cursor-pointer hover:underline">クリックしてアップロード</span>
            <span className="text-slate-500"> またはドラッグ＆ドロップ</span>
        </label>
        <p className="text-xs text-slate-400 mt-2">Excel (.xlsx, .xls) または CSV ファイル <span className="block sm:inline">※Excel解析にはオンラインでXLSXライブラリの読み込みが必要です</span></p>

        {fileName && (
            <div className="mt-4 flex items-center bg-slate-100 px-4 py-2 rounded-lg text-sm">
                <FileText className="w-5 h-5 text-slate-500 mr-2" />
                <span className="font-medium text-slate-700 truncate">{fileName}</span>
            </div>
        )}
      </div>
    </div>
  );
};

export default FileUploader;