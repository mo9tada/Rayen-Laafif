'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

function VideoRow({ video }) {
  const [title, setTitle] = useState(video.title || '');
  const [description, setDescription] = useState(video.description || '');
  const [status, setStatus] = useState(null); // null | 'saving' | 'saved' | error string

  const dirty = title !== (video.title || '') || description !== (video.description || '');

  const save = async () => {
    setStatus('saving');
    try {
      const response = await fetch('/api/admin/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: video.id, title, description }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setStatus(data.error || 'Could not save.');
        return;
      }
      setStatus('saved');
      setTimeout(() => setStatus(null), 2500);
    } catch {
      setStatus('Network error.');
    }
  };

  return (
    <article className="admin-row">
      <img
        className="admin-row__thumb"
        src={video.thumb}
        alt=""
        loading="lazy"
        referrerPolicy="no-referrer"
      />

      <div className="admin-row__fields">
        <p className="admin-row__filename">
          {video.year ? `${video.year} · ` : ''}
          {video.isReel ? 'Reel' : 'Landscape'}
        </p>

        <label className="admin-field">
          <span className="admin-field__label">Title</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
        </label>

        <label className="admin-field">
          <span className="admin-field__label">Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            maxLength={5000}
            placeholder="Shown on the video's page. Blank lines start a new paragraph."
          />
        </label>

        <div className="admin-row__actions">
          <button className="admin-button" onClick={save} disabled={!dirty || status === 'saving'}>
            {status === 'saving' ? 'Saving…' : 'Save'}
          </button>

          {status === 'saved' && <span className="admin-note admin-note--ok">Saved</span>}
          {status && status !== 'saved' && status !== 'saving' && (
            <span className="admin-note admin-note--bad">{status}</span>
          )}
          <a className="admin-link" href={`/work/${video.id}`} target="_blank" rel="noreferrer">
            View page ↗
          </a>
        </div>
      </div>
    </article>
  );
}

export default function AdminDashboard({ videos = [], error = null }) {
  const router = useRouter();

  const signOut = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.replace('/adminray/login');
    router.refresh();
  };

  return (
    <main className="admin">
      <header className="admin-header">
        <div>
          <h1 className="admin-header__title">Video descriptions</h1>
          <p className="admin-header__hint">
            Videos come from the Drive folder. Text saved here appears on each video&apos;s page.
          </p>
        </div>
        <button className="admin-button admin-button--quiet" onClick={signOut}>
          Sign out
        </button>
      </header>

      {error && <p className="admin-error">{error}</p>}
      {!error && videos.length === 0 && <p className="admin-note">No videos in the Drive folder.</p>}

      <div className="admin-rows">
        {videos.map((video) => (
          <VideoRow key={video.id} video={video} />
        ))}
      </div>
    </main>
  );
}
