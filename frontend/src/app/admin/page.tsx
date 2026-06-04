'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/stores/auth';
import { ordersApi, usersApi, reportsApi, Order, User } from '@/lib/api';
import { Header, StatusBadge, Button } from '@/components/ui';

// Próximo estado sugerido según el actual
const NEXT: Record<string, { status: string; label: string }[]> = {
  PENDING: [{ status: 'REVIEWING', label: 'Revisar' }, { status: 'CANCELLED', label: 'Cancelar' }],
  REVIEWING: [{ status: 'APPROVED', label: 'Aprobar' }, { status: 'CANCELLED', label: 'Cancelar' }],
  APPROVED: [],
  ASSIGNED: [{ status: 'ON_THE_WAY', label: 'En camino' }],
  ON_THE_WAY: [{ status: 'SHOPPING', label: 'Comprando' }, { status: 'DELIVERING', label: 'Entregando' }],
  SHOPPING: [{ status: 'DELIVERING', label: 'Entregando' }],
  DELIVERING: [{ status: 'COMPLETED', label: 'Completar' }],
};

export default function AdminPanel() {
  const { user, loading, restore, logout } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<'dashboard' | 'orders'>('dashboard');
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<User[]>([]);
  const [revenue, setRevenue] = useState<{ totalOrders: number; totalRevenue: number } | null>(null);

  useEffect(() => { restore(); }, [restore]);
  useEffect(() => { if (!loading && (!user || user.role !== 'ADMIN')) router.replace('/login'); }, [user, loading, router]);

  function load() {
    ordersApi.list().then(setOrders).catch(() => {});
    usersApi.list('DRIVER').then(setDrivers).catch(() => {});
    reportsApi.revenue().then(setRevenue).catch(() => {});
  }
  useEffect(() => { if (user?.role === 'ADMIN') load(); }, [user]);

  async function setStatus(id: string, status: string) { await ordersApi.setStatus(id, status); load(); }
  async function assign(id: string, driverId: string) { if (driverId) { await ordersApi.assign(id, driverId); load(); } }

  if (loading || !user) return <div className="p-8 text-center text-gray-400">Cargando…</div>;

  const pending = orders.filter((o) => !['COMPLETED', 'CANCELLED'].includes(o.status));

  return (
    <div className="pb-8">
      <Header title="Panel Admin" right={<button onClick={() => { logout(); router.replace('/login'); }} className="text-xs">Salir</button>} />

      <div className="flex border-b bg-white">
        {(['dashboard', 'orders'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-3 text-sm font-semibold ${tab === t ? 'text-brand border-b-2 border-brand' : 'text-gray-400'}`}>
            {t === 'dashboard' ? 'Dashboard' : `Pedidos (${pending.length})`}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <div className="px-4 pt-5 grid grid-cols-2 gap-3">
          <Card label="Pedidos activos" value={pending.length} />
          <Card label="Repartidores" value={drivers.length} />
          <Card label="Completados" value={revenue?.totalOrders ?? 0} />
          <Card label="Ingresos" value={`RD$${revenue?.totalRevenue ?? 0}`} />
          <div className="col-span-2 bg-white rounded-2xl p-4 shadow-sm">
            <p className="font-semibold text-gray-800 mb-2 text-sm">Pedidos por estado</p>
            {Object.entries(orders.reduce((acc: any, o) => { acc[o.status] = (acc[o.status] || 0) + 1; return acc; }, {})).map(([st, n]: any) => (
              <div key={st} className="flex items-center justify-between py-1">
                <StatusBadge status={st} /><span className="text-sm font-semibold">{n}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'orders' && (
        <div className="px-4 pt-4 space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-sm">{o.service?.icon} {o.service?.name}</p>
                <StatusBadge status={o.status} />
              </div>
              <p className="text-xs text-gray-400 mt-1">{o.client?.name} · RD${Number(o.estimatedPrice).toFixed(0)} · {o.distanceKm} km</p>
              <p className="text-xs text-gray-400">{o.dropoffAddress?.text}{o.isUrgent && ' · ⚡ urgente'}</p>

              {o.status === 'APPROVED' && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-gray-600 mb-1">Asignar repartidor:</p>
                  <select onChange={(e) => assign(o.id, e.target.value)} defaultValue=""
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                    <option value="" disabled>Elegir…</option>
                    {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              )}

              {(NEXT[o.status]?.length > 0) && (
                <div className="flex gap-2 mt-3">
                  {NEXT[o.status].map((n) => (
                    <button key={n.status} onClick={() => setStatus(o.id, n.status)}
                      className={`flex-1 rounded-lg py-2 text-xs font-semibold ${n.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-brand text-white'}`}>
                      {n.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Card({ label, value }: { label: string; value: any }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-2xl font-extrabold text-brand mt-1">{value}</p>
    </div>
  );
}
