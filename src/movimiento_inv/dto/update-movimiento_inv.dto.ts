import { PartialType } from '@nestjs/swagger';
import { CreateMovimientoInvDto } from './create-movimiento_inv.dto';

export class UpdateMovimientoInvDto extends PartialType(CreateMovimientoInvDto) {}
