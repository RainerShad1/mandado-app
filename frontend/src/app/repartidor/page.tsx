'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/stores/auth';
import { deliveriesApi, ordersApi } from '@/lib/api';
import { Header, StatusBadge, Button } from '@/components/ui';

const NEXT: Record<string, { status: string; label: string }> = {
  ASSIGNED: { status: 'ON_THE_WAY', label: 'Voy en camino' },
  ON_THE_WAY: { status: 'DELIVERING', label: 'Entregando' },
  SHOPPING: { status: 'DELIVERING', label: 'Entregando' },
  DELIVERING: { status: 'COMPLETED', label: 'Entregado ✓' },
};

export default function RepartidorPanel() {
  const { user, loading, restore, logout } = useAuth();
  const router = useRouter();
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [sharing, setSharing] = useState(false);

  useEffect(() => { restore(); }, [restore]);
  useEffect(() => { if (!loading && (!user || user.role !== 'DRIVER')) router.replace('/login'); }, [user, loading, router]);

  function load() { deliveriesApi.mine().then(setDeliveries).catch(() => {}); }
  useEffect(() => { if (user?.role === 'DRIVER') load(); }, [user]);

  async function accept(deliveryId: string) { await deliveriesApi.accept(deliveryId); load(); }
  async function advance(orderId: string, status: string) { await ordersApi.setStatus(orderId, status); load(); }

  if (loading || !user) return <div className="p-8 text-center text-gray-400">Cargando…</div>;

  return (
    <div className="pb-8">
      <Header title="Mis entregas" right={<button onClick={() => { logout(); router.replace('/login'); }} className="text-xs">Salir</button>} />

      <div className="px-4 pt-4">
        <label className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm mb-4">
          <span className="text-sm font-medium text-gray-700">📍 Compartir mi ubicación</span>
          <input type="checkbox" checked={sharing} onChange={(e) => setSharing(e.target.checked)} className="w-6 h-6" />
        </label>
        {sharing && <p className="text-xs text-green-600 -mt-2 mb-4">Enviando ubicación en vivo (vía WebSocket en producción).</p>}

        <div className="space-y-3">
          {deliveries.length === 0 && <p className="text-sm text-gray-400">No tienes pedidos asignados.</p>}
          {deliveries.map((d) => {
            const o = d.order;
            return (
              <div key={d.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm">{o.service?.icon} {o.service?.name}</p>
                  <StatusBadge status={o.status} />
                </div>
                <p className="text-xs text-gray-400 mt-1">{o.client?.name} · RD${Number(o.estimatedPrice).toFixed(0)}</p>
                <p className="text-xs text-gray-500 mt-1">📍 {o.dropoffAddress?.text}</p>

                {d.status === 'PENDING' && (
                  <div className="mt-3"><Button variant="success" onClick={() => accept(d.id)}>Aceptar pedido</Button></div>
                )}
                {d.status !== 'PENDING' && NEXT[o.status] && (
                  <div className="mt-3"><Button onClick={() => advance(o.id, NEXT[o.status].status)}>{NEXT[o.status].label}</Button></div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
