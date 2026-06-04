import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard) @Roles('DRIVER', 'ADMIN')
@Controller('deliveries')
export class DeliveriesController {
  constructor(private prisma: PrismaService) {}

  @Get('mine')
  mine(@CurrentUser() u: any) {
    return this.prisma.delivery.findMany({
      where: { driverId: u.id },
      include: { order: { include: { service: true, client: true } } },
      orderBy: { id: 'desc' },
    });
  }

  @Patch(':id/accept')
  accept(@Param('id') id: string) {
    return this.prisma.delivery.update({ where: { id }, data: { status: 'ACCEPTED', acceptedAt: new Date() } });
  }

  @Post(':id/location')
  async location(@Param('id') id: string, @Body() body: { lat: number; lng: number }) {
    return this.prisma.deliveryTracking.create({ data: { deliveryId: id, lat: body.lat, lng: body.lng } });
  }
}
