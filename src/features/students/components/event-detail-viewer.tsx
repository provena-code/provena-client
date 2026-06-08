
import React, { useState, useEffect } from 'react';
import { MainTableEvent } from '@/api';
import { anonymizeObject, redactCode } from '@/lib/anon';

interface EventDetailViewerProps {
  events: MainTableEvent[];
  hadDiscontinuity?: boolean;
  sessionIDs: string[];
}

export default function EventDetailViewer({ events, hadDiscontinuity, sessionIDs }: EventDetailViewerProps) {
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

  const removeNulls = <T extends Record<string, unknown>>(obj: T): Partial<T> => {
    return Object.entries(obj).reduce((acc, [key, value]) => {
      if (value !== null && value !== undefined) {
        acc[key as keyof T] = value as T[keyof T];
      }
      return acc;
    }, {} as Partial<T>);
  };

  const formatValue = (value: unknown): string => {
    if (typeof value === 'string') {
      // replace newlines (with or without \r) with ⏎ symbol
      // to keep it on a single line in the UI
      return value.replace(/\r?\n/g, '⏎');
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }

    return JSON.stringify(value, null, 2);
  };

  const total = events?.length ?? 0;
  const current = total > 0 ? events[index] : undefined;

  const anonEventData = current ? anonymizeObject(current) : null;
  if (anonEventData && anonEventData.Code) {
    anonEventData.Code = redactCode(anonEventData.Code);
  }
  if (anonEventData && anonEventData.InsertText) {
    anonEventData.InsertText = redactCode(anonEventData.InsertText);
  }

  const displayEntries = anonEventData
    ? Object.entries(removeNulls(anonEventData as Record<string, unknown>))
    : [];

  const prev = () => setIndex((i) => Math.max(0, i - 1));
  const next = () => setIndex((i) => Math.min(total - 1, i + 1));

  const fieldOrder = [
    'EventType',
    'SessionID',
    'Order',
    'ClientTimestamp',
    'ServerTimestamp',
  ]
  const orderComparator = (a: [string, unknown], b: [string, unknown]) => {
    let aIndex = fieldOrder.indexOf(a[0]);
    if (aIndex === -1) aIndex = Number.POSITIVE_INFINITY;
    let bIndex = fieldOrder.indexOf(b[0]);
    if (bIndex === -1) bIndex = Number.POSITIVE_INFINITY;
    return aIndex - bIndex;
  };
  const sortedEntries = displayEntries.sort(orderComparator);

  // Give each unique SessionID a consistent color for easier visual association across events
  const sessionIDColors: Record<string, string> = {};
  sessionIDs.forEach((id, index) => {
    const hue = (index * 137.508) % 360; // use golden angle increment for good distribution
    sessionIDColors[id] = `hsl(${hue}, 70%, 80%)`;
  });

  return (
    <div className="p-2 border-t border-gray-300">
      <h3 className="text-lg font-semibold mb-2">
        Event Details
        { hadDiscontinuity && (
          <span className="ml-1 p-1 bg-red-100 text-red-800 rounded">
            Discontinuity
          </span>
        )
        }
      </h3>

      {anonEventData ? (
        <div className="min-h-65 overflow-auto">
          <div className="grid grid-cols-1">
            {sortedEntries.map(([key, value]) => (
              <div key={key} className="bg-white px-1 py-0.5">
                <div className="text-[8px] uppercase leading-none tracking-wide text-gray-500 mb-0.5">{key}</div>
                <div
                  className="font-mono text-[11px] leading-tight text-gray-900 whitespace-pre"
                  title={String(value)}
                  style={key === 'SessionID' && typeof value === 'string' ? { backgroundColor: sessionIDColors[value], padding: '0 2px', borderRadius: '2px' } : undefined}
                >
                  {formatValue(value)}
                </div>
              </div>
            ))}
          </div>
        </div>
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
