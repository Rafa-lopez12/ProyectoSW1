import { IsUUID, IsNumber, IsPositive } from 'class-validator';

export class AgregarCarritoDto {
  @IsUUID()
  productoVariedadId: string;

  @IsNumber()
  @IsPositive()
  cantidad: number;
}


