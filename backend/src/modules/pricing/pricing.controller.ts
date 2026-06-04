import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { PricingService } from './pricing.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('pricing-rules')
export class PricingController {
  constructor(private pricing: PricingService) {}

  @Get() list() { return this.pricing.list(); }
  @Post() create(@Body() body: any) { return this.pricing.create(body); }
  @Patch(':id') update(@Param('id') id: string, @Body() body: any) { return this.pricing.update(id, body); }
}
