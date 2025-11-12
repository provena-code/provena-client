import { useMemo } from 'react';
import { PS2 } from 'provena';
import CodeHistoryPlayer from './code-history-player';
import { Metadata } from 'provena';

interface EventLogViewerProps {
  eventLogs: PS2.MainTableRow[];
  file: string;
  onScrub: (frameIndex: number) => void;
  onMetadataHover: (metadata: Metadata | null) => void;
}

export default function EventLogViewer({ eventLogs, file, onScrub, onMetadataHover }: EventLogViewerProps) {
  const processedEditList = useMemo(() => PS2.createEditHistory(eventLogs), [eventLogs]);

  return (
    <div className="w-3/4 p-4 h-full flex flex-col">
      <h3 className="text-lg font-semibold mb-2">Code History for {file}</h3>
      {processedEditList && processedEditList.length > 0 ? (
        <CodeHistoryPlayer
          codeHistory={processedEditList}
          onScrub={onScrub}
          onMetadataHover={onMetadataHover}
        />
      ) : (
        <div>No code history found for this file.</div>
      )}
    </div>
  );
}
