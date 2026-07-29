import { useState } from 'react';
import { Star } from 'lucide-react';
import { useShowDetail } from '../hooks/useShowDetail';
import VideoPlayer from './VideoPlayer';

interface Props {
  slug: string;
  userId?: string; // pass signed-in user id for progress saving
}

export default function WatchPage({ slug, userId }: Props) {
  const { show, loading, error } = useShowDetail(slug);
  const [activeEpisodeId, setActiveEpisodeId] = useState<string | null>(null);

  if (loading) return <div className="flex h-64 items-center justify-center bg-zinc-950 text-zinc-500">កំពុងផ្ទុក...</div>;
  if (error || !show) return <div className="flex h-64 items-center justify-center bg-zinc-950 text-zinc-500">{error ?? 'រកមិនឃើញរឿងនេះទេ'}</div>;

  const activeEpisode = show.episodes.find((e) => e.id === activeEpisodeId) ?? show.episodes[0];

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {activeEpisode ? (
        <VideoPlayer
          videoUrl={activeEpisode.video_url}
          episodeId={activeEpisode.id}
          userId={userId}
          posterUrl={activeEpisode.thumbnail_url ?? show.cover_image_url}
        />
      ) : (
        <div className="flex aspect-video items-center justify-center bg-zinc-900 text-zinc-500">
          មិនទាន់មានភាគនៅឡើយទេ
        </div>
      )}

      {/* Show info */}
      <div className="px-5 py-4 sm:px-10">
        <h1 className="text-2xl font-black">{show.title_kh ?? show.title_en}</h1>
        <p className="text-sm text-zinc-400">{show.title_en}</p>
        <div className="mt-2 flex items-center gap-2 text-sm text-zinc-300">
          <Star className="h-4 w-4 fill-emerald-400 text-emerald-400" />
          <span className="font-semibold">{Number(show.rating ?? 0).toFixed(1)}</span>
          <span className="text-zinc-500">·</span>
          <span>{show.release_year ?? '—'}</span>
          <span className="text-zinc-500">·</span>
          <span>{show.status === 'completed' ? 'ចប់សព្វគ្រប់' : 'កំពុងបញ្ចាំង'}</span>
        </div>
        {show.description_kh && (
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-300">{show.description_kh}</p>
        )}
      </div>

      {/* Episode list */}
      <div className="px-5 pb-10 sm:px-10">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
          <span className="h-5 w-1 rounded bg-emerald-400" />
          បញ្ជីភាគ ({show.episodes.length})
        </h2>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
          {show.episodes.map((ep) => (
            <button
              key={ep.id}
              onClick={() => setActiveEpisodeId(ep.id)}
              className={`rounded-lg py-2 text-sm font-semibold transition-colors ${
                ep.id === activeEpisode?.id
                  ? 'bg-emerald-500 text-black'
                  : ep.is_vip
                  ? 'bg-amber-900/40 text-amber-300'
                  : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
              }`}
            >
              {ep.episode_number}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
