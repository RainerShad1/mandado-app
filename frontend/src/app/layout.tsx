import './globals.css';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Mandados RD — Pide cualquier diligencia',
  description: 'Delivery, supermercado, farmacia, pagos, paquetes y mandados.',
  manifest: '/manifest.json',
};
export const viewport: Viewport = { themeColor: '#1F4E79', width: 'device-width', initialScale: 1, maximumScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="max-w-md mx-auto min-h-screen bg-white shadow-sm">{children}</body>
    </html>
  );
}
