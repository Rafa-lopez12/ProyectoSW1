import { IsNumber, IsPositive } from 'class-validator';

export class ActualizarCantidadCarritoDto {
  @IsNumber()
  @IsPositive()
  cantidad: number;
}