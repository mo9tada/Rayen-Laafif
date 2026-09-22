'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';

export const TRANSITION_SECONDS = 0.28;

const NavigationContext = createContext({ pendingPath: null, activePath: '/' });

/**
 * Owns route changes for the whole app.
 *
 * A click is intercepted, the target is recorded as `pendingPath`, and the
 * router is only told about it once the outgoing page has had time to fade.
 * Publishing that pending value is the point: the navbar can move its
 * indicator the instant you click, travelling from the page you were on to the
 * one you picked, instead of waiting out the fade and then jumping.
 */
export function NavigationProvider({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [pendingPath, setPendingPath] = useState(null);
  const timer = useRef(null);

  const handleClick = useCallback(
    (event) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = event.target.closest?.('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href || anchor.target === '_blank' || anchor.hasAttribute('download')) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname) return;

      const destination = url.pathname + url.search;

      // Honour a reduced-motion preference by navigating straight away.
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        event.preventDefault();
        router.push(destination);
        return;
      }

      event.preventDefault();
      setPendingPath(url.pathname);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => router.push(destination), TRANSITION_SECONDS * 1000);
    },
    [router]
  );

  useEffect(() => {
    document.addEventListener('click', handleClick);
    return () => {
      document.removeEventListener('click', handleClick);
      clearTimeout(timer.current);
    };
  }, [handleClick]);

  // The new route is live, so the pending value has served its purpose.
  useEffect(() => {
    setPendingPath(null);
  }, [pathname]);

  const value = useMemo(
    () => ({ pendingPath, activePath: pendingPath ?? pathname }),
    [pendingPath, pathname]
  );

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}

/**
 * `activePath` is where the UI should behave as though it already is: the
 * pending destination during a transition, otherwise the real pathname.
 */
export function useNavigation() {
  return useContext(NavigationContext);
}
