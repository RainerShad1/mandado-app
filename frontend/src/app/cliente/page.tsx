'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/stores/auth';
import { servicesApi, ordersApi, Service, Order } from '@/lib/api';
import { Header, StatusBadge } from '@/components/ui';

export default function ClienteHome() {
  const { user, loading, restore, logout } = useAuth();
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => { restore(); }, [restore]);
  useEffect(() => { if (!loading && (!user || user.role !== 'CLIENT')) router.replace('/login'); }, [user, loading, router]);
  useEffect(() => {
    if (user?.role === 'CLIENT') {
      servicesApi.list().then(setServices).catch(() => {});
      ordersApi.list().then(setOrders).catch(() => {});
    }
  }, [user]);

  if (loading || !user) return <div className="p-8 text-center text-gray-400">Cargando…</div>;

  return (
    <div className="pb-8">
      <Header title={`Hola, ${user.name.split(' ')[0]} 👋`} right={<button onClick={() => { logout(); router.replace('/login'); }} className="text-xs">Salir</button>} />

      <div className="px-4 pt-5">
        <h2 className="font-bold text-gray-800 mb-3">¿Qué necesitas hoy?</h2>
        <div className="grid grid-cols-3 gap-3">
          {services.map((s) => (
            <Link key={s.id} href={`/cliente/pedido?service=${s.id}`}>
              <div className="bg-white border border-gray-100 rounded-2xl p-3 flex flex-col items-center shadow-sm active:scale-95 transition">
                <span className="text-3xl">{s.icon}</span>
                <span className="text-[11px] text-center text-gray-700 mt-2 leading-tight">{s.name}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="px-4 pt-7">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-800">Tus pedidos</h2>
          <Link href="/cliente/historial" className="text-xs text-brand">Ver todos</Link>
        </div>
        {orders.length === 0 && <p className="text-sm text-gray-400">Aún no tienes pedidos.</p>}
        <div className="space-y-3">
          {orders.slice(0, 4).map((o) => (
            <Link key={o.id} href={`/cliente/historial`}>
              <div className="bg-white border border-gray-100 rounded-xl p-3 flex items-center justify-between shadow-sm">
                <div>
                  <p className="font-semibold text-sm">{o.service?.icon} {o.service?.name}</p>
                  <p className="text-xs text-gray-400">RD${Number(o.estimatedPrice).toFixed(0)} · {o.distanceKm} km</p>
                </div>
                <StatusBadge status={o.status} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
