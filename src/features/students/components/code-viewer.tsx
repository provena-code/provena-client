import React from 'react';
import type { EditRange } from 'provena';
import { Author } from 'provena';

interface CodeViewerProps {
  edits: EditRange[];
}

// Simple mapping for author IDs to CSS classes for styling
const authorColorMap: { [key in Author]?: string } & { default: string } = {
  [Author.User]: 'bg-blue-200',
  [Author.System]: 'bg-green-200',
  [Author.ExistingText]: 'bg-gray-300',
  [Author.ExternalPaste]: 'bg-purple-200',
  [Author.ExternalEdit]: 'bg-orange-200',
  [Author.Unknown]: 'bg-red-200',
  'default': 'bg-gray-200', // Fallback for any unexpected values
};

export default function CodeViewer({ edits }: CodeViewerProps) {
  return (
    <div className="font-mono text-sm whitespace-pre-wrap p-2 border rounded bg-white">
      {edits.map((edit, index) => {
        const authorId = edit.metadata.author; // Assuming author is an Author enum value
        const className = authorColorMap[authorId] || authorColorMap['default'];
        const titleText = JSON.stringify(edit.metadata, null, 2);

        return (
          <span
            key={index}
            className={`inline-block ${className} px-0.5 rounded-sm`}
            title={titleText}
          >
            {edit.text}
          </span>
        );
      })}
    </div>
  );
}