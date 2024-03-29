import * as React from 'react';

export function useMutationObserver(
  ref: React.MutableRefObject<HTMLElement | null>,
  callback: MutationCallback,
  options: MutationObserverInit = {
    childList: true,
    attributes: true,
    subtree: true,
    characterData: true,
  },
) {
  React.useEffect(() => {
    if (!ref.current) return;
    const observer = new MutationObserver(callback);
    observer.observe(ref.current, options);
    return () => observer.disconnect();
  }, []);
}
