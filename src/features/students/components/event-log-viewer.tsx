import { PS2 } from 'provena';
import CodeHistoryPlayer from './code-history-player';
import { Metadata } from 'provena';

interface EventLogViewerProps {
  eventHistory: PS2.EditHistoryFrame[];
  file: string;
  onScrub: (frameIndex: number) => void;
  onMetadataHover: (metadata: Metadata | null) => void;
}

export default function EventLogViewer({ eventHistory, file, onScrub, onMetadataHover }: EventLogViewerProps) {

  return (
    <div className="w-3/4 p-4 h-full flex flex-col">
      <h3 className="text-lg font-semibold mb-2">Code History for {file}</h3>
      {eventHistory && eventHistory.length > 0 ? (
        <CodeHistoryPlayer
          codeHistory={eventHistory}
          onScrub={onScrub}
          onMetadataHover={onMetadataHover}
        />
      ) : (
        <div>No code history found for this file.</div>
      )}
    </div>
  );
}
