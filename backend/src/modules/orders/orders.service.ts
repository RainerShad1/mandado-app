import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { OrderStatus, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PricingService } from '../pricing/pricing.service';
import { NotificationsService } from '../notifications/notifications.service';
import { MapsService, BASE_LOCATION } from '../maps/maps.service';
import { CreateOrderDto } from './dto';

// Transiciones de estado válidas
const FLOW: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['REVIEWING', 'CANCELLED'],
  REVIEWING: ['APPROVED', 'CANCELLED'],
  APPROVED: ['ASSIGNED', 'CANCELLED'],
  ASSIGNED: ['ON_THE_WAY', 'CANCELLED'],
  ON_THE_WAY: ['SHOPPING', 'DELIVERING', 'CANCELLED'],
  SHOPPING: ['DELIVERING', 'CANCELLED'],
  DELIVERING: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private pricing: PricingService,
    private notifications: NotificationsService,
    private maps: MapsService,
  ) {}

  async create(clientId: string, dto: CreateOrderDto) {
    const { distanceKm } = await this.maps.distance(BASE_LOCATION, dto.dropoffAddress);
    const breakdown = await this.pricing.calculate({
      serviceId: dto.serviceId, distanceKm, isUrgent: !!dto.isUrgent,
      weightKg: dto.weightKg, purchaseValue: dto.purchaseValue,
    });
    const order = await this.prisma.order.create({
      data: {
        clientId, serviceId: dto.serviceId,
        dropoffAddress: dto.dropoffAddress as any,
        pickupAddress: (dto.pickupAddress as any) ?? undefined,
        details: dto.details ?? {},
        isUrgent: !!dto.isUrgent,
        distanceKm, estimatedPrice: breakdown.total,
      },
      include: { service: true },
    });
    await this.notifications.onEvent('order_created', order.clientId, order.id);
    return { order, breakdown };
  }

  async estimate(dto: CreateOrderDto) {
    const { distanceKm } = await this.maps.distance(BASE_LOCATION, dto.dropoffAddress);
    const breakdown = await this.pricing.calculate({
      serviceId: dto.serviceId, distanceKm, isUrgent: !!dto.isUrgent,
      weightKg: dto.weightKg, purchaseValue: dto.purchaseValue,
    });
    return { distanceKm, breakdown };
  }

  // Lista filtrada según rol
  async list(user: { id: string; role: Role }) {
    if (user.role === 'ADMIN') {
      return this.prisma.order.findMany({ include: { service: true, client: true, delivery: true }, orderBy: { createdAt: 'desc' } });
    }
    if (user.role === 'DRIVER') {
      return this.prisma.order.findMany({
        where: { delivery: { driverId: user.id } },
        include: { service: true, client: true, delivery: true }, orderBy: { createdAt: 'desc' },
      });
    }
    return this.prisma.order.findMany({
      where: { clientId: user.id },
      include: { service: true, delivery: true }, orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, user: { id: string; role: Role }) {
    const order = await this.prisma.order.findUnique({
      include: { service: true, client: true, items: true, delivery: { include: { driver: true, tracking: true } }, payment: true },
      where: { id },
    });
    if (!order) throw new NotFoundException('Pedido no encontrado');
    if (user.role === 'CLIENT' && order.clientId !== user.id) throw new ForbiddenException();
    if (user.role === 'DRIVER' && order.delivery?.driverId !== user.id) throw new ForbiddenException();
    return order;
  }

  async changeStatus(id: string, status: OrderStatus) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException();
    const allowed = FLOW[order.status];
    if (!allowed.includes(status)) {
      throw new BadRequestException(`No se puede pasar de ${order.status} a ${status}`);
    }
    const updated = await this.prisma.order.update({ where: { id }, data: { status } });
    const eventMap: Partial<Record<OrderStatus, string>> = {
      APPROVED: 'order_approved', ASSIGNED: 'order_assigned',
      ON_THE_WAY: 'driver_on_the_way', COMPLETED: 'order_completed', CANCELLED: 'order_cancelled',
    };
    const ev = eventMap[status];
    if (ev) await this.notifications.onEvent(ev, order.clientId, order.id);
    return updated;
  }

  async assign(orderId: string, driverId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException();
    const delivery = await this.prisma.delivery.upsert({
      where: { orderId },
      update: { driverId, status: 'PENDING' },
      create: { orderId, driverId, status: 'PENDING' },
    });
    await this.prisma.order.update({ where: { id: orderId }, data: { status: 'ASSIGNED' } });
    await this.notifications.onEvent('order_assigned', driverId, orderId);
    return delivery;
  }

  async cancel(id: string) { return this.changeStatus(id, 'CANCELLED'); }
}
