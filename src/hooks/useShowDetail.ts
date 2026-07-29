import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface Episode {
  id: string;
  episode_number: number;
  title_en: string | null;
  title_kh: string | null;
  video_url: string;
  thumbnail_url: string | null;
  is_vip: boolean;
}

export interface ShowDetail {
  id: string;
  title_en: string;
  title_kh: string | null;
  description_en: string | null;
  description_kh: string | null;
  slug: string;
  status: 'ongoing' | 'completed';
  rating: number;
  release_year: number | null;
  cover_image_url: string | null;
  is_vip: boolean;
  episodes: Episode[];
}

export function useShowDetail(slug: string | undefined) {
  const [show, setShow] = useState<ShowDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;

    async function load() {
      setLoading(true);

      const { data: showRow, error: showErr } = await supabase
        .from('shows')
        .select('id, title_en, title_kh, description_en, description_kh, slug, status, rating, release_year, cover_image_url, is_vip')
        .eq('slug', slug)
        .maybeSingle();

      if (showErr || !showRow) {
        if (!cancelled) { setError(showErr?.message ?? 'រកមិនឃើញរឿងនេះទេ'); setLoading(false); }
        return;
      }

      const { data: episodeRows } = await supabase
        .from('episodes')
        .select('id, episode_number, title_en, title_kh, video_url, thumbnail_url, is_vip')
        .eq('show_id', showRow.id)
        .order('episode_number', { ascending: true });

      if (!cancelled) {
        setShow({ ...showRow, episodes: episodeRows ?? [] });
        setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [slug]);

  return { show, loading, error };
}
