import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { MovimientoInvService } from './movimiento_inv.service';
import { CreateMovimientoInvDto } from './dto/create-movimiento_inv.dto';
import { UpdateMovimientoInvDto } from './dto/update-movimiento_inv.dto';

@Controller('movimiento-inv')
export class MovimientoInvController {
  constructor(private readonly movimientoInvService: MovimientoInvService) {}

  @Post()
  create(@Body() createMovimientoInvDto: CreateMovimientoInvDto) {
    return this.movimientoInvService.create(createMovimientoInvDto);
  }

  @Get()
  findAll() {
    return this.movimientoInvService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.movimientoInvService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMovimientoInvDto: UpdateMovimientoInvDto) {
    return this.movimientoInvService.update(+id, updateMovimientoInvDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.movimientoInvService.remove(+id);
  }
}
