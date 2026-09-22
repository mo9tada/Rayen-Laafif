'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Tap-to-play video player.
 *
 * The whole frame is one big toggle: a tap starts playback, the next one stops
 * it. That is only possible because the bytes come from our own origin via
 * /api/video/[id]; a Drive iframe would be opaque to all of this.
 *
 * Mobile notes that drive the attribute choices below:
 *  - `playsInline` is not optional. Without it iOS hijacks playback into its
 *    own fullscreen view, and the tap-to-toggle surface goes with it.
 *  - `preload="metadata"` gets duration without pulling the whole file over
 *    someone's mobile data.
 *  - The poster keeps the frame from flashing black before the first tap.
 *
 * If the stream cannot be served, the component falls back to the Drive embed
 * so the video is still watchable, just without the tap controls.
 */
export default function VideoPlayer({ id, title, poster, embedUrl, isReel = false }) {
  const videoRef = useRef(null);
  const hideTimer = useRef(null);

  const [playing, setPlaying] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [chromeVisible, setChromeVisible] = useState(true);
  const [failed, setFailed] = useState(false);

  const revealChrome = useCallback(() => {
    setChromeVisible(true);
    clearTimeout(hideTimer.current);
    // Only fade the bar away while something is actually playing.
    hideTimer.current = setTimeout(() => setChromeVisible(false), 2600);
  }, []);

  useEffect(() => () => clearTimeout(hideTimer.current), []);

  const toggle = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      // play() rejects when a browser blocks it; surface that instead of
      // leaving the UI claiming it is playing.
      video.play().catch(() => setPlaying(false));
    } else {
      video.pause();
    }
    revealChrome();
  }, [revealChrome]);

  const onKeyDown = (event) => {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      toggle();
    }
  };

  const seek = (event) => {
    const video = videoRef.current;
    if (!video || !duration) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    video.currentTime = Math.min(Math.max(ratio, 0), 1) * duration;
  };

  const format = (seconds) => {
    if (!Number.isFinite(seconds)) return '0:00';
    const whole = Math.floor(seconds);
    return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
  };

  if (failed) {
    return (
      <div className={`player player--fallback ${isReel ? 'player--reel' : ''}`}>
        <iframe
          src={embedUrl}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div
      className={`player ${isReel ? 'player--reel' : ''} ${playing ? 'is-playing' : 'is-paused'}`}
      onMouseMove={revealChrome}
    >
      <video
        ref={videoRef}
        className="player__video"
        src={`/api/video/${id}`}
        poster={poster}
        playsInline
        preload="metadata"
        onClick={toggle}
        onPlay={() => { setPlaying(true); revealChrome(); }}
        onPause={() => { setPlaying(false); setChromeVisible(true); }}
        onWaiting={() => setWaiting(true)}
        onPlaying={() => setWaiting(false)}
        onDurationChange={(e) => setDuration(e.currentTarget.duration)}
        onTimeUpdate={(e) => {
          const video = e.currentTarget;
          setProgress(video.duration ? video.currentTime / video.duration : 0);
        }}
        onEnded={() => { setPlaying(false); setChromeVisible(true); }}
        onError={() => setFailed(true)}
      />

      {/* Tap surface. Sits above the video so the whole frame toggles, including
          the letterboxed areas beside a portrait clip. */}
      <button
        type="button"
        className="player__surface"
        onClick={toggle}
        onKeyDown={onKeyDown}
        aria-label={playing ? `Pause ${title}` : `Play ${title}`}
      >
        <span className={`player__badge ${playing && !waiting ? 'is-hidden' : ''}`}>
          {waiting ? (
            <span className="player__spinner" aria-hidden="true" />
          ) : (
            <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true">
              {playing ? (
                <path fill="currentColor" d="M7 5h4v14H7zM13 5h4v14h-4z" />
              ) : (
                <path fill="currentColor" d="M8 5.5v13l11-6.5z" />
              )}
            </svg>
          )}
        </span>
      </button>

      <div className={`player__chrome ${chromeVisible || !playing ? '' : 'is-hidden'}`}>
        <div
          className="player__track"
          onClick={seek}
          role="progressbar"
          aria-label="Seek"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
        >
          <div className="player__fill" style={{ width: `${progress * 100}%` }} />
        </div>

        <div className="player__meta">
          <span className="player__time">
            {format(progress * duration)} / {format(duration)}
          </span>

          <button
            type="button"
            className="player__control"
            onClick={() => {
              const video = videoRef.current;
              if (!video) return;
              video.muted = !video.muted;
              setMuted(video.muted);
            }}
            aria-label={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? 'Unmute' : 'Mute'}
          </button>

          <button
            type="button"
            className="player__control"
            onClick={() => {
              const video = videoRef.current;
              if (!video) return;
              // iPhone Safari exposes only the webkit form on the element.
              if (video.webkitEnterFullscreen) video.webkitEnterFullscreen();
              else if (video.requestFullscreen) video.requestFullscreen();
            }}
            aria-label="Fullscreen"
          >
            Fullscreen
          </button>
        </div>
      </div>
    </div>
  );
}
