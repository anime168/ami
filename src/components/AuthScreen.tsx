import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const phoneToEmail = (digits: string) => `${digits}@animeapp.app`;
const toE164Digits = (input: string) => {
  const digits = input.replace(/\D/g, '');
  return digits.startsWith('0') ? digits.substring(1) : digits;
};

interface Props {
  onAuthenticated: () => void;
}

export default function AuthScreen({ onAuthenticated }: Props) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async () => {
    setBusy(true);
    setError('');
    const { error: err } = await supabase.auth.signInWithPassword({
      email: phoneToEmail(toE164Digits(phone)),
      password,
    });
    setBusy(false);
    if (err) { setError(err.message); return; }
    onAuthenticated();
  };

  const handleSignUp = async () => {
    setBusy(true);
    setError('');
    const email = phoneToEmail(toE164Digits(phone));
    const { data, error: err } = await supabase.auth.signUp({ email, password });
    if (err || !data.user) { setBusy(false); setError(err?.message ?? 'Sign up failed'); return; }

    const { error: profileErr } = await supabase.from('profiles').insert({
      id: data.user.id,
      username,
      is_vip: false, // no free trial — VIP starts false, unlocked only after subscribing
    });
    setBusy(false);
    if (profileErr) { setError(profileErr.message); return; }
    onAuthenticated();
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-zinc-950 px-6 text-white">
      <h1 className="mb-1 text-2xl font-black">{mode === 'signin' ? 'ចូលប្រើ' : 'ចុះឈ្មោះ'}</h1>
      <p className="mb-6 text-sm text-zinc-400">មើលអានីមេចិន ជាភាសាខ្មែរ</p>

      {mode === 'signup' && (
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="ឈ្មោះអ្នកប្រើ"
          className="mb-3 rounded-lg border border-zinc-700 bg-zinc-900 p-3"
        />
      )}
      <input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="លេខទូរស័ព្ទ"
        className="mb-3 rounded-lg border border-zinc-700 bg-zinc-900 p-3"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="លេខសម្ងាត់"
        className="mb-4 rounded-lg border border-zinc-700 bg-zinc-900 p-3"
      />

      {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

      <button
        onClick={mode === 'signin' ? handleSignIn : handleSignUp}
        disabled={busy}
        className="rounded-lg bg-emerald-500 py-3 font-bold text-black disabled:opacity-50"
      >
        {busy ? '...' : mode === 'signin' ? 'ចូលប្រើ' : 'ចុះឈ្មោះ'}
      </button>

      <button
        onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
        className="mt-4 text-sm text-emerald-400"
      >
        {mode === 'signin' ? 'មិនទាន់មានគណនី? ចុះឈ្មោះ' : 'មានគណនីរួចហើយ? ចូលប្រើ'}
      </button>
    </div>
  );
}
