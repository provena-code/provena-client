import { Author } from 'provena';
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

const CodeViewer = forwardRef<HTMLSpanElement, CodeViewerProps>(({ frame }, ref) => {
  const { edits, editedRange, wasInsertion, wasDeletion } = frame;
  const [isHighlightVisible, setIsHighlightVisible] = useState(true);

  // Reset highlight on frame change
  useEffect(() => {
    setIsHighlightVisible(true);
    const timer = setTimeout(() => {
      setIsHighlightVisible(false);
    }, 10); // Short delay to allow CSS transition to trigger
    return () => clearTimeout(timer);
  }, [frame]);

  let highlightTypeClass = '';
  if (wasInsertion && wasDeletion) {
    highlightTypeClass = 'bg-yellow-400/50'; // Replacement
  } else if (wasInsertion) {
    highlightTypeClass = 'bg-green-400/50'; // Insertion
  } else if (wasDeletion) {
    highlightTypeClass = 'bg-red-400/50'; // Deletion
  }

  const highlightClasses = `
    transition-opacity duration-500
    ${isHighlightVisible ? 'opacity-100' : 'opacity-0'}
    ${highlightTypeClass}
  `;

  const renderSpans = () => {
    let currentOffset = 0;
    const spans = edits.map((edit, index) => {
      const start = currentOffset;
      const end = start + edit.text.length;
      currentOffset = end;

      const authorId = edit.metadata.author;
      const className = authorColorMap[authorId] || authorColorMap[Author.Unknown];
      const titleText = JSON.stringify(edit.metadata, null, 2);

      return {
        component: (
          <span key={index} className={`inline ${className} border-b border-gray-300`} title={titleText}>
            {edit.text}
          </span>
        ),
        start,
        end,
      };
    });

    if (!editedRange) {
      return spans.map(s => s.component);
    }

    const elements = [];

    // Find the start and end spans for the highlight
    const startSpanIndex = spans.findIndex(s => s.start >= editedRange.start);
    const endSpanIndex = spans.findIndex(s => s.end >= editedRange.end);

    if (startSpanIndex === -1 || endSpanIndex === -1) {
        return spans.map(s => s.component);
    }

    // Add spans before the highlight
    for (let i = 0; i < startSpanIndex; i++) {
      elements.push(spans[i].component);
    }

    // Create the highlighted group
    const highlightedSpans = spans.slice(startSpanIndex, endSpanIndex + 1);
    if (highlightedSpans.length > 0) {
      elements.push(
        <span ref={ref} className={highlightClasses} key="highlight">
          {highlightedSpans.map(s => s.component)}
        </span>
      );
    }

    // Add spans after the highlight
    for (let i = endSpanIndex + 1; i < spans.length; i++) {
      elements.push(spans[i].component);
    }

    return elements;
  };

  return (
    <div className="font-mono text-sm whitespace-pre-wrap p-2 bg-white">
      {renderSpans()}
    </div>
  );
});

CodeViewer.displayName = 'CodeViewer';
export default CodeViewer;
