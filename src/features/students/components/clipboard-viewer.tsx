// Displays a truncated version of the current clipboard
// With alt text with the full clipboard content (since it may be truncated in the main view)
import React from 'react';

interface ClipboardViewerProps {
    clipboard: string;
}

export default function ClipboardViewer({ clipboard }: ClipboardViewerProps) {
    const truncateLength = 100;
    const truncated = clipboard.length > truncateLength ? clipboard.slice(0, truncateLength) + '...' : clipboard;
    return (
        <div className="p-4 border-t border-gray-300">
            <h3 className="text-lg font-semibold mb-2">
                Current Clipboard
                <button className='border border-gray-300 hover:bg-gray-200 cursor-pointer ml-2' onClick={
                    () => navigator.clipboard.writeText(clipboard)
                }>📄</button>
            </h3>
            <div className="bg-gray-100 p-2 rounded text-xs overflow-auto min-h-20" title={clipboard}>
                {truncated}
            </div>
        </div>
    );
}