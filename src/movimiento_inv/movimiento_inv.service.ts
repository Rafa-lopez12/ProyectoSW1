import { Injectable } from '@nestjs/common';
import { CreateMovimientoInvDto } from './dto/create-movimiento_inv.dto';
import { UpdateMovimientoInvDto } from './dto/update-movimiento_inv.dto';

@Injectable()
export class MovimientoInvService {
  create(createMovimientoInvDto: CreateMovimientoInvDto) {
    return 'This action adds a new movimientoInv';
  }

  findAll() {
    return `This action returns all movimientoInv`;
  }

  findOne(id: number) {
    return `This action returns a #${id} movimientoInv`;
  }

  update(id: number, updateMovimientoInvDto: UpdateMovimientoInvDto) {
    return `This action updates a #${id} movimientoInv`;
  }

  remove(id: number) {
    return `This action removes a #${id} movimientoInv`;
  }
}
