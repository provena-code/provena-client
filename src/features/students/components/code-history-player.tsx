
import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import CodeViewer from './code-viewer';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { EditHistoryFrame } from '@/util/edit-list-utils';

interface CodeHistoryPlayerProps {
  codeHistory: EditHistoryFrame[];
  onScrub?: (frameIndex: number) => void;
}

export default function CodeHistoryPlayer({ codeHistory, onScrub }: CodeHistoryPlayerProps) {
  const [currentFrame, setCurrentFrame] = useState(codeHistory.length - 1);
  const [isPlaying, setIsPlaying] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollPosRef = useRef(0);
  const holdTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    onScrub?.(currentFrame);
  }, [currentFrame, onScrub]);

  const updateScrollPosition = () => {
    if (scrollContainerRef.current) {
      scrollPosRef.current = scrollContainerRef.current.scrollTop;
    }
  };

  useLayoutEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollPosRef.current;
    }
  }, [currentFrame]);

  useEffect(() => {
    if (isPlaying) {
      if (currentFrame === codeHistory.length - 1) {
        setIsPlaying(false);
        setCurrentFrame(0);
        return;
      }

      const timer = setInterval(() => {
        updateScrollPosition();
        setCurrentFrame((prevFrame) => {
          if (prevFrame < codeHistory.length - 1) {
            return prevFrame + 1;
          }
          setIsPlaying(false);
          return prevFrame;
        });
      }, 200);

      return () => clearInterval(timer);
    }
  }, [isPlaying, currentFrame, codeHistory.length]);

  const handlePlayPause = () => {
    updateScrollPosition();
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      if (currentFrame === codeHistory.length - 1) {
        setCurrentFrame(0);
      }
      setIsPlaying(true);
    }
  };

  const changeFrame = (direction: 'next' | 'prev') => {
    updateScrollPosition();
    setCurrentFrame((prev) => {
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
    updateScrollPosition();
    setIsPlaying(false);
    setCurrentFrame(value[0]);
  };

  const currentEdits = codeHistory[currentFrame];

  return (
    <div className="flex flex-col gap-4 h-full">
      <div ref={scrollContainerRef} className="flex-grow overflow-y-auto border rounded h-[70vh]">
        <CodeViewer frame={currentEdits} />
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
