import { useState } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { useFeaturedShows, type DbShow } from '../hooks/useFeaturedShows';

// Fallback gradients only used while an image hasn't loaded yet / has none set,
// so the carousel never shows a blank card.
const FALLBACK_GRADIENTS = [
  'from-rose-900 via-red-800 to-orange-700',
  'from-slate-900 via-indigo-900 to-purple-800',
  'from-emerald-950 via-teal-800 to-cyan-700',
  'from-zinc-900 via-stone-800 to-amber-800',
];

export default function HomeHero({ shows: showsProp }: { shows?: DbShow[] }) {
  const { shows: fetchedShows, loading, error } = useFeaturedShows(8);
  const shows = showsProp ?? fetchedShows;
  const [active, setActive] = useState(0);

  if (loading) {
    return <div className="flex h-72 items-center justify-center bg-zinc-950 text-zinc-500">កំពុងផ្ទុក...</div>;
  }
  if (error || shows.length === 0) {
    return <div className="flex h-72 items-center justify-center bg-zinc-950 text-zinc-500">មិនមានរឿង featured ទេ</div>;
  }

  const show = shows[active];
  const fallback = FALLBACK_GRADIENTS[active % FALLBACK_GRADIENTS.length];
  const go = (dir: -1 | 1) => setActive((prev) => (prev + dir + shows.length) % shows.length);

  return (
    <section className="relative w-full overflow-hidden bg-zinc-950 text-white">
      {/* Silhouette bleed — the active poster, blown up and blurred, fading into black */}
      <div className="absolute inset-0">
        {show.banner_image_url ? (
          <img
            key={show.id}
            src={show.banner_image_url}
            alt=""
            className="absolute -inset-x-10 -inset-y-16 h-[130%] w-[120%] scale-110 object-cover opacity-50 blur-2xl transition-all duration-700"
          />
        ) : (
          <div key={show.id} className={`absolute -inset-x-10 -inset-y-16 bg-gradient-to-br ${fallback} opacity-40 blur-3xl scale-110 transition-all duration-700`} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-zinc-950/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/90 via-zinc-950/20 to-transparent" />
      </div>

      {/* Foreground content */}
      <div className="relative z-10 px-5 pt-8 pb-4 sm:px-10 sm:pt-14">
        <span className="inline-block rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-xs font-semibold tracking-wide text-emerald-300">
          {show.status === 'completed' ? 'ចប់សព្វគ្រប់' : 'កំពុងបញ្ចាំង'} · EP {show.latest_episode}
          {show.status === 'ongoing' && show.total_episodes ? ` / ${show.total_episodes}` : ''}
        </span>

        <h1 className="mt-3 max-w-md text-3xl font-black leading-tight tracking-tight sm:text-5xl">
          {show.title_kh ?? show.title_en}
        </h1>
        <p className="mt-1 max-w-md text-sm text-zinc-400 sm:text-base">{show.title_en}</p>

        <div className="mt-3 flex items-center gap-2 text-sm text-zinc-300">
          <Star className="h-4 w-4 fill-emerald-400 text-emerald-400" />
          <span className="font-semibold">{Number(show.rating ?? 0).toFixed(1)}</span>
          <span className="text-zinc-500">·</span>
          <span>{show.release_year ?? '—'}</span>
          {show.is_vip && (
            <span className="ml-1 rounded bg-amber-500/90 px-1.5 py-0.5 text-[10px] font-bold text-black">VIP</span>
          )}
        </div>
      </div>

      {/* Poster carousel — 4 to 10 shows, scroll / arrow navigable */}
      <div className="relative z-10 flex items-center gap-2 px-5 pb-8 sm:px-10">
        <button onClick={() => go(-1)} aria-label="មុន" className="hidden shrink-0 rounded-full border border-white/10 bg-black/40 p-2 backdrop-blur hover:bg-black/60 sm:flex">
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="flex gap-3 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {shows.map((s, i) => {
            const cardFallback = FALLBACK_GRADIENTS[i % FALLBACK_GRADIENTS.length];
            return (
              <button
                key={s.id}
                onClick={() => setActive(i)}
                className={`relative aspect-[2/3] w-24 shrink-0 overflow-hidden rounded-lg transition-all duration-300 sm:w-28 ${
                  i === active ? 'scale-105 ring-2 ring-emerald-400' : 'opacity-60 hover:opacity-90'
                }`}
              >
                {s.cover_image_url ? (
                  <img src={s.cover_image_url} alt={s.title_en} className="h-full w-full object-cover" />
                ) : (
                  <div className={`h-full w-full bg-gradient-to-br ${cardFallback}`} />
                )}
                {i === active && (
                  <span className="absolute bottom-1 left-1 right-1 truncate rounded bg-emerald-500/90 px-1.5 py-0.5 text-[10px] font-bold text-black">
                    {s.status === 'completed' ? 'ចប់' : 'កំពុងបញ្ចាំង'}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <button onClick={() => go(1)} aria-label="បន្ទាប់" className="hidden shrink-0 rounded-full border border-white/10 bg-black/40 p-2 backdrop-blur hover:bg-black/60 sm:flex">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </section>
  );
}
