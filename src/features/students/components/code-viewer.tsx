import { Author, Metadata, PS2 } from 'provena';
import { forwardRef, useEffect, useState } from 'react';

interface CodeViewerProps {
  frame: PS2.EditHistoryFrame;
  onMetadataHover: (metadata: Metadata | null) => void;
}

const authorColorMap: { [key in Author]?: string } = {
  [Author.User]: 'bg-green-200',
  [Author.System]: 'bg-yellow-200',
  [Author.ExistingText]: '',
  [Author.ExternalPaste]: 'bg-red-200',
  [Author.ExternalEdit]: 'bg-orange-200',
  [Author.Unknown]: 'bg-gray-200',
};

const highlightColorMap = {
  replacement: 'rgba(252, 211, 77, 0.5)', // yellow-400/50
  insertion: 'rgba(74, 222, 128, 0.5)',   // green-400/50
  deletion: 'rgba(248, 113, 113, 0.5)',    // red-400/50
};

const CodeViewer = forwardRef<HTMLSpanElement, CodeViewerProps>(({ frame, onMetadataHover }, ref) => {
  const { edits, editedRange, wasInsertion, wasDeletion } = frame;
  const [animationKey, setAnimationKey] = useState(0);

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

  const createSpan = (
    text: string,
    metadata: Metadata,
    isHighlighted: boolean,
    key: string | number
  ) => {
    const authorId = metadata.author;
    const baseClassName = authorColorMap[authorId] || authorColorMap[Author.Unknown];
    const titleText = JSON.stringify(metadata, null, 2);

    const spanProps = {
      key,
      title: titleText,
      onMouseEnter: () => onMetadataHover(metadata),
      onMouseLeave: () => onMetadataHover(null),
    };

    if (isHighlighted) {
      return (
        <span
          ref={ref}
          className={`highlight-container inline ${baseClassName} border-b border-gray-300`}
          style={{ '--highlight-color': highlightColor } as React.CSSProperties}
          {...spanProps}
        >
          {text}
        </span>
      );
    }

    return (
      <span className={`inline ${baseClassName} border-b border-gray-300`} {...spanProps}>
        {text}
      </span>
    );
  };

  const renderSpans = () => {
    let currentOffset = 0;
    let keyIndex = 0;

    return edits.flatMap((edit) => {
      const start = currentOffset;
      const end = start + edit.text.length;
      currentOffset = end;

      if (editedRange && start < editedRange.end && end > editedRange.start) {
        const spans = [];
        let lastSliceEnd = 0;

        // 1. Part of the span before the highlight
        const beforeHighlightEnd = Math.max(0, editedRange.start - start);
        if (beforeHighlightEnd > 0) {
          spans.push(createSpan(edit.text.slice(0, beforeHighlightEnd), edit.metadata, false, `before-${keyIndex++}`));
          lastSliceEnd = beforeHighlightEnd;
        }

        // 2. The highlighted part of the span
        const highlightEnd = Math.min(edit.text.length, editedRange.end - start);
        const highlightedText = edit.text.slice(lastSliceEnd, highlightEnd);
        if (highlightedText) {
          // Use animationKey to ensure re-animation
          spans.push(createSpan(highlightedText, edit.metadata, true, `${animationKey}-${keyIndex++}`));
          lastSliceEnd = highlightEnd;
        }

        // 3. Part of the span after the highlight
        if (lastSliceEnd < edit.text.length) {
          spans.push(createSpan(edit.text.slice(lastSliceEnd), edit.metadata, false, `after-${keyIndex++}`));
        }

        return spans;
      }

      return [createSpan(edit.text, edit.metadata, false, `normal-${keyIndex++}`)];
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
