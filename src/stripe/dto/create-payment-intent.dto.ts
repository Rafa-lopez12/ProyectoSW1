import { IsNumber, IsString, IsOptional, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PaymentItemDto {
  @IsString()
  productoVariedadId: string;

  @IsNumber()
  @Min(1)
  cantidad: number;

  @IsNumber()
  @Min(0)
  precio: number;

  @IsString()
  nombre: string;
}

export class CreatePaymentIntentDto {
  @IsNumber()
  @Min(1)
  amount: number; // En centavos

  @IsString()
  @IsOptional()
  currency?: string = 'usd';

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentItemDto)
  @IsOptional()
  items?: PaymentItemDto[];

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  metadata?: any;
}