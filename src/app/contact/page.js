'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, CheckCircle } from 'lucide-react';

export default function Contact() {
  const [isHovering, setIsHovering] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSent(true);
    setTimeout(() => setIsSent(false), 3000);
  };

  return (
    <main style={{ maxWidth: '800px', margin: '0 auto', padding: '10rem 2rem 4rem' }}>
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="glass"
        style={{ padding: '4rem 2rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}
      >
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          style={{ position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', background: 'conic-gradient(from 0deg, transparent, rgba(25,211,162,0.1), transparent)', zIndex: -1 }}
        />

        <h1 className="title" style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>Let's Work Together</h1>
        <p style={{ color: '#aaa', fontSize: '1.2rem', marginBottom: '3rem' }}>
          Have a project in mind? Reach out and let's create something beautiful.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '500px', margin: '0 auto', zIndex: 1, position: 'relative' }}>
          <motion.input 
            whileFocus={{ scale: 1.02, borderColor: 'var(--accent)', boxShadow: '0 0 15px rgba(25,211,162,0.3)' }}
            type="text" 
            placeholder="Your Name" 
            required
            style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '1rem', outline: 'none', transition: 'box-shadow 0.3s' }} 
          />
          <motion.input 
            whileFocus={{ scale: 1.02, borderColor: 'var(--accent)', boxShadow: '0 0 15px rgba(25,211,162,0.3)' }}
            type="email" 
            placeholder="Your Email"
            required 
            style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '1rem', outline: 'none', transition: 'box-shadow 0.3s' }} 
          />
          <motion.textarea 
            whileFocus={{ scale: 1.02, borderColor: 'var(--accent)', boxShadow: '0 0 15px rgba(25,211,162,0.3)' }}
            placeholder="Tell me about your project..." 
            rows="5"
            required
            style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '1rem', resize: 'none', outline: 'none', transition: 'box-shadow 0.3s' }} 
          />
          <motion.button 
            type="submit"
            onHoverStart={() => setIsHovering(true)}
            onHoverEnd={() => setIsHovering(false)}
            whileHover={{ scale: 1.05, boxShadow: '0 0 25px rgba(25,211,162,0.6)' }}
            whileTap={{ scale: 0.95 }}
            style={{ 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '1rem 2rem', 
              background: isSent ? '#10B981' : 'var(--accent)', 
              color: '#fff', 
              border: 'none', 
              borderRadius: '30px',
              fontSize: '1.2rem',
              cursor: 'pointer',
              fontWeight: 'bold',
              marginTop: '1rem',
              transition: 'background 0.3s'
            }}
          >
            <AnimatePresence mode="wait">
              {isSent ? (
                <motion.div key="sent" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CheckCircle /> Sent Successfully!
                </motion.div>
              ) : (
                <motion.div key="send" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <motion.div animate={isHovering ? { x: 5, y: -5 } : { x: 0, y: 0 }} transition={{ type: "spring" }}>
                    <Send size={20} />
                  </motion.div>
                  Send Message
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </form>
      </motion.div>
    </main>
  );
}