'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/stores/auth';
import { ordersApi, Order } from '@/lib/api';
import { Header, StatusBadge, Button } from '@/components/ui';

// Pasos del flujo para mostrar progreso al cliente
const STEPS = ['PENDING', 'REVIEWING', 'APPROVED', 'ASSIGNED', 'ON_THE_WAY', 'DELIVERING', 'COMPLETED'];

export default function Historial() {
  const { user, loading, restore } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selected, setSelected] = useState<Order | null>(null);

  useEffect(() => { restore(); }, [restore]);
  useEffect(() => { if (!loading && (!user || user.role !== 'CLIENT')) router.replace('/login'); }, [user, loading, router]);

  function load() { ordersApi.list().then(setOrders).catch(() => {}); }
  useEffect(() => { if (user?.role === 'CLIENT') load(); }, [user]);

  async function cancel(id: string) {
    await ordersApi.cancel(id); load(); setSelected(null);
  }

  if (loading || !user) return <div className="p-8 text-center text-gray-400">Cargando…</div>;

  return (
    <div className="pb-8">
      <Header title="Mis pedidos" right={<Link href="/cliente" className="text-xs">Inicio</Link>} />
      <div className="px-4 pt-4 space-y-3">
        {orders.length === 0 && <p className="text-sm text-gray-400">No tienes pedidos todavía.</p>}
        {orders.map((o) => (
          <div key={o.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm" onClick={() => setSelected(selected?.id === o.id ? null : o)}>
            <div className="flex items-center justify-between">
              <p className="font-semibold text-sm">{o.service?.icon} {o.service?.name}</p>
              <StatusBadge status={o.status} />
            </div>
            <p className="text-xs text-gray-400 mt-1">RD${Number(o.estimatedPrice).toFixed(0)} · {o.distanceKm} km · {o.dropoffAddress?.text}</p>

            {selected?.id === o.id && o.status !== 'CANCELLED' && (
              <div className="mt-4">
                {/* Línea de progreso */}
                <div className="flex items-center justify-between mb-4">
                  {STEPS.map((st, i) => {
                    const reached = STEPS.indexOf(o.status) >= i;
                    return <div key={st} className={`flex-1 h-1.5 mx-0.5 rounded-full ${reached ? 'bg-brand' : 'bg-gray-200'}`} />;
                  })}
                </div>
                {o.delivery?.driver && <p className="text-xs text-gray-600 mb-3">🛵 Repartidor: {o.delivery.driver.name}</p>}
                {['PENDING', 'REVIEWING'].includes(o.status) && (
                  <Button variant="danger" onClick={(e: any) => { e.stopPropagation(); cancel(o.id); }}>Cancelar pedido</Button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
