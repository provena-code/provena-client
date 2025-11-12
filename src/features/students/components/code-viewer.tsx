import { Author, PS2, Metadata } from 'provena';
import { forwardRef, useEffect, useState } from 'react';

interface CodeViewerProps {
  frame: PS2.EditHistoryFrame;
  onMetadataHover: (metadata: Metadata | null) => void;
}

const authorColorMap: { [key in Author]?: string } = {
  [Author.User]: 'bg-green-200',
  [Author.System]: 'bg-yellow-200',
  [Author.ExistingText]: 'bg-gray-300',
  [Author.ExternalPaste]: 'bg-purple-200',
  [Author.ExternalEdit]: 'bg-orange-200',
  [Author.Unknown]: 'bg-red-200',
};

const CodeViewer = forwardRef<HTMLSpanElement, CodeViewerProps>(({ frame, onMetadataHover }, ref) => {
  const { edits, editedRange } = frame;
  const [animationKey, setAnimationKey] = useState(0);

  // By changing the key of the highlight span, we force React to create a new
  // element, which makes the CSS animation re-trigger.
  useEffect(() => {
    setAnimationKey(prev => prev + 1);
  }, [frame]);

  const renderSpans = () => {
    let currentOffset = 0;
    return edits.map((edit, index) => {
      const authorId = edit.metadata.author;
      const className = authorColorMap[authorId] || authorColorMap[Author.Unknown];
      const start = currentOffset;
      const end = start + edit.text.length;
      currentOffset = end;

      const spanProps = {
        key: index,
        onMouseEnter: () => onMetadataHover(edit.metadata),
        onMouseLeave: () => onMetadataHover(null),
      }

      // If start and end properly overlap with editedRange...
      if (editedRange && start < editedRange.end && end > editedRange.start) {
        const startIndex = Math.max(start, editedRange.start);
        const endIndex = Math.min(end, editedRange.end);
        const highlightedText = edit.text.slice(startIndex - start, endIndex - start);
        const beforeText = edit.text.slice(0, startIndex - start);
        const afterText = edit.text.slice(endIndex - start);

        const spans = [];
        if (beforeText) {
          spans.push(<span key={`before-${index}`}>{beforeText}</span>);
        }

        spans.push(<span
            ref={ref}
            className={`highlight-fade-bg`}
            key={`${animationKey}-${index}`}
        >{highlightedText}</span>);

        if (afterText) {
          spans.push(<span key={`after-${index}`}>{afterText}</span>);
        }
        return <span {...spanProps} className={`inline ${className} border-b border-gray-300`}>
          {spans}
        </span>;
      }

      return <span {...spanProps} className={`inline ${className} border-b border-gray-300`}>
        {edit.text}
      </span>
    });
  };

  return (
    <div className="font-mono text-sm whitespace-pre-wrap p-2 bg-white" style={{ lineHeight: 1.15 }}>
      {renderSpans()}
    </div>
  );
});

CodeViewer.displayName = 'CodeViewer';
export default CodeViewer;
