'use client';
import Link from "next/link";
import { motion } from "framer-motion";
import { useNavigation } from "@/app/navigation-context.js";
import "./navbar.css";

const navItems = [
    { path: '/', label: 'Portfolio' },
    { path: '/about', label: 'About' },
    { path: '/contact', label: 'Contact' }
];

/** A video page belongs to the portfolio, so the indicator stays on that tab. */
function sectionFor(path) {
    if (path.startsWith('/work')) return '/';
    return path;
}

export default function Navbar() {
    // activePath is the pending destination mid-transition, so the indicator
    // starts travelling the moment a link is clicked rather than after the
    // route commits.
    const { activePath } = useNavigation();
    const current = sectionFor(activePath);

    return (
        <motion.nav
            className="Navbar glass"
            initial={{ y: -100, opacity: 0, x: '-50%' }}
            animate={{ y: 0, opacity: 1, x: '-50%' }}
            transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
        >
            {navItems.map((item) => {
              const isActive = current === item.path;
              return (
                <div key={item.path} className="nav-item">
                    <Link
                      href={item.path}
                      className={isActive ? 'active' : ''}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {item.label}
                    </Link>
                    {isActive && (
                      <motion.div
                        layoutId="navIndicator"
                        className="nav-indicator"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
                </div>
              );
            })}
        </motion.nav>
    );
}
