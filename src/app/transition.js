'use client';

import { motion } from 'framer-motion';
import { TRANSITION_SECONDS, useNavigation } from './navigation-context.js';

/**
 * Crossfade between pages.
 *
 * The App Router swaps `children` the moment a navigation commits, so there is
 * no window in which to play an exit animation on the outgoing page. The
 * provider inverts the order instead: it holds the click, publishes the
 * destination, and pushes to the router once this fade has run. The incoming
 * page fades up from zero because the wrapper is still at zero when the new
 * children mount.
 *
 * Back/forward buttons bypass the interceptor by design; those just fade in.
 */
export default function PageTransition({ children }) {
  const { pendingPath } = useNavigation();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: pendingPath ? 0 : 1 }}
      transition={{ duration: TRANSITION_SECONDS, ease: 'easeInOut' }}
    >
      {children}
    </motion.div>
  );
}
