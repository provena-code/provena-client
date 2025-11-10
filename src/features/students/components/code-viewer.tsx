import { Author, Metadata } from 'provena';
import { EditHistoryFrame } from '@/util/edit-list-utils';
import { forwardRef, useEffect, useState } from 'react';

interface CodeViewerProps {
  frame: EditHistoryFrame;
}

const authorColorMap: { [key in Author]?: string } = {
  [Author.User]: 'bg-blue-200',
  [Author.System]: 'bg-green-200',
  [Author.ExistingText]: 'bg-gray-300',
  [Author.ExternalPaste]: 'bg-purple-200',
  [Author.ExternalEdit]: 'bg-orange-200',
  [Author.Unknown]: 'bg-red-200',
};

const highlightColorMap = {
  replacement: 'rgba(252, 211, 77, 0.5)', // yellow-400/50
  insertion: 'rgba(74, 222, 128, 0.5)',   // green-400/50
  deletion: 'rgba(248, 113, 113, 0.5)',    // red-400/50
};

const CodeViewer = forwardRef<HTMLSpanElement, CodeViewerProps>(({ frame }, ref) => {
  const { edits, editedRange, wasInsertion, wasDeletion } = frame;
  const [animationKey, setAnimationKey] = useState(0);

  // By changing the key of the highlight span, we force React to create a new
  // element, which makes the CSS animation re-trigger.
  useEffect(() => {
    setAnimationKey(prev => prev + 1);
  }, [frame]);

  let highlightColor = '';
  if (wasInsertion && wasDeletion) {
    highlightColor = highlightColorMap.replacement;
  } else if (wasInsertion) {
    highlightColor = highlightColorMap.insertion;
  } else if (wasDeletion) {
    highlightColor = highlightColorMap.deletion;
  }

  const createSpan = (text: string, metadata: Metadata, isHighlighted: boolean, index: number) => {
    const authorId = metadata.author;
    const className = authorColorMap[authorId] || authorColorMap[Author.Unknown];
    const titleText = JSON.stringify(metadata, null, 2);
    if (isHighlighted) {
      return <span
        ref={ref}
        className={`highlight-fade-bg inline ${className} border-b border-gray-300`}
        style={{ '--highlight-color': highlightColor } as React.CSSProperties}
        key={animationKey}
        title={titleText}
      >
        {text}
      </span>
    }
    return (
      <span key={index} className={`inline ${className} border-b border-gray-300`} title={titleText}>
        {text}
      </span>
    );
  };

  const renderSpans = () => {
    let currentOffset = 0;
    let index = 0;
    return edits.flatMap((edit) => {
      const start = currentOffset;
      const end = start + edit.text.length;
      currentOffset = end;

      // If start and end properly overlap with editedRange...
      if (editedRange && start < editedRange.end && end > editedRange.start) {
        const startIndex = Math.max(start, editedRange.start);
        const endIndex = Math.min(end, editedRange.end);
        const highlightedText = edit.text.slice(startIndex - start, endIndex - start);
        const beforeText = edit.text.slice(0, startIndex - start);
        const afterText = edit.text.slice(endIndex - start);

        const spans = [];
        if (beforeText) {
          spans.push(createSpan(beforeText, edit.metadata, false, index++));
        }
        spans.push(createSpan(highlightedText, edit.metadata, true, index++));
        if (afterText) {
          spans.push(createSpan(afterText, edit.metadata, false, index++));
        }
        return spans;
      }

      return [createSpan(edit.text, edit.metadata, false, index++)];
    });
  };

  return (
    <div className="font-mono text-sm whitespace-pre-wrap p-2 bg-white">
      {renderSpans()}
    </div>
  );
});

CodeViewer.displayName = 'CodeViewer';
export default CodeViewer;
