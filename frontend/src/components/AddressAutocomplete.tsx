'use client';
import { useEffect, useRef, useState } from 'react';

const KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || '';

interface Props {
  label?: string;
  value: string;
  onSelect: (data: { text: string; lat: number; lng: number }) => void;
  onTextChange?: (text: string) => void;
}

// Carga el script de Google Maps una sola vez (con librería Places).
let scriptPromise: Promise<void> | null = null;
function loadGoogle(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject();
  if ((window as any).google?.maps?.places) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${KEY}&libraries=places&language=es`;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('No se pudo cargar Google Maps'));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

export default function AddressAutocomplete({ label, value, onSelect, onTextChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Sin llave: el input funciona a mano, sin autocompletado.
    if (!KEY) return;
    let ac: any;
    loadGoogle()
      .then(() => {
        if (!inputRef.current) return;
        const g = (window as any).google;
        ac = new g.maps.places.Autocomplete(inputRef.current, {
          fields: ['formatted_address', 'geometry'],
          // Sesga resultados a República Dominicana
          componentRestrictions: { country: 'do' },
        });
        ac.addListener('place_changed', () => {
          const place = ac.getPlace();
          const loc = place.geometry?.location;
          if (loc) {
            onSelect({
              text: place.formatted_address || inputRef.current!.value,
              lat: loc.lat(),
              lng: loc.lng(),
            });
          }
        });
        setReady(true);
      })
      .catch(() => setReady(false));
    return () => { if (ac && (window as any).google) (window as any).google.maps.event.clearInstanceListeners(ac); };
  }, []);

  return (
    <label className="block mb-3">
      {label && <span className="block text-sm font-medium text-gray-700 mb-1">{label}</span>}
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onTextChange?.(e.target.value)}
        placeholder="Ej: C/ Duarte 12, La Romana"
        className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-brand focus:outline-none"
      />
      {!KEY && <span className="text-xs text-gray-400 mt-1 block">Modo manual. Pega tu API key en .env.local para activar el autocompletado.</span>}
      {KEY && ready && <span className="text-xs text-green-600 mt-1 block">✓ Autocompletado de Google activo</span>}
    </label>
  );
}
