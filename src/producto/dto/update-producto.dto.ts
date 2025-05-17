import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-producto.dto';

export class UpdateProductoDto extends PartialType(CreateProductDto) {}
