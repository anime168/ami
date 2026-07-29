import { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';
import AuthScreen from './components/AuthScreen';
import HomeHero from './components/HomeHero';
import ShowGrid from './components/ShowGrid';
import WatchPage from './components/WatchPage';
import AdminEpisodeUpload from './components/AdminEpisodeUpload';
import SubscriptionModal from './components/SubscriptionModal';

type Screen = 'Home' | 'Watch' | 'Admin';

interface Profile {
  id: string;
  is_vip: boolean | null;
  vip_expires_at: string | null;
}

export default function App() {
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [screen, setScreen] = useState<Screen>('Home');
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [showSubscription, setShowSubscription] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user.id ?? null);
      setCheckingSession(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // Load (and re-load after a confirmed payment) the signed-in user's profile.
  useEffect(() => {
    if (!userId) { setProfile(null); return; }
    supabase
      .from('profiles')
      .select('id, is_vip, vip_expires_at')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => setProfile(data));
  }, [userId, showSubscription]);

  if (checkingSession) {
    return <div className="flex h-screen items-center justify-center bg-zinc-950 text-zinc-500">កំពុងផ្ទុក...</div>;
  }

  if (!userId) {
    return <AuthScreen onAuthenticated={() => { /* session listener updates userId automatically */ }} />;
  }

  // Simple top nav — swap for react-router later if the app grows more screens.
  return (
    <div className="min-h-screen bg-zinc-950">
      <nav className="flex items-center gap-4 border-b border-zinc-800 bg-zinc-950 px-5 py-3 text-sm text-white">
        <button onClick={() => setScreen('Home')} className={screen === 'Home' ? 'font-bold text-emerald-400' : 'text-zinc-400'}>ទំព័រដើម</button>
        <button onClick={() => setScreen('Admin')} className={screen === 'Admin' ? 'font-bold text-emerald-400' : 'text-zinc-400'}>Admin</button>
        <button
          onClick={() => setShowSubscription(true)}
          className={`ml-auto rounded-full px-3 py-1 text-xs font-bold ${
            profile?.is_vip ? 'bg-amber-500 text-black' : 'bg-emerald-500 text-black'
          }`}
        >
          {profile?.is_vip ? 'VIP ✓' : 'ទិញ VIP'}
        </button>
        <button onClick={() => supabase.auth.signOut()} className="text-zinc-500">ចាកចេញ</button>
      </nav>

      {screen === 'Home' && (
        <>
          <HomeHero />
          <ShowGrid title="ភាគថ្មីៗ" />
        </>
      )}

      {screen === 'Watch' && activeSlug && (
        <WatchPage slug={activeSlug} userId={userId} />
      )}

      {screen === 'Admin' && <AdminEpisodeUpload />}

      {showSubscription && (
        <SubscriptionModal
          lang="KH"
          profile={profile ?? {}}
          onClose={() => setShowSubscription(false)}
          onOpenTelegram={() => window.open('https://t.me/YOUR_SUPPORT_USERNAME', '_blank')}
        />
      )}
    </div>
  );
}

// Note: ShowGrid links to /watch/:slug via <a href>. If you're not using
// react-router yet, swap those <a> tags for onClick={() => { setActiveSlug(slug); setScreen('Watch'); }}
// so navigation stays inside this single-page screen switch.
