'use client';

import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

function VideoCard({ vid }) {
  return (
    <motion.article
      className="video-card"
      variants={{
        hidden: { opacity: 0, y: 40 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
      }}
    >
      <Link href={`/work/${vid.id}`} className="video-card__link" aria-label={vid.title}>
      <img
        src={vid.thumb}
        alt={vid.title}
        className="video-thumbnail"
        loading="lazy"
        // Drive answers 429 when it sees a referring page, so send none.
        referrerPolicy="no-referrer"
        onError={(e) => {
          const fallback = vid.thumbFallback;
          if (fallback && e.currentTarget.src !== fallback) {
            e.currentTarget.src = fallback;
          }
        }}
      />

      {/* Caption stays hidden until hover, over a near-opaque wash of the image. */}
      <div className="video-overlay">
        <h3 className="video-overlay__title">{vid.title}</h3>
        {vid.year && <p className="video-overlay__meta">{vid.year}</p>}
      </div>
      </Link>
    </motion.article>
  );
}

export default function Portfolio({ videos = [], error = null }) {
  const { scrollYProgress } = useScroll();
  const yBg = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const opacityHero = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  // Dynamic variants for text
  const textVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  const titleText = "RAYEN LAAFIF";

  return (
    <>
      <header className="hero" style={{ overflow: 'hidden', position: 'relative' }}>
        {/* Parallax Animated background blobs */}
        <motion.div 
          className="bg-blob"
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          style={{ position: 'absolute', top: '10%', left: '20%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(25,211,162,0.2) 0%, transparent 60%)', filter: 'blur(60px)', zIndex: 0, y: yBg }}
        />
        <motion.div 
          className="bg-blob"
          animate={{ scale: [1, 1.5, 1], rotate: [0, -90, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          style={{ position: 'absolute', bottom: '10%', right: '10%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(25,211,162,0.15) 0%, transparent 60%)', filter: 'blur(50px)', zIndex: 0, y: yBg }}
        />
        
        <motion.div
          initial="hidden"
          animate="visible"
          style={{ zIndex: 1, opacity: opacityHero, width: '100%', padding: '0 1rem' }}
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        >
          <motion.h1 className="title" style={{ display: 'flex', justifyContent: 'center', gap: '0.1rem', flexWrap: 'wrap' }}>
            {titleText.split('').map((char, index) => (
              <motion.span 
                key={index} 
                variants={{
                  hidden: { opacity: 0, y: 50, rotateX: -90 },
                  visible: { opacity: 1, y: 0, rotateX: 0, transition: { type: "spring", damping: 12, stiffness: 200 } }
                }}
                whileHover={{ scale: 1.2, color: 'var(--accent)', rotate: Math.random() * 20 - 10 }}
                style={{ display: 'inline-block' }}
              >
                {char === ' ' ? '\u00A0' : char}
              </motion.span>
            ))}
          </motion.h1>
          <motion.p variants={textVariants} className="subtitle" style={{ letterSpacing: '4px', textTransform: 'uppercase' }}>
            Cinematographer <span style={{ color: 'var(--accent)' }}>&</span> Director
          </motion.p>
          <motion.div variants={textVariants} style={{ marginTop: '2rem' }}>
             <motion.button 
               className="hero-button"
               whileHover={{ scale: 1.05, boxShadow: "0 0 25px rgba(25,211,162,0.6)", backgroundColor: "var(--accent)" }}
               whileTap={{ scale: 0.95 }}
               style={{ padding: '16px 45px', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '3px', background: 'transparent', color: '#fff', border: '2px solid var(--accent)', borderRadius: '40px', cursor: 'pointer', transition: 'background-color 0.3s' }}
               onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
             >
               View Selected Works
             </motion.button>
          </motion.div>
          
          <motion.div 
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', color: '#aaa', cursor: 'pointer' }}
            onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
          >
            <ChevronDown size={40} />
          </motion.div>
        </motion.div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '4rem 2rem 8rem' }}>
        <motion.div 
          className="portfolio-grid"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
          }}
        >
          {videos.map((vid) => (
            <VideoCard key={vid.id} vid={vid} />
          ))}
        </motion.div>

        {videos.length === 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="portfolio-empty"
          >
            {error || 'No videos in the Drive folder yet.'}
          </motion.p>
        )}
      </main>

    </>
  );
}
