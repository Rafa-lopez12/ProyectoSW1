import { IsUUID } from 'class-validator';

export class RemoverCarritoDto {
  @IsUUID()
  productoVariedadId: string;
}