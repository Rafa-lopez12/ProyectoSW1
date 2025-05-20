import { IsUUID, IsNumber, IsPositive } from 'class-validator';

export class CreateDetalleMovDto {
  @IsUUID()
  productoVariedadId: string;

  @IsNumber()
  @IsPositive()
  cantidad: number;

  @IsNumber()
  @IsPositive()
  precio: number;
}