import {
  WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody,
  ConnectedSocket, OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../../prisma/prisma.service';

// Eventos:
//  - join_order: cliente entra a la sala del pedido para ver al repartidor
//  - driver_location: repartidor emite su GPS; se reenvía a la sala
@WebSocketGateway({ cors: { origin: '*' } })
export class TrackingGateway implements OnGatewayConnection {
  @WebSocketServer() server: Server;
  private lastPersist: Record<string, number> = {};

  constructor(private prisma: PrismaService) {}

  handleConnection(client: Socket) {
    // Autenticación de socket por token iría aquí (handshake.auth.token)
  }

  @SubscribeMessage('join_order')
  joinOrder(@MessageBody() data: { orderId: string }, @ConnectedSocket() client: Socket) {
    client.join(`order_${data.orderId}`);
    return { joined: data.orderId };
  }

  @SubscribeMessage('driver_location')
  async driverLocation(
    @MessageBody() data: { orderId: string; deliveryId: string; lat: number; lng: number },
  ) {
    // Reenvía en vivo a todos los que miran ese pedido
    this.server.to(`order_${data.orderId}`).emit('location_update', {
      lat: data.lat, lng: data.lng, at: Date.now(),
    });
    // Persiste solo cada 15s para no saturar la base
    const now = Date.now();
    if (!this.lastPersist[data.deliveryId] || now - this.lastPersist[data.deliveryId] > 15000) {
      this.lastPersist[data.deliveryId] = now;
      await this.prisma.deliveryTracking.create({
        data: { deliveryId: data.deliveryId, lat: data.lat, lng: data.lng },
      });
    }
    return { ok: true };
  }

  // Llamado desde otros servicios para empujar cambios de estado en vivo
  emitStatus(orderId: string, status: string) {
    this.server.to(`order_${orderId}`).emit('status_update', { status, at: Date.now() });
  }
}
