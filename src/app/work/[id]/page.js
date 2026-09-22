import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getVideos, getVideo, getRelatedVideos } from '@/lib/videos.js';

export const revalidate = 60;

/** Pre-render a page per video; new Drive files are rendered on first request. */
export async function generateStaticParams() {
  const { videos } = await getVideos();
  return videos.map((video) => ({ id: video.id }));
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const video = await getVideo(id);
  if (!video) return { title: 'Not found' };

  return {
    title: `${video.title} — Rayen Laafif`,
    description: video.description?.slice(0, 160) || undefined,
  };
}

export default async function WorkPage({ params }) {
  const { id } = await params;
  const video = await getVideo(id);

  if (!video) notFound();

  const related = await getRelatedVideos(id);

  return (
    <main className="work">
      <Link href="/" className="work__back">
        ← All work
      </Link>

      <div className={`work__player ${video.isReel ? 'work__player--reel' : ''}`}>
        <iframe
          src={video.videoUrl}
          title={video.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      <header className="work__header">
        <h1 className="work__title">{video.title}</h1>
        {video.year && <p className="work__year">{video.year}</p>}
      </header>

      {video.description ? (
        // Preserve the paragraph breaks typed in the dashboard.
        <div className="work__description">
          {video.description.split(/\n{2,}/).map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      ) : null}

      {related.length > 0 && (
        <section className="related">
          <h2 className="related__heading">You may also like</h2>

          <div className="related__grid">
            {related.map((other) => (
              <Link key={other.id} href={`/work/${other.id}`} className="related__card">
                <img
                  className="related__thumb"
                  src={other.thumb}
                  alt=""
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
                <h3 className="related__title">{other.title}</h3>
                {other.year && <p className="related__year">{other.year}</p>}
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
