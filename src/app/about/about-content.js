'use client';
import { motion, useScroll, useTransform } from 'framer-motion';

export default function AboutContent({ skills = [] }) {
  const { scrollY } = useScroll();
  const imgY = useTransform(scrollY, [0, 500], [0, -100]);

  return (
    <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '10rem 2rem 4rem' }}>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <h1 className="title" style={{ marginBottom: '4rem', textAlign: 'center' }}>About Me</h1>
        
        <div className="about-flex" style={{ display: 'flex', gap: '4rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <motion.div 
            className="about-item"
            style={{ flex: '1 1 400px', perspective: 1000 }}
            initial={{ opacity: 0, rotateY: 30, x: -50 }}
            animate={{ opacity: 1, rotateY: 0, x: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
          >
            <motion.img
              src="/rayen-laafif.png"
              alt="Rayen Laafif seated with a camera"
              style={{
                width: '100%',
                display: 'block',
                // The portrait is taller than it is wide; cap it so it does not
                // outrun the text column beside it.
                maxHeight: '620px',
                objectFit: 'cover',
                objectPosition: 'center top',
                borderRadius: '20px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                y: imgY,
              }}
              whileHover={{ scale: 1.02, rotateZ: 2 }}
              transition={{ type: 'spring', stiffness: 200 }}
            />
          </motion.div>

          <motion.div 
            className="about-item about-text"
            style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <motion.h2 
              style={{ fontSize: '2.5rem', color: 'var(--accent)', textShadow: '0 0 20px rgba(25,211,162,0.4)' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            >
              The Visionary Director
            </motion.h2>
            <p style={{ fontSize: '1.1rem', color: '#ccc', lineHeight: 1.8 }}>
              Crafting cinematic experiences using state-of-the-art camera techniques and professional workflows. I focus on capturing raw emotions dynamically, turning fleeting moments into eternal memories.
            </p>
            
            <h3 style={{ fontSize: '1.2rem', marginTop: '1rem' }}>Core Skills</h3>
            <div className="core-skills" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem' }}>
              {skills.map((skill, index) => (
                <motion.span 
                  key={index}
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.1, backgroundColor: 'rgba(25,211,162,0.4)', y: -5 }}
                  transition={{ type: "spring", stiffness: 300, delay: index * 0.05 }}
                  style={{ 
                    padding: '8px 16px', 
                    background: 'rgba(25,211,162,0.1)', 
                    border: '1px solid rgba(25,211,162,0.3)', 
                    borderRadius: '30px',
                    fontSize: '0.9rem',
                    color: '#fff',
                    cursor: 'default',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
                  }}
                >
                  {skill}
                </motion.span>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </main>
  );
}