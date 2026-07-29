import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

interface Props {
  videoUrl: string;
  episodeId: string;
  userId?: string;         // pass the signed-in user's id to enable progress saving
  posterUrl?: string | null;
}

export default function VideoPlayer({ videoUrl, episodeId, userId, posterUrl }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Wire up HLS playback for .m3u8 sources (Bunny Stream, Cloudflare Stream, etc).
  // Safari plays HLS natively; every other browser needs hls.js.
  // Run: npm install hls.js
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl.endsWith('.m3u8')) return;

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = videoUrl;
      return;
    }

    let hls: import('hls.js').default | undefined;
    import('hls.js').then(({ default: Hls }) => {
      if (Hls.isSupported()) {
        hls = new Hls();
        hls.loadSource(videoUrl);
        hls.attachMedia(video);
      }
    });

    return () => hls?.destroy();
  }, [videoUrl]);

  // Save watch progress every ~10s so "Continue Watching" can resume later.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !userId) return;

    const interval = setInterval(() => {
      if (video.paused) return;
      supabase.from('watch_history').upsert({
        user_id: userId,
        episode_id: episodeId,
        progress_seconds: Math.floor(video.currentTime),
        completed: video.currentTime > video.duration * 0.9,
        last_watched_at: new Date().toISOString(),
      });
    }, 10_000);

    return () => clearInterval(interval);
  }, [episodeId, userId]);

  return (
    <video
      ref={videoRef}
      controls
      poster={posterUrl ?? undefined}
      className="aspect-video w-full rounded-lg bg-black"
      src={videoUrl.endsWith('.m3u8') ? undefined : videoUrl}
    />
  );
}
