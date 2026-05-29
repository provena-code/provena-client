import { findIndicesToRedact } from '@/lib/anon';
import { useHighlightEnabled } from '@/lib/highlight-setting';
import { Author, PS2, Metadata } from 'provena';
import { forwardRef, useEffect, useState } from 'react';

interface CodeViewerProps {
  frame: PS2.EditHistoryFrame;
  onMetadataHover: (metadata: Metadata | null) => void;
  jumpToClientTime: (clientTime: number) => void;
  onHoverCharacterIndexChange?: (characterIndex: number | null) => void;
}

const authorColorMap: { [key in Author]?: string } = {
  [Author.User]: 'bg-green-200',
  [Author.System]: 'bg-yellow-200',
  [Author.ExistingText]: 'bg-gray-300',
  [Author.ExternalPaste]: 'bg-purple-200',
  [Author.ExternalEdit]: 'bg-orange-200',
  [Author.Unknown]: 'bg-red-200',
};

const CodeViewer = forwardRef<HTMLSpanElement, CodeViewerProps>(({ frame, onMetadataHover, jumpToClientTime, onHoverCharacterIndexChange }, ref) => {
  const { edits, editedRanges } = frame;
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Control") {
        document.body.setAttribute("data-ctrl-pressed", "true");
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Control") {
        document.body.removeAttribute("data-ctrl-pressed");
      }
    };

    // Reset if user tabs away or leaves the window
    const handleBlur = () => {
      document.body.removeAttribute("data-ctrl-pressed");
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);

  // By changing the key of the highlight span, we force React to create a new
  // element, which makes the CSS animation re-trigger.
  useEffect(() => {
    setAnimationKey(prev => prev + 1);
  }, [frame]);

  const codeString = edits.map(edit => edit.text).join('');
  const redactedIndices = findIndicesToRedact(codeString);

  // For each edit, find any indices that need to be redaced (local to that string)
  let currentOffset = 0;
  const localRedactedIndices = edits.map(edit => {
    const indices: number[] = [];
    for (let i = 0; i < edit.text.length; i++) {
      if (redactedIndices.has(currentOffset + i)) {
        indices.push(i);
      }
    }
    currentOffset += edit.text.length;
    return indices;
  });

  const [highlightEnabled] = useHighlightEnabled()

  const getLocalCharacterIndex = (
    e: React.MouseEvent<HTMLSpanElement>,
    textLength: number,
  ) => {
    if (textLength === 0) {
      return 0;
    }

    const target = e.currentTarget;
    let localIndex = textLength - 1;

    if (typeof document.caretPositionFromPoint === 'function') {
      const caretPosition = document.caretPositionFromPoint(e.clientX, e.clientY);
      if (
        caretPosition &&
        caretPosition.offsetNode &&
        target.contains(caretPosition.offsetNode)
      ) {
        localIndex = caretPosition.offset;
      }
    } else if (typeof document.caretRangeFromPoint === 'function') {
      const caretRange = document.caretRangeFromPoint(e.clientX, e.clientY);
      if (
        caretRange &&
        caretRange.startContainer &&
        target.contains(caretRange.startContainer)
      ) {
        localIndex = caretRange.startOffset;
      }
    }

    return Math.max(0, Math.min(textLength - 1, localIndex));
  };

  const renderSpans = () => {
    let currentOffset = 0;
    return edits.map((edit, index) => {
      const authorId = edit.metadata.author;
      const className = highlightEnabled ? (authorColorMap[authorId] || authorColorMap[Author.Unknown]) : '';
      const start = currentOffset;
      const end = start + edit.text.length;
      currentOffset = end;


      let redactedText = edit.text;
      for (const redactIndex of localRedactedIndices[index]) {
        redactedText = redactedText.substring(0, redactIndex) + '█' + redactedText.substring(redactIndex + 1);
      }

      const spanProps = {
        onMouseEnter: () => onMetadataHover(edit.metadata),
        onMouseMove: (e: React.MouseEvent<HTMLSpanElement>) => {
          const localCharacterIndex = getLocalCharacterIndex(e, redactedText.length);
          onHoverCharacterIndexChange?.(start + localCharacterIndex);
        },
        onMouseLeave: () => {
          onMetadataHover(null);
          onHoverCharacterIndexChange?.(null);
        },
        onClick: (e: React.MouseEvent<HTMLSpanElement>) => {
          // If control is held down
          if (e.ctrlKey) {
            jumpToClientTime(edit.metadata.endTime)
          }
        },
      }

      // TODO: Figure out how to handle multi-range edits
      for (const editedRange of editedRanges) {
        // If start and end properly overlap with editedRange...
        if (editedRange && start < editedRange.end && end > editedRange.start) {
          const startIndex = Math.max(start, editedRange.start);
          const endIndex = Math.min(end, editedRange.end);
          const highlightedText = redactedText.slice(startIndex - start, endIndex - start);
          const beforeText = redactedText.slice(0, startIndex - start);
          const afterText = redactedText.slice(endIndex - start);

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
          return <span key={index} {...spanProps} className={`inline ctrl-clickable ${className}`}>
            {spans}
          </span>;
        }
      }

      return <span key={index} {...spanProps} className={`inline ctrl-clickable ${className}`}>
        {redactedText}
      </span>
    });
  };

  return (
    <div className="font-mono text-sm whitespace-pre-wrap p-2 bg-white" style={{ lineHeight: 1.15 }} onMouseLeave={() => onHoverCharacterIndexChange?.(null)}>
      {renderSpans()}
    </div>
  );
});

CodeViewer.displayName = 'CodeViewer';
export default CodeViewer;
