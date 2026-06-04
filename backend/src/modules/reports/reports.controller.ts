import { Controller, Get, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard) @Roles('ADMIN')
@Controller('reports')
export class ReportsController {
  constructor(private prisma: PrismaService) {}

  @Get('revenue')
  async revenue() {
    const completed = await this.prisma.order.findMany({
      where: { status: 'COMPLETED' },
      select: { finalPrice: true, estimatedPrice: true, createdAt: true },
    });
    const total = completed.reduce((s, o) => s + Number(o.finalPrice ?? o.estimatedPrice), 0);
    return { totalOrders: completed.length, totalRevenue: +total.toFixed(2) };
  }

  @Get('orders')
  async orders() {
    const byStatus = await this.prisma.order.groupBy({ by: ['status'], _count: true });
    const byService = await this.prisma.order.groupBy({ by: ['serviceId'], _count: true });
    return { byStatus, byService };
  }
}
