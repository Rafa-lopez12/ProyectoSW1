import { Injectable } from '@nestjs/common';
import { CreateSuscripcionDto } from './dto/create-suscripcion.dto';
import { UpdateSuscripcionDto } from './dto/update-suscripcion.dto';

@Injectable()
export class SuscripcionService {
  create(createSuscripcionDto: CreateSuscripcionDto) {
    return 'This action adds a new suscripcion';
  }

  findAll() {
    return `This action returns all suscripcion`;
  }

  findOne(id: number) {
    return `This action returns a #${id} suscripcion`;
  }

  update(id: number, updateSuscripcionDto: UpdateSuscripcionDto) {
    return `This action updates a #${id} suscripcion`;
  }

  remove(id: number) {
    return `This action removes a #${id} suscripcion`;
  }
}
