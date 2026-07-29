import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

interface ShowOption {
  id: string;
  title_en: string;
}

export default function AdminEpisodeUpload() {
  const [shows, setShows] = useState<ShowOption[]>([]);
  const [selectedShowId, setSelectedShowId] = useState('');
  const [episodeNumber, setEpisodeNumber] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [titleKh, setTitleKh] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [isVip, setIsVip] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  useEffect(() => {
    supabase
      .from('shows')
      .select('id, title_en')
      .order('title_en')
      .then(({ data }) => setShows(data ?? []));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      if (!selectedShowId) throw new Error('សូមជ្រើសរើសរឿងជាមុនសិន');
      if (!videoUrl) throw new Error('សូមដាក់ link វីដេអូ (ពី Bunny Stream)');

      // Upload thumbnail to Supabase Storage, if one was chosen.
      let thumbnailUrl: string | null = null;
      if (thumbnailFile) {
        const path = `episode-thumbs/${selectedShowId}-ep${episodeNumber}-${Date.now()}`;
        const { error: uploadErr } = await supabase.storage
          .from('images')
          .upload(path, thumbnailFile);
        if (uploadErr) throw uploadErr;

        const { data: publicUrl } = supabase.storage.from('images').getPublicUrl(path);
        thumbnailUrl = publicUrl.publicUrl;
      }

      const { error: insertErr } = await supabase.from('episodes').insert({
        show_id: selectedShowId,
        episode_number: Number(episodeNumber),
        title_en: titleEn || null,
        title_kh: titleKh || null,
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
        is_vip: isVip,
      });
      if (insertErr) throw insertErr;

      setMessage({ type: 'ok', text: `បានបញ្ចូលភាគ ${episodeNumber} ដោយជោគជ័យ` });
      setEpisodeNumber('');
      setTitleEn('');
      setTitleKh('');
      setVideoUrl('');
      setThumbnailFile(null);
      setIsVip(false);
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'មានបញ្ហា' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg bg-zinc-950 p-6 text-white">
      <h2 className="text-xl font-bold">បញ្ចូលភាគថ្មី</h2>
      <p className="mt-1 text-sm text-zinc-400">
        ជាមុនសិន upload វីដេអូឡើង Bunny Stream (ឬ CDN ដែលបានជ្រើសរើស) រួច paste link ចូលទីនេះ។
      </p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <label className="block text-sm text-zinc-300">រឿង</label>
          <select
            value={selectedShowId}
            onChange={(e) => setSelectedShowId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 p-2.5"
          >
            <option value="">-- ជ្រើសរើសរឿង --</option>
            {shows.map((s) => (
              <option key={s.id} value={s.id}>{s.title_en}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm text-zinc-300">លេខភាគ</label>
            <input
              type="number"
              value={episodeNumber}
              onChange={(e) => setEpisodeNumber(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 p-2.5"
              required
            />
          </div>
          <label className="mt-6 flex items-center gap-2 text-sm text-zinc-300">
            <input type="checkbox" checked={isVip} onChange={(e) => setIsVip(e.target.checked)} />
            VIP តែប៉ុណ្ណោះ
          </label>
        </div>

        <div>
          <label className="block text-sm text-zinc-300">ចំណងជើងភាគ (EN)</label>
          <input
            value={titleEn}
            onChange={(e) => setTitleEn(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 p-2.5"
          />
        </div>

        <div>
          <label className="block text-sm text-zinc-300">ចំណងជើងភាគ (ខ្មែរ)</label>
          <input
            value={titleKh}
            onChange={(e) => setTitleKh(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 p-2.5"
          />
        </div>

        <div>
          <label className="block text-sm text-zinc-300">Video URL (Bunny Stream / CDN)</label>
          <input
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://vz-xxxx.b-cdn.net/xxxx/playlist.m3u8"
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 p-2.5"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-zinc-300">រូបភាព Thumbnail</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setThumbnailFile(e.target.files?.[0] ?? null)}
            className="mt-1 w-full text-sm text-zinc-400"
          />
        </div>

        {message && (
          <p className={message.type === 'ok' ? 'text-emerald-400' : 'text-red-400'}>{message.text}</p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-emerald-500 py-2.5 font-semibold text-black disabled:opacity-50"
        >
          {saving ? 'កំពុងរក្សាទុក...' : 'បញ្ចូលភាគ'}
        </button>
      </form>
    </div>
  );
}
