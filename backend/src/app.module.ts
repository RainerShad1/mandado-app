import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { MapsModule } from './modules/maps/maps.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ServicesModule } from './modules/services/services.module';
import { OrdersModule } from './modules/orders/orders.module';
import { DeliveriesModule } from './modules/deliveries/deliveries.module';
import { TrackingModule } from './modules/tracking/tracking.module';
import { PricingModule } from './modules/pricing/pricing.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AddressesModule } from './modules/addresses/addresses.module';
import { ReportsModule } from './modules/reports/reports.module';

@Module({
  imports: [
    PrismaModule,
    MapsModule,
    AuthModule,
    UsersModule,
    ServicesModule,
    OrdersModule,
    DeliveriesModule,
    TrackingModule,
    PricingModule,
    PaymentsModule,
    NotificationsModule,
    AddressesModule,
    ReportsModule,
  ],
})
export class AppModule {}
