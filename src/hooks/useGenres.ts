import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface Genre {
  id: string;
  name_en: string;
  name_kh: string | null;
  slug: string;
}

export function useGenres() {
  const [genres, setGenres] = useState<Genre[]>([]);

  useEffect(() => {
    supabase
      .from('genres')
      .select('id, name_en, name_kh, slug')
      .order('name_en')
      .then(({ data }) => setGenres(data ?? []));
  }, []);

  return genres;
}
