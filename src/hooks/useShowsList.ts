import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface ShowCardData {
  id: string;
  title_en: string;
  title_kh: string | null;
  slug: string;
  status: 'ongoing' | 'completed';
  rating: number;
  release_year: number | null;
  cover_image_url: string | null;
  is_vip: boolean;
  latest_episode: number;
}

interface Filters {
  genreSlug?: string;       // undefined = all genres
  status?: 'all' | 'ongoing' | 'completed';
}

export function useShowsList({ genreSlug, status = 'all' }: Filters, limit = 24) {
  const [shows, setShows] = useState<ShowCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);

      let showIds: string[] | null = null;

      // If a genre is selected, first resolve which show_ids belong to it.
      if (genreSlug) {
        const { data: genreRow } = await supabase
          .from('genres')
          .select('id')
          .eq('slug', genreSlug)
          .maybeSingle();

        if (!genreRow) {
          if (!cancelled) { setShows([]); setLoading(false); }
          return;
        }

        const { data: links } = await supabase
          .from('show_genres')
          .select('show_id')
          .eq('genre_id', genreRow.id);

        showIds = (links ?? []).map((l) => l.show_id);
        if (showIds.length === 0) {
          if (!cancelled) { setShows([]); setLoading(false); }
          return;
        }
      }

      let query = supabase
        .from('shows')
        .select('id, title_en, title_kh, slug, status, rating, release_year, cover_image_url, is_vip, total_episodes')
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (status !== 'all') query = query.eq('status', status);
      if (showIds) query = query.in('id', showIds);

      const { data: showRows, error } = await query;
      if (error || !showRows) {
        if (!cancelled) { setShows([]); setLoading(false); }
        return;
      }

      const withEpisodeCounts = await Promise.all(
        showRows.map(async (show) => {
          const { data: epRow } = await supabase
            .from('episodes')
            .select('episode_number')
            .eq('show_id', show.id)
            .order('episode_number', { ascending: false })
            .limit(1)
            .maybeSingle();

          return { ...show, latest_episode: epRow?.episode_number ?? 0 } as ShowCardData;
        })
      );

      if (!cancelled) {
        setShows(withEpisodeCounts);
        setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [genreSlug, status, limit]);

  return { shows, loading };
}
