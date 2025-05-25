import { PartialType } from '@nestjs/swagger';
import { CreateSuscripcionDto } from './create-suscripcion.dto';

export class UpdateSuscripcionDto extends PartialType(CreateSuscripcionDto) {}
