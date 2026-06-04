'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/stores/auth';
import { Button } from '@/components/ui';

const SERVICES = [
  { icon: '🍔', name: 'Comida' }, { icon: '🛒', name: 'Supermercado' },
  { icon: '💊', name: 'Farmacia' }, { icon: '🧾', name: 'Facturas' },
  { icon: '📱', name: 'Recargas' }, { icon: '📦', name: 'Paquetes' },
  { icon: '📄', name: 'Documentos' }, { icon: '✨', name: 'Mandados' },
];

export default function Landing() {
  const { user, loading, restore } = useAuth();
  const router = useRouter();

  useEffect(() => { restore(); }, [restore]);
  useEffect(() => {
    if (!loading && user) {
      const dest = user.role === 'ADMIN' ? '/admin' : user.role === 'DRIVER' ? '/repartidor' : '/cliente';
      router.replace(dest);
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="bg-brand text-white px-6 pt-14 pb-10">
        <h1 className="text-3xl font-extrabold leading-tight">Pide cualquier<br />diligencia 🛵</h1>
        <p className="mt-3 text-white/80">Comida, farmacia, supermercado, pagos, paquetes y lo que necesites. Todo desde tu teléfono.</p>
      </div>

      <div className="px-6 -mt-6">
        <div className="bg-white rounded-2xl shadow-lg p-4 grid grid-cols-4 gap-3">
          {SERVICES.map((s) => (
            <div key={s.name} className="flex flex-col items-center text-center">
              <div className="text-3xl">{s.icon}</div>
              <span className="text-[11px] text-gray-600 mt-1">{s.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="px-6 mt-auto pb-10 pt-10 space-y-3">
        <Link href="/login"><Button>Entrar / Registrarme</Button></Link>
        <p className="text-center text-xs text-gray-400">República Dominicana · Servicio bajo demanda</p>
      </div>
    </div>
  );
}
