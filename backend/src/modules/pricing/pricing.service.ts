import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface PriceInput {
  serviceId: string;
  distanceKm: number;
  isUrgent: boolean;
  weightKg?: number;
  purchaseValue?: number; // para servicios de tipo PERCENT
  at?: Date;
}

export interface PriceBreakdown {
  base: number;
  distance: number;
  subtotal: number;
  nightSurcharge: number;
  urgencySurcharge: number;
  weightSurcharge: number;
  total: number;
}

@Injectable()
export class PricingService {
  constructor(private prisma: PrismaService) {}

  // Busca la regla del servicio; si no hay, usa la global (serviceId null)
  private async getRule(serviceId: string) {
    const specific = await this.prisma.pricingRule.findFirst({
      where: { serviceId }, orderBy: { activeFrom: 'desc' },
    });
    if (specific) return specific;
    return this.prisma.pricingRule.findFirst({
      where: { serviceId: null }, orderBy: { activeFrom: 'desc' },
    });
  }

  private isNight(at: Date) {
    const h = at.getHours();
    return h >= 21 || h < 6; // 9pm a 6am
  }

  async calculate(input: PriceInput): Promise<PriceBreakdown> {
    const rule = await this.getRule(input.serviceId);
    if (!rule) {
      // Sin reglas configuradas: todo en cero salvo distancia mínima
      return { base: 0, distance: 0, subtotal: 0, nightSurcharge: 0, urgencySurcharge: 0, weightSurcharge: 0, total: 0 };
    }

    const base = Number(rule.baseFee);
    const perKm = Number(rule.perKm);
    const distance = +(perKm * input.distanceKm).toFixed(2);
    const subtotal = +(base + distance).toFixed(2);

    const at = input.at || new Date();
    const nightSurcharge = this.isNight(at) ? +(subtotal * rule.nightSurchargePct).toFixed(2) : 0;
    const urgencySurcharge = input.isUrgent ? +(subtotal * rule.urgencySurchargePct).toFixed(2) : 0;

    // Recargo por peso configurable: { perKg, freeUnderKg }
    let weightSurcharge = 0;
    const wr = (rule.weightRule || {}) as any;
    if (input.weightKg && wr.perKg) {
      const billable = Math.max(0, input.weightKg - (wr.freeUnderKg || 0));
      weightSurcharge = +(billable * wr.perKg).toFixed(2);
    }

    const total = +(subtotal + nightSurcharge + urgencySurcharge + weightSurcharge).toFixed(2);
    return { base, distance, subtotal, nightSurcharge, urgencySurcharge, weightSurcharge, total };
  }

  // CRUD de reglas para el panel admin
  list() { return this.prisma.pricingRule.findMany({ orderBy: { activeFrom: 'desc' } }); }
  update(id: string, data: any) { return this.prisma.pricingRule.update({ where: { id }, data }); }
  create(data: any) { return this.prisma.pricingRule.create({ data }); }
}
