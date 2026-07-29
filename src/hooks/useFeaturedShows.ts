import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface DbShow {
  id: string;
  title_en: string;
  title_kh: string | null;
  slug: string;
  status: 'ongoing' | 'completed';
  rating: number;
  release_year: number | null;
  cover_image_url: string | null;
  banner_image_url: string | null;
  is_vip: boolean;
  // Latest published episode number, joined separately below.
  latest_episode: number;
  total_episodes: number;
}

export function useFeaturedShows(limit = 8) {
  const [shows, setShows] = useState<DbShow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);

      // Featured shows, newest first.
      const { data: showRows, error: showErr } = await supabase
        .from('shows')
        .select('id, title_en, title_kh, slug, status, rating, release_year, cover_image_url, banner_image_url, is_vip, total_episodes')
        .eq('is_featured', true)
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (showErr) {
        if (!cancelled) { setError(showErr.message); setLoading(false); }
        return;
      }

      // For each show, find the highest published episode number so the
      // hero badge can show "EP 12 / 24" accurately.
      const withEpisodeCounts = await Promise.all(
        (showRows ?? []).map(async (show) => {
          const { data: epRow } = await supabase
            .from('episodes')
            .select('episode_number')
            .eq('show_id', show.id)
            .order('episode_number', { ascending: false })
            .limit(1)
            .maybeSingle();

          return { ...show, latest_episode: epRow?.episode_number ?? 0 } as DbShow;
        })
      );

      if (!cancelled) {
        setShows(withEpisodeCounts);
        setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [limit]);

  return { shows, loading, error };
}
