import { useSyncExternalStore } from 'react';

const HIGHLIGHT_STORAGE_KEY = 'provena-highlight-enabled';
const HIGHLIGHT_DEFAULT = false;
const HIGHLIGHT_EVENT = 'provena-highlight-changed';

function parseHighlightValue(value: string | null): boolean {
  if (value == null) {
    return HIGHLIGHT_DEFAULT;
  }
  return value === 'true';
}

function readHighlightSetting(): boolean {
  if (typeof window === 'undefined') {
    return HIGHLIGHT_DEFAULT;
  }
  return parseHighlightValue(window.localStorage.getItem(HIGHLIGHT_STORAGE_KEY));
}

function emitHighlightChanged() {
  if (typeof window === 'undefined') {
    return;
  }
  window.dispatchEvent(new Event(HIGHLIGHT_EVENT));
}

function subscribeHighlight(callback: () => void) {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const onChanged = () => callback();
  window.addEventListener('storage', onChanged);
  window.addEventListener(HIGHLIGHT_EVENT, onChanged);

  return () => {
    window.removeEventListener('storage', onChanged);
    window.removeEventListener(HIGHLIGHT_EVENT, onChanged);
  };
}

export function getHighlightEnabled(): boolean {
  return readHighlightSetting();
}

export function setHighlightEnabled(enabled: boolean) {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(HIGHLIGHT_STORAGE_KEY, String(enabled));
  emitHighlightChanged();
}

export function useHighlightEnabled(): [boolean, (enabled: boolean) => void] {
  const highlightEnabled = useSyncExternalStore(
    subscribeHighlight,
    readHighlightSetting,
    () => HIGHLIGHT_DEFAULT,
  );

  return [highlightEnabled, setHighlightEnabled];
}
