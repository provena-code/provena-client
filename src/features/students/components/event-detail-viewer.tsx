
import React from 'react';
import { MainTableEvent } from '@/api';

interface EventDetailViewerProps {
  event: MainTableEvent | null;
}

export default function EventDetailViewer({ event }: EventDetailViewerProps) {
  return (
    <div className="p-4 border-t border-gray-300">
      <h3 className="text-lg font-semibold mb-2">Event Details</h3>
      {event ? (
        <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
          {JSON.stringify(event, null, 2)}
        </pre>
      ) : (
        <div>No event selected.</div>
      )}
    </div>
  );
}
