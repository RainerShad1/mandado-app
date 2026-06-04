import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PricingModule } from '../pricing/pricing.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PricingModule, NotificationsModule],
  providers: [OrdersService],
  controllers: [OrdersController],
})
export class OrdersModule {}
