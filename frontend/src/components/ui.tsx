'use client';
import React from 'react';

export function Button({ children, variant = 'primary', className = '', ...props }: any) {
  const styles: Record<string, string> = {
    primary: 'bg-brand text-white active:bg-brand-dark',
    ghost: 'bg-gray-100 text-gray-800 active:bg-gray-200',
    danger: 'bg-red-600 text-white active:bg-red-700',
    success: 'bg-green-600 text-white active:bg-green-700',
  };
  return (
    <button {...props} className={`w-full rounded-xl py-3 font-semibold transition disabled:opacity-50 ${styles[variant]} ${className}`}>
      {children}
    </button>
  );
}

export function Input({ label, ...props }: any) {
  return (
    <label className="block mb-3">
      {label && <span className="block text-sm font-medium text-gray-700 mb-1">{label}</span>}
      <input {...props} className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-brand focus:outline-none" />
    </label>
  );
}

export function Textarea({ label, ...props }: any) {
  return (
    <label className="block mb-3">
      {label && <span className="block text-sm font-medium text-gray-700 mb-1">{label}</span>}
      <textarea {...props} rows={3} className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-brand focus:outline-none" />
    </label>
  );
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-gray-200 text-gray-700', REVIEWING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-blue-100 text-blue-800', ASSIGNED: 'bg-indigo-100 text-indigo-800',
  ON_THE_WAY: 'bg-purple-100 text-purple-800', SHOPPING: 'bg-orange-100 text-orange-800',
  DELIVERING: 'bg-teal-100 text-teal-800', COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-700',
};
const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente', REVIEWING: 'Revisando', APPROVED: 'Aprobado', ASSIGNED: 'Asignado',
  ON_THE_WAY: 'En camino', SHOPPING: 'Comprando', DELIVERING: 'Entregando',
  COMPLETED: 'Completado', CANCELLED: 'Cancelado',
};
export function StatusBadge({ status }: { status: string }) {
  return <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[status] || 'bg-gray-200'}`}>{STATUS_LABELS[status] || status}</span>;
}

export function Header({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <div className="sticky top-0 z-10 bg-brand text-white px-4 py-4 flex items-center justify-between shadow">
      <h1 className="text-lg font-bold">{title}</h1>
      {right}
    </div>
  );
}
