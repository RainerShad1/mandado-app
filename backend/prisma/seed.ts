// Datos iniciales para arrancar la app con algo ya cargado.
// Corre con: npx prisma db seed
import { PrismaClient, Role, PricingType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const pass = await bcrypt.hash('123456', 10);

  // --- Usuarios (uno por rol) ---
  const admin = await prisma.user.upsert({
    where: { phone: '8090000000' },
    update: {},
    create: { name: 'Admin Nova', phone: '8090000000', email: 'admin@demo.com', passwordHash: pass, role: Role.ADMIN },
  });
  const driver = await prisma.user.upsert({
    where: { phone: '8091111111' },
    update: {},
    create: { name: 'Carlos Repartidor', phone: '8091111111', passwordHash: pass, role: Role.DRIVER },
  });
  const client = await prisma.user.upsert({
    where: { phone: '8092222222' },
    update: {},
    create: { name: 'María Cliente', phone: '8092222222', email: 'maria@demo.com', passwordHash: pass, role: Role.CLIENT },
  });

  // --- Dirección favorita del cliente ---
  await prisma.address.create({
    data: { userId: client.id, label: 'Casa', fullAddress: 'C/ Duarte 12, La Romana', lat: 18.427, lng: -68.972, isDefault: true },
  });

  // --- Servicios (con su formulario dinámico) ---
  const services = [
    {
      name: 'Delivery de comida', icon: '🍔', pricingType: PricingType.DISTANCE, sortOrder: 1,
      formSchema: { fields: [
        { key: 'restaurant', label: 'Restaurante', type: 'text', required: true },
        { key: 'products', label: 'Productos', type: 'list', required: true },
        { key: 'notes', label: 'Notas', type: 'textarea', required: false },
      ] },
    },
    {
      name: 'Supermercado', icon: '🛒', pricingType: PricingType.PERCENT, sortOrder: 2,
      formSchema: { fields: [
        { key: 'items', label: 'Lista de compras', type: 'list', required: true },
        { key: 'photos', label: 'Fotos (opcional)', type: 'files', required: false },
      ] },
    },
    {
      name: 'Farmacia', icon: '💊', pricingType: PricingType.PERCENT, sortOrder: 3,
      formSchema: { fields: [
        { key: 'items', label: 'Productos', type: 'list', required: true },
        { key: 'recipe', label: 'Receta médica (opcional)', type: 'file', required: false },
      ] },
    },
    {
      name: 'Pago de facturas', icon: '🧾', pricingType: PricingType.FIXED, sortOrder: 4,
      formSchema: { fields: [
        { key: 'billType', label: 'Tipo de factura', type: 'text', required: true },
        { key: 'reference', label: 'Referencia', type: 'text', required: true },
        { key: 'evidence', label: 'Evidencia de pago', type: 'file', required: false },
      ] },
    },
    {
      name: 'Recargas telefónicas', icon: '📱', pricingType: PricingType.FIXED, sortOrder: 5,
      formSchema: { fields: [
        { key: 'phone', label: 'Número', type: 'text', required: true },
        { key: 'amount', label: 'Monto', type: 'number', required: true },
        { key: 'carrier', label: 'Compañía', type: 'text', required: true },
      ] },
    },
    {
      name: 'Paquetes', icon: '📦', pricingType: PricingType.DISTANCE, sortOrder: 6,
      formSchema: { fields: [
        { key: 'description', label: 'Descripción', type: 'textarea', required: true },
      ] },
    },
    {
      name: 'Documentos', icon: '📄', pricingType: PricingType.DISTANCE, sortOrder: 7,
      formSchema: { fields: [
        { key: 'description', label: 'Descripción', type: 'textarea', required: true },
      ] },
    },
    {
      name: 'Mandado personalizado', icon: '✨', pricingType: PricingType.DISTANCE, sortOrder: 8,
      formSchema: { fields: [
        { key: 'description', label: 'Descripción libre', type: 'textarea', required: true },
        { key: 'attachments', label: 'Adjuntos', type: 'files', required: false },
        { key: 'instructions', label: 'Instrucciones especiales', type: 'textarea', required: false },
      ] },
    },
  ];

  for (const s of services) {
    await prisma.service.create({ data: s });
  }

  // --- Regla de precio global ---
  await prisma.pricingRule.create({
    data: { baseFee: 100, perKm: 15, nightSurchargePct: 0.20, urgencySurchargePct: 0.30, weightRule: { perKg: 5, freeUnderKg: 3 } },
  });

  console.log('Seed listo. Usuarios:');
  console.log('  ADMIN   → 8090000000 / 123456');
  console.log('  DRIVER  → 8091111111 / 123456');
  console.log('  CLIENT  → 8092222222 / 123456');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
