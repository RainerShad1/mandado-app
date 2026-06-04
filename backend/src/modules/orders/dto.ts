import { IsBoolean, IsNumber, IsObject, IsOptional, IsString, IsEnum } from 'class-validator';
import { OrderStatus } from '@prisma/client';

class GeoPoint { @IsString() text: string; @IsNumber() lat: number; @IsNumber() lng: number; }

export class CreateOrderDto {
  @IsString() serviceId: string;
  @IsObject() dropoffAddress: GeoPoint;
  @IsOptional() @IsObject() pickupAddress?: GeoPoint;
  @IsOptional() @IsObject() details?: Record<string, any>;
  @IsOptional() @IsBoolean() isUrgent?: boolean;
  @IsOptional() @IsNumber() weightKg?: number;
  @IsOptional() @IsNumber() purchaseValue?: number;
}

export class UpdateStatusDto { @IsEnum(OrderStatus) status: OrderStatus; }
export class AssignDto { @IsString() driverId: string; }
