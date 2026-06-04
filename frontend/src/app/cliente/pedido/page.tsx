'use client';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/stores/auth';
import { servicesApi, ordersApi, Service, PriceBreakdown } from '@/lib/api';
import { Header, Button, Input, Textarea } from '@/components/ui';
import AddressAutocomplete from '@/components/AddressAutocomplete';

function PedidoInner() {
  const { user, loading, restore } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const serviceId = params.get('service') || '';

  const [service, setService] = useState<Service | null>(null);
  const [values, setValues] = useState<Record<string, any>>({});
  const [address, setAddress] = useState({ text: '', lat: 18.45, lng: -68.95 });
  const [urgent, setUrgent] = useState(false);
  const [estimate, setEstimate] = useState<{ distanceKm: number; breakdown: PriceBreakdown } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { restore(); }, [restore]);
  useEffect(() => { if (!loading && (!user || user.role !== 'CLIENT')) router.replace('/login'); }, [user, loading, router]);
  useEffect(() => {
    if (serviceId) servicesApi.list().then((list) => setService(list.find((s) => s.id === serviceId) || null));
  }, [serviceId]);

  // Recalcula el estimado cuando cambia dirección o urgencia
  useEffect(() => {
    if (!service || !address.text) { setEstimate(null); return; }
    const t = setTimeout(() => {
      ordersApi.estimate({ serviceId: service.id, dropoffAddress: address, isUrgent: urgent })
        .then(setEstimate).catch(() => {});
    }, 400);
    return () => clearTimeout(t);
  }, [service, address, urgent]);

  async function confirm() {
    if (!service) return;
    setError(''); setBusy(true);
    try {
      await ordersApi.create({ serviceId: service.id, dropoffAddress: address, details: values, isUrgent: urgent });
      router.replace('/cliente/historial');
    } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  }

  if (!service) return <div className="p-8 text-center text-gray-400">Cargando servicio…</div>;

  return (
    <div className="pb-40">
      <Header title={`${service.icon} ${service.name}`} right={<button onClick={() => router.back()} className="text-xs">Volver</button>} />

      <div className="px-4 pt-5">
        {service.formSchema.fields.map((f) => (
          f.type === 'textarea' || f.type === 'list' ? (
            <Textarea key={f.key} label={f.label + (f.required ? ' *' : '')}
              placeholder={f.type === 'list' ? 'Un producto por línea' : ''}
              value={values[f.key] || ''} onChange={(e: any) => setValues({ ...values, [f.key]: e.target.value })} />
          ) : f.type === 'files' || f.type === 'file' ? (
            <div key={f.key} className="mb-3">
              <span className="block text-sm font-medium text-gray-700 mb-1">{f.label}</span>
              <div className="rounded-xl border border-dashed border-gray-300 p-4 text-center text-sm text-gray-400">📎 Adjuntar (demo)</div>
            </div>
          ) : (
            <Input key={f.key} label={f.label + (f.required ? ' *' : '')} type={f.type === 'number' ? 'number' : 'text'}
              value={values[f.key] || ''} onChange={(e: any) => setValues({ ...values, [f.key]: e.target.value })} />
          )
        ))}

        <AddressAutocomplete
          label="Dirección de entrega *"
          value={address.text}
          onTextChange={(text) => setAddress({ ...address, text })}
          onSelect={(data) => setAddress(data)}
        />
        <p className="text-xs text-gray-400 -mt-1 mb-3">Escribe y elige una dirección sugerida para fijar la ubicación exacta.</p>

        <label className="flex items-center gap-3 bg-orange-50 rounded-xl p-3 mb-4">
          <input type="checkbox" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} className="w-5 h-5" />
          <span className="text-sm font-medium text-orange-800">⚡ Servicio urgente (+30%)</span>
        </label>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
      </div>

      {/* Resumen de precio fijo abajo */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-200 p-4 shadow-lg">
        {estimate ? (
          <div className="text-xs text-gray-500 mb-2 space-y-0.5">
            <div className="flex justify-between"><span>Base + distancia ({estimate.distanceKm} km)</span><span>RD${estimate.breakdown.subtotal}</span></div>
            {estimate.breakdown.nightSurcharge > 0 && <div className="flex justify-between"><span>Recargo nocturno</span><span>RD${estimate.breakdown.nightSurcharge}</span></div>}
            {estimate.breakdown.urgencySurcharge > 0 && <div className="flex justify-between"><span>Recargo urgencia</span><span>RD${estimate.breakdown.urgencySurcharge}</span></div>}
            <div className="flex justify-between font-bold text-gray-900 text-sm pt-1"><span>Total estimado</span><span>RD${estimate.breakdown.total}</span></div>
          </div>
        ) : (
          <p className="text-xs text-gray-400 mb-2">Escribe la dirección para ver el precio estimado.</p>
        )}
        <Button onClick={confirm} disabled={busy || !address.text}>{busy ? 'Enviando…' : 'Confirmar pedido'}</Button>
      </div>
    </div>
  );
}

export default function PedidoPage() {
  return <Suspense fallback={<div className="p-8 text-center text-gray-400">Cargando…</div>}><PedidoInner /></Suspense>;
}
