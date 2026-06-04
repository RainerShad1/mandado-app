import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard) @Roles('CLIENT')
@Controller('addresses')
export class AddressesController {
  constructor(private prisma: PrismaService) {}

  @Get()
  mine(@CurrentUser() u: any) { return this.prisma.address.findMany({ where: { userId: u.id } }); }

  @Post()
  create(@CurrentUser() u: any, @Body() body: any) {
    return this.prisma.address.create({ data: { ...body, userId: u.id } });
  }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.prisma.address.delete({ where: { id } }); }
}
