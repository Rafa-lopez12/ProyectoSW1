import { PartialType } from '@nestjs/swagger';
import { AgregarCarritoDto } from './create-carrito.dto';

export class UpdateCarritoDto extends PartialType(AgregarCarritoDto) {}
