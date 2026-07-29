import { useState } from 'react';
import { useGenres } from '../hooks/useGenres';
import { useShowsList } from '../hooks/useShowsList';

const FALLBACK_GRADIENTS = [
  'from-rose-900 via-red-800 to-orange-700',
  'from-slate-900 via-indigo-900 to-purple-800',
  'from-emerald-950 via-teal-800 to-cyan-700',
  'from-zinc-900 via-stone-800 to-amber-800',
];

export default function ShowGrid({ title = 'ភាគថ្មីៗ' }: { title?: string }) {
  const genres = useGenres();
  const [activeGenre, setActiveGenre] = useState<string | undefined>(undefined);
  const [activeStatus, setActiveStatus] = useState<'all' | 'ongoing' | 'completed'>('all');
  const { shows, loading } = useShowsList({ genreSlug: activeGenre, status: activeStatus }, 24);

  return (
    <section className="bg-zinc-950 px-5 py-6 text-white sm:px-10">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <span className="h-5 w-1 rounded bg-emerald-400" />
          {title}
        </h2>
      </div>

      {/* Genre chips */}
      <div className="mb-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          onClick={() => setActiveGenre(undefined)}
          className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium ${
            !activeGenre ? 'bg-emerald-500 text-black' : 'bg-zinc-800 text-zinc-300'
          }`}
        >
          ទាំងអស់
        </button>
        {genres.map((g) => (
          <button
            key={g.id}
            onClick={() => setActiveGenre(g.slug)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium ${
              activeGenre === g.slug ? 'bg-emerald-500 text-black' : 'bg-zinc-800 text-zinc-300'
            }`}
          >
            {g.name_kh ?? g.name_en}
          </button>
        ))}
      </div>

      {/* Status tabs */}
      <div className="mb-5 flex gap-4 border-b border-zinc-800 text-sm">
        {(['all', 'ongoing', 'completed'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setActiveStatus(s)}
            className={`-mb-px border-b-2 pb-2 font-medium ${
              activeStatus === s ? 'border-emerald-400 text-emerald-400' : 'border-transparent text-zinc-500'
            }`}
          >
            {s === 'all' ? 'ទាំងអស់' : s === 'ongoing' ? 'កំពុងបញ្ចាំង' : 'ចប់សព្វគ្រប់'}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <p className="text-zinc-500">កំពុងផ្ទុក...</p>
      ) : shows.length === 0 ? (
        <p className="text-zinc-500">មិនមានរឿងសម្រាប់ប្រភេទនេះទេ</p>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {shows.map((s, i) => (
            <a key={s.id} href={`/watch/${s.slug}`} className="group block">
              <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-zinc-800">
                {s.cover_image_url ? (
                  <img
                    src={s.cover_image_url}
                    alt={s.title_en}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className={`h-full w-full bg-gradient-to-br ${FALLBACK_GRADIENTS[i % FALLBACK_GRADIENTS.length]}`} />
                )}

                <span className="absolute right-1 top-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-amber-400">
                  ★ {Number(s.rating ?? 0).toFixed(1)}
                </span>
                <span className="absolute bottom-1 left-1 rounded bg-emerald-500/90 px-1.5 py-0.5 text-[10px] font-bold text-black">
                  EP {s.latest_episode}
                </span>
                {s.is_vip && (
                  <span className="absolute left-1 top-1 rounded bg-amber-500/90 px-1.5 py-0.5 text-[10px] font-bold text-black">
                    VIP
                  </span>
                )}
              </div>
              <p className="mt-1.5 truncate text-sm font-medium">{s.title_kh ?? s.title_en}</p>
              <p className="text-xs text-zinc-500">{s.release_year ?? '—'}</p>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
