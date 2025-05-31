import { PartialType } from '@nestjs/swagger';
import { CreateTryonDto } from './create-virtual-tryon.dto';

export class UpdateVirtualTryonDto extends PartialType(CreateTryonDto) {}
