import { Injectable, Logger } from '@nestjs/common';
import { NotificationChannel } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

// Mapa de eventos -> canales que se disparan
const EVENT_CHANNELS: Record<string, NotificationChannel[]> = {
  order_created: ['PUSH', 'WHATSAPP'],
  order_approved: ['PUSH', 'WHATSAPP'],
  order_assigned: ['PUSH', 'WHATSAPP'],
  driver_on_the_way: ['PUSH', 'WHATSAPP'],
  order_completed: ['PUSH', 'WHATSAPP', 'EMAIL'],
  order_cancelled: ['PUSH', 'WHATSAPP'],
};

@Injectable()
export class NotificationsService {
  private logger = new Logger('Notifications');
  constructor(private prisma: PrismaService) {}

  // En producción cada canal llama a su proveedor (WhatsApp Business, FCM, SMTP).
  // Aquí registramos el envío y lo logueamos. Se encola en Redis en prod.
  async onEvent(event: string, userId: string, orderId?: string) {
    const channels = EVENT_CHANNELS[event] || ['PUSH'];
    for (const channel of channels) {
      try {
        await this.send(channel, userId, event, orderId);
        await this.prisma.notification.create({
          data: { userId, orderId: orderId ?? null, channel, event, status: 'SENT' },
        });
      } catch (e) {
        await this.prisma.notification.create({
          data: { userId, orderId: orderId ?? null, channel, event, status: 'FAILED' },
        });
      }
    }
  }

  private async send(channel: NotificationChannel, userId: string, event: string, orderId?: string) {
    // Stub: integrar proveedor real aquí.
    this.logger.log(`[${channel}] -> user ${userId} | event=${event} | order=${orderId ?? '-'}`);
  }

  list(userId: string) {
    return this.prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }
}
