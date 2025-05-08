import { Injectable } from '@nestjs/common';
import { CreateFuncionalidadDto } from './dto/create-funcionalidad.dto';
import { UpdateFuncionalidadDto } from './dto/update-funcionalidad.dto';

@Injectable()
export class FuncionalidadService {
  create(createFuncionalidadDto: CreateFuncionalidadDto) {
    return 'This action adds a new funcionalidad';
  }

  findAll() {
    return `This action returns all funcionalidad`;
  }

  findOne(id: number) {
    return `This action returns a #${id} funcionalidad`;
  }

  update(id: number, updateFuncionalidadDto: UpdateFuncionalidadDto) {
    return `This action updates a #${id} funcionalidad`;
  }

  remove(id: number) {
    return `This action removes a #${id} funcionalidad`;
  }
}
