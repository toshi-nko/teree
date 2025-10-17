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

  const cardClass = `uploader-card${isLoading ? ' is-disabled' : ''}`;
  const dropzoneClass = [
    'uploader-dropzone',
    isDragOver ? 'is-active' : '',
    isLoading ? 'is-disabled' : '',
  ].filter(Boolean).join(' ');

  if (fileName && !isLoading) {
    return (
      <div className={`${cardClass} uploader-card--compact`}>
        <div className="uploader-summary">
          <div className="uploader-file-chip" title={fileName}>
            <FileText className="uploader-file-icon" />
            <span className="uploader-file-name">{fileName}</span>
          </div>
          <label htmlFor="file-input-replace" className="uploader-action-button">
            ファイルを変更
            <input
              type="file"
              id="file-input-replace"
              className="uploader-input"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileChange}
              disabled={isLoading}
            />
          </label>
        </div>
      </div>
    );
  }

  return (
    <div className={cardClass}>
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={dropzoneClass}
      >
        <UploadCloud className="uploader-icon" />
        <input
          type="file"
          id="file-input"
          className="uploader-input"
          accept=".xlsx, .xls, .csv"
          onChange={handleFileChange}
          disabled={isLoading}
        />
        <label htmlFor="file-input" className="uploader-label">
            <span className="uploader-label__primary">クリックしてアップロード</span>
            <span className="uploader-label__secondary">またはドラッグ＆ドロップ</span>
        </label>
        <p className="uploader-hint">Excel (.xlsx, .xls) または CSV ファイル <span className="uploader-hint__note">※Excel解析にはオンラインでXLSXライブラリの読み込みが必要です</span></p>

        {fileName && (
            <div className="uploader-file-preview">
                <FileText className="uploader-file-icon" />
                <span className="uploader-file-name">{fileName}</span>
            </div>
        )}
      </div>
    </div>
  );
};

export default FileUploader;