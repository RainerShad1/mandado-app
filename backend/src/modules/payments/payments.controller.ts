import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard) @Roles('ADMIN')
@Controller('payments')
export class PaymentsController {
  constructor(private prisma: PrismaService) {}

  @Post()
  async create(@Body() body: { orderId: string; amount: number; method?: string; evidenceUrl?: string }) {
    return this.prisma.payment.upsert({
      where: { orderId: body.orderId },
      update: { amount: body.amount, method: (body.method as any) || 'CASH', status: 'PAID', evidenceUrl: body.evidenceUrl, paidAt: new Date() },
      create: { orderId: body.orderId, amount: body.amount, method: (body.method as any) || 'CASH', status: 'PAID', evidenceUrl: body.evidenceUrl, paidAt: new Date() },
    });
  }
}
