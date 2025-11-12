
import React from 'react';
import { Metadata } from 'provena';

interface MetadataViewerProps {
  metadata: Metadata | null;
}

export default function MetadataViewer({ metadata }: MetadataViewerProps) {
  return (
    <div className="p-4 border-t border-gray-300 flex-grow flex flex-col overflow-hidden">
      <h3 className="text-lg font-semibold mb-2">Span Metadata</h3>
      <div className="flex-grow overflow-y-auto bg-gray-100 p-2 rounded text-xs">
        {metadata ? (
          <div>
            <p><strong>Author:</strong> {metadata.author}</p>
            <p><strong>Start Time:</strong> {new Date(metadata.startTime).toLocaleDateString()} {new Date(metadata.startTime).toLocaleTimeString()}</p>
            <p><strong>End Time:</strong> {new Date(metadata.endTime).toLocaleDateString()} {new Date(metadata.endTime).toLocaleTimeString()}</p>
          </div>
        ) : (
          <div>Hover over a code segment to see its metadata.</div>
        )}
      </div>
    </div>
  );
}
