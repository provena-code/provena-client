import { PS2 } from 'provena';
import CodeHistoryPlayer from './code-history-player';
import { Metadata } from 'provena';
import { useHighlightEnabled } from '@/lib/highlight-setting';
import { redactCode } from '@/lib/anon';

interface EventLogViewerProps {
  eventHistory: readonly PS2.EditHistoryFrame[];
  file: string;
  onScrub: (frameIndex: number) => void;
  currentFrame?: number | null;
  onMetadataHover: (metadata: Metadata | null) => void;
  jumpToClientTime: (clientTime: number) => void;
  discontinuityIndices: number[];
}

export default function EventLogViewer({ eventHistory, file, onScrub, currentFrame, onMetadataHover, jumpToClientTime, discontinuityIndices }: EventLogViewerProps) {
  const [highlightEnabled, setHighlightEnabled] = useHighlightEnabled();

  function copyCurrentCode() {
    // A bit of a hack, but easier than keeping a ref
    const viewer = document.getElementById('code-viewer');
    const code = viewer?.textContent || '';
    if (code) {
      navigator.clipboard.writeText(redactCode(code));
    }
  }

  return (
    <div className="w-3/4 p-4 h-full flex flex-col">
      <div className="mb-2 flex items-center justify-between gap-4">
        <h3 className="text-lg font-semibold">Code History for {file}
          <button className='border border-gray-300 hover:bg-gray-200 cursor-pointer ml-2' onClick={
            () => copyCurrentCode()
          }>📄</button>
        </h3>
        <label className="flex items-center gap-2 text-sm font-medium">
          Highlight
          <input
            type="checkbox"
            checked={highlightEnabled}
            onChange={(event) => setHighlightEnabled(event.target.checked)}
          />
        </label>
      </div>
      {eventHistory && eventHistory.length > 0 ? (
        <CodeHistoryPlayer
          codeHistory={eventHistory}
          onScrub={onScrub}
          currentFrame={currentFrame}
          onMetadataHover={onMetadataHover}
          jumpToClientTime={jumpToClientTime}
          discontinuityIndices={discontinuityIndices}
        />
      ) : (
        <div>No code history found for this file.</div>
      )}
    </div>
  );
}
