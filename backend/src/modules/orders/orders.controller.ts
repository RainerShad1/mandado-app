import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateStatusDto, AssignDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('orders')
export class OrdersController {
  constructor(private orders: OrdersService) {}

  @Post() @Roles('CLIENT', 'ADMIN')
  create(@CurrentUser() user: any, @Body() dto: CreateOrderDto) {
    return this.orders.create(user.id, dto);
  }

  @Post('estimate') @Roles('CLIENT', 'ADMIN')
  estimate(@Body() dto: CreateOrderDto) { return this.orders.estimate(dto); }

  @Get()
  list(@CurrentUser() user: any) { return this.orders.list(user); }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) { return this.orders.findOne(id, user); }

  @Patch(':id/status') @Roles('ADMIN', 'DRIVER')
  status(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.orders.changeStatus(id, dto.status);
  }

  @Patch(':id/assign') @Roles('ADMIN')
  assign(@Param('id') id: string, @Body() dto: AssignDto) {
    return this.orders.assign(id, dto.driverId);
  }

  @Patch(':id/cancel') @Roles('CLIENT', 'ADMIN')
  cancel(@Param('id') id: string) { return this.orders.cancel(id); }
}
