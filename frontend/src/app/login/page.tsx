'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/stores/auth';
import { Button, Input } from '@/components/ui';

export default function LoginPage() {
  const { login, register } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ name: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function go(user: any) {
    const dest = user.role === 'ADMIN' ? '/admin' : user.role === 'DRIVER' ? '/repartidor' : '/cliente';
    router.replace(dest);
  }

  async function submit() {
    setError(''); setBusy(true);
    try {
      const user = mode === 'login'
        ? await login(form.phone, form.password)
        : await register({ name: form.name, phone: form.phone, password: form.password });
      go(user);
    } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center px-6">
      <h1 className="text-2xl font-bold text-brand mb-1">{mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}</h1>
      <p className="text-gray-500 mb-6 text-sm">Mandados RD</p>

      {mode === 'register' && (
        <Input label="Nombre" value={form.name} onChange={(e: any) => setForm({ ...form, name: e.target.value })} placeholder="Tu nombre" />
      )}
      <Input label="Teléfono" value={form.phone} onChange={(e: any) => setForm({ ...form, phone: e.target.value })} placeholder="809..." />
      <Input label="Contraseña" type="password" value={form.password} onChange={(e: any) => setForm({ ...form, password: e.target.value })} placeholder="••••••" />

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
      <Button onClick={submit} disabled={busy}>{busy ? 'Cargando…' : mode === 'login' ? 'Entrar' : 'Registrarme'}</Button>

      <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="mt-4 text-sm text-brand">
        {mode === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
      </button>

      <div className="mt-8 rounded-xl bg-gray-50 p-4 text-xs text-gray-500">
        <p className="font-semibold mb-1">Cuentas demo (contraseña: 123456)</p>
        <p>Cliente: 8092222222 · Admin: 8090000000 · Repartidor: 8091111111</p>
      </div>
    </div>
  );
}
