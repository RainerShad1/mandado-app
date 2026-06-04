import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('services')
export class ServicesController {
  constructor(private prisma: PrismaService) {}

  // Público: catálogo para el slider del cliente
  @Get()
  list() { return this.prisma.service.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }); }

  @Get(':id')
  one(@Param('id') id: string) { return this.prisma.service.findUnique({ where: { id } }); }

  @UseGuards(JwtAuthGuard, RolesGuard) @Roles('ADMIN') @Post()
  create(@Body() body: any) { return this.prisma.service.create({ data: body }); }

  @UseGuards(JwtAuthGuard, RolesGuard) @Roles('ADMIN') @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) { return this.prisma.service.update({ where: { id }, data: body }); }
}
