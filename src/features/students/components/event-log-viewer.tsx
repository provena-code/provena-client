import { useMemo } from 'react';
import { createEditList } from '@/util/edit-list-utils';
import CodeHistoryPlayer from './code-history-player';
import { MainTableEvent } from '@/api';

interface EventLogViewerProps {
  eventLogs: MainTableEvent[];
  file: string;
  onScrub: (frameIndex: number) => void;
}

export default function EventLogViewer({ eventLogs, file, onScrub }: EventLogViewerProps) {
  const processedEditList = useMemo(() => createEditList(eventLogs), [eventLogs]);

  return (
    <div className="w-3/4 p-4 h-full flex flex-col">
      <h3 className="text-lg font-semibold mb-2">Code History for {file}</h3>
      {processedEditList && processedEditList.length > 0 ? (
        <CodeHistoryPlayer codeHistory={processedEditList} onScrub={onScrub} />
      ) : (
        <div>No code history found for this file.</div>
      )}
    </div>
  );
}
