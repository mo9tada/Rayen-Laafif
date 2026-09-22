'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

const DURATION = 0.28;

/**
 * Crossfade between pages.
 *
 * The App Router swaps `children` the moment a navigation commits, so there is
 * no window in which to play an exit animation on the outgoing page. This
 * inverts the order instead: intercept the click, fade the current page out,
 * and only then hand the href to the router. The incoming page fades up from
 * zero because the wrapper is still at zero when the new children mount.
 *
 * Back/forward buttons bypass the interceptor by design; those just fade in.
 */
export default function PageTransition({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);
  const timer = useRef(null);

  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const handleClick = useCallback(
    (event) => {
      if (reducedMotion) return;
      // Let the browser handle anything that is not a plain left click.
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = event.target.closest?.('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href || anchor.target === '_blank' || anchor.hasAttribute('download')) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      // Same page, or a jump to an anchor on it: nothing to fade.
      if (url.pathname === window.location.pathname) return;

      event.preventDefault();
      setLeaving(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => router.push(url.pathname + url.search), DURATION * 1000);
    },
    [reducedMotion, router]
  );

  useEffect(() => {
    document.addEventListener('click', handleClick);
    return () => {
      document.removeEventListener('click', handleClick);
      clearTimeout(timer.current);
    };
  }, [handleClick]);

  // The new route has rendered; bring it back up.
  useEffect(() => {
    setLeaving(false);
  }, [pathname]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: leaving ? 0 : 1 }}
      transition={{ duration: DURATION, ease: 'easeInOut' }}
    >
      {children}
    </motion.div>
  );
}
