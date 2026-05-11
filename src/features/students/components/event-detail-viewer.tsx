
import React, { useState, useEffect } from 'react';
import { MainTableEvent } from '@/api';

interface EventDetailViewerProps {
  events: MainTableEvent[];
}

export default function EventDetailViewer({ events }: EventDetailViewerProps) {
  const [index, setIndex] = useState(0);
  // Only reset index when `events` actually changes (deep equality),
  // avoiding resets from stable/identical arrays or incidental re-renders.
  const prevEventsRef = React.useRef<MainTableEvent[] | undefined>(undefined);
  useEffect(() => {
    const prev = prevEventsRef.current;
    // Serialize for a simple deep-equality check; arrays with identical
    // contents will produce the same string.
    const prevStr = prev ? JSON.stringify(prev) : undefined;
    const nextStr = events ? JSON.stringify(events) : undefined;

    if (prevStr === undefined) {
      // initial mount - keep existing index (already 0)
    } else if (prevStr !== nextStr) {
      setIndex(0);
    }

    prevEventsRef.current = events;
  }, [events]);

  const removeNulls = (obj: MainTableEvent): Partial<MainTableEvent> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cleanedObj: any = {};
    for (const key in obj) {
      const value = obj[key as keyof MainTableEvent];
      if (value !== null && value !== undefined) {
        cleanedObj[key] = value;
      }
    }
    return cleanedObj;
  };

  const total = events?.length ?? 0;
  const current = total > 0 ? events[index] : undefined;

  const prev = () => setIndex((i) => Math.max(0, i - 1));
  const next = () => setIndex((i) => Math.min(total - 1, i + 1));

  return (
    <div className="p-4 border-t border-gray-300">
      <h3 className="text-lg font-semibold mb-2">Event Details</h3>

      {current ? (
        <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto min-h-65">
          {JSON.stringify(removeNulls(current), null, 2)}
        </pre>
      ) : (
        <div>No event selected.</div>
      )}

      <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={prev}
            disabled={index <= 0}
            className={`px-2 py-1 rounded ${index <= 0 ? 'bg-gray-100 text-gray-400' : 'bg-white hover:bg-gray-50 border'} border-gray-300`}
            aria-label="Previous event"
            title="Previous event"
          >
            ← Prev
          </button>
          <button
            onClick={next}
            disabled={index >= total - 1}
            className={`px-2 py-1 rounded ${index >= total - 1 ? 'bg-gray-100 text-gray-400' : 'bg-white hover:bg-gray-50 border'} border-gray-300`}
            aria-label="Next event"
            title="Next event"
          >
            Next →
          </button>
        </div>

        <div className="text-gray-600">
          {total > 0 ? (
            <span>
              Viewing <strong>{index + 1}</strong> of <strong>{total}</strong>
            </span>
          ) : (
            <span>0 events</span>
          )}
        </div>
      </div>
    </div>
  );
}
