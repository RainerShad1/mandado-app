import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard) @Roles('ADMIN')
@Controller('users')
export class UsersController {
  constructor(private prisma: PrismaService) {}

  @Get()
  list(@Query('role') role?: string) {
    return this.prisma.user.findMany({
      where: role ? { role: role as any } : {},
      select: { id: true, name: true, phone: true, email: true, role: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
