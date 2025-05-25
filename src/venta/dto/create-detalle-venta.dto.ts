import { IsUUID, IsNumber, IsPositive, IsOptional, Min } from 'class-validator';

export class CreateDetalleVentaDto {
  @IsUUID()
  productoVariedadId: string;

  @IsNumber()
  @IsPositive()
  cantidad: number;

  @IsNumber()
  @IsPositive()
  precioUnitario: number;

//   @IsNumber()
//   @Min(0)
//   @IsOptional()
//   descuentoLinea?: number = 0;
}