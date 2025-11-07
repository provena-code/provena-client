import React from 'react';

interface FileListProps {
  files: string[];
  selectedFile: string | null;
  onSelectFile: (file: string) => void;
}

export default function FileList({ files, selectedFile, onSelectFile }: FileListProps) {
  return (
    <div className="w-1/4 border-r border-gray-300 p-4">
      <h3 className="text-lg font-semibold mb-2">Files</h3>
      <ul>
        {files.map((file) => (
          <li
            key={file}
            className={`cursor-pointer p-2 rounded ${
              selectedFile === file ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'
            }`}
            onClick={() => onSelectFile(file)}
          >
            {file}
          </li>
        ))}
      </ul>
    </div>
  );
}
