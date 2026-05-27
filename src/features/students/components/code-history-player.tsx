
import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import CodeViewer from './code-viewer';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { Metadata, PS2 } from 'provena';

interface CodeHistoryPlayerProps {
  codeHistory: readonly PS2.EditHistoryFrame[];
  onScrub?: (frameIndex: number) => void;
  currentFrame?: number | null;
  onMetadataHover: (metadata: Metadata | null) => void;
  jumpToClientTime: (clientTime: number) => void;
}

export default function CodeHistoryPlayer({ codeHistory, onScrub, onMetadataHover, currentFrame: controlledFrame, jumpToClientTime }: CodeHistoryPlayerProps) {
  const [internalFrame, setInternalFrame] = useState(codeHistory.length - 1);
  const currentFrame = typeof controlledFrame === 'number' && controlledFrame !== null ? controlledFrame : internalFrame;
  const [isPlaying, setIsPlaying] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLSpanElement>(null);
  const holdTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    onScrub?.(currentFrame);
  }, [currentFrame, onScrub]);

  useLayoutEffect(() => {
    if (highlightRef.current) {
      highlightRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      });
    }
  }, [currentFrame]);

  useEffect(() => {
    if (isPlaying) {
      if (currentFrame === codeHistory.length - 1) {
        setIsPlaying(false);
        if (controlledFrame === undefined) setInternalFrame(0);
        return;
      }

      const timer = setInterval(() => {
        if (controlledFrame === undefined) {
          setInternalFrame((prevFrame) => {
            if (prevFrame < codeHistory.length - 1) {
              return prevFrame + 1;
            }
            setIsPlaying(false);
            return prevFrame;
          });
        } else {
          const next = Math.min(codeHistory.length - 1, (controlledFrame ?? 0) + 1);
          onScrub?.(next);
          if (next >= codeHistory.length - 1) setIsPlaying(false);
        }
      }, 30);

      return () => clearInterval(timer);
    }
  }, [isPlaying, currentFrame, codeHistory.length, controlledFrame, onScrub]);

  const handlePlayPause = () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      if (currentFrame === codeHistory.length - 1) {
        if (controlledFrame === undefined) setInternalFrame(0);
        else onScrub?.(0);
      }
      setIsPlaying(true);
    }
  };

  const changeFrame = (direction: 'next' | 'prev') => {
    if (controlledFrame !== undefined) {
      const next = direction === 'next' ? Math.min(codeHistory.length - 1, (controlledFrame ?? 0) + 1) : Math.max(0, (controlledFrame ?? 0) - 1);
      onScrub?.(next);
      return;
    }
    setInternalFrame((prev) => {
      if (direction === 'next') {
        return Math.min(codeHistory.length - 1, prev + 1);
      }
      return Math.max(0, prev - 1);
    });
  };

  const handleMouseDown = (direction: 'next' | 'prev') => {
    setIsPlaying(false);
    changeFrame(direction);
    holdTimeoutRef.current = setInterval(() => {
      changeFrame(direction);
    }, 100);
  };

  const handleMouseUp = () => {
    if (holdTimeoutRef.current) {
      clearInterval(holdTimeoutRef.current);
    }
  };

  const handleSliderChange = (value: number[]) => {
    setIsPlaying(false);
    const v = value[0];
    if (controlledFrame !== undefined) {
      onScrub?.(v);
    } else {
      setInternalFrame(v);
    }
  };

  const currentFrameData = codeHistory[currentFrame];

  const showErrorBorder = currentFrameData && !currentFrameData.isInternallyConsistent;

  useEffect(() => {
    if (controlledFrame === undefined) {
      setInternalFrame(codeHistory.length - 1);
    }
  }, [codeHistory, controlledFrame]);

  return (
    <div className="flex flex-col gap-4 h-full">
      <div ref={scrollContainerRef} className="flex-grow overflow-y-auto border rounded h-[60vh]" style={{ borderColor: showErrorBorder ? 'red' : 'black' }}>
        <CodeViewer ref={highlightRef} frame={currentFrameData} onMetadataHover={onMetadataHover} jumpToClientTime={jumpToClientTime} />
      </div>
      <div className="flex items-center gap-4 p-4 border rounded-lg bg-gray-50">
        <Button onClick={handlePlayPause} variant="outline" size="icon">
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <Button
          onMouseDown={() => handleMouseDown('prev')}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          variant="outline"
          size="icon"
          disabled={currentFrame === 0}
        >
          <SkipBack className="h-4 w-4" />
        </Button>
        <Slider
          min={0}
          max={codeHistory.length - 1}
          step={1}
          value={[currentFrame]}
          onValueChange={handleSliderChange}
          className="flex-grow"
        />
        <Button
          onMouseDown={() => handleMouseDown('next')}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          variant="outline"
          size="icon"
          disabled={currentFrame === codeHistory.length - 1}
        >
          <SkipForward className="h-4 w-4" />
        </Button>
        <div className="text-sm font-mono">
          Frame: {currentFrame + 1} / {codeHistory.length}
        </div>
      </div>
    </div>
  );
}
