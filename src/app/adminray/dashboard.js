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

function SkillsEditor({ initialSkills }) {
  const [skills, setSkills] = useState(initialSkills);
  const [draft, setDraft] = useState('');
  const [status, setStatus] = useState(null);

  const dirty = JSON.stringify(skills) !== JSON.stringify(initialSkills);

  const add = () => {
    const skill = draft.trim();
    if (!skill) return;
    // Case-insensitive, matching how the store deduplicates on save.
    if (skills.some((s) => s.toLowerCase() === skill.toLowerCase())) {
      setStatus('That skill is already listed.');
      return;
    }
    setSkills([...skills, skill]);
    setDraft('');
    setStatus(null);
  };

  const update = (index, value) =>
    setSkills(skills.map((s, i) => (i === index ? value : s)));

  const remove = (index) => setSkills(skills.filter((_, i) => i !== index));

  const move = (index, delta) => {
    const target = index + delta;
    if (target < 0 || target >= skills.length) return;
    const next = [...skills];
    [next[index], next[target]] = [next[target], next[index]];
    setSkills(next);
  };

  const save = async () => {
    setStatus('saving');
    try {
      const response = await fetch('/api/admin/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skills }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setStatus(data.error || 'Could not save.');
        return;
      }
      // Adopt the cleaned list the server actually stored.
      setSkills(data.skills);
      setStatus('saved');
      setTimeout(() => setStatus(null), 2500);
    } catch {
      setStatus('Network error.');
    }
  };

  return (
    <section className="admin-skills">
      <h2 className="admin-section__title">Skills</h2>
      <p className="admin-section__hint">Shown on the About page, in this order.</p>

      <ul className="admin-skills__list">
        {skills.map((skill, index) => (
          <li key={index} className="admin-skills__item">
            <input
              value={skill}
              onChange={(e) => update(index, e.target.value)}
              maxLength={60}
              aria-label={`Skill ${index + 1}`}
            />
            <button
              className="admin-icon"
              onClick={() => move(index, -1)}
              disabled={index === 0}
              aria-label="Move up"
              title="Move up"
            >
              ↑
            </button>
            <button
              className="admin-icon"
              onClick={() => move(index, 1)}
              disabled={index === skills.length - 1}
              aria-label="Move down"
              title="Move down"
            >
              ↓
            </button>
            <button
              className="admin-icon admin-icon--danger"
              onClick={() => remove(index)}
              aria-label={`Remove ${skill}`}
              title="Remove"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      {skills.length === 0 && (
        <p className="admin-note">No skills listed. The About page will omit the section.</p>
      )}

      <div className="admin-skills__add">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Add a skill"
          maxLength={60}
          aria-label="New skill"
        />
        <button className="admin-button admin-button--quiet" onClick={add} disabled={!draft.trim()}>
          Add
        </button>
      </div>

      <div className="admin-row__actions">
        <button className="admin-button" onClick={save} disabled={!dirty || status === 'saving'}>
          {status === 'saving' ? 'Saving…' : 'Save skills'}
        </button>
        {status === 'saved' && <span className="admin-note admin-note--ok">Saved</span>}
        {status && status !== 'saved' && status !== 'saving' && (
          <span className="admin-note admin-note--bad">{status}</span>
        )}
      </div>
    </section>
  );
}

export default function AdminDashboard({ videos = [], skills = [], error = null }) {
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

      <SkillsEditor initialSkills={skills} />

      <h2 className="admin-section__title admin-section__title--spaced">Videos</h2>

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
