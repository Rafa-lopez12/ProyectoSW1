import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SuscripcionService } from './suscripcion.service';
import { CreateSuscripcionDto } from './dto/create-suscripcion.dto';
import { UpdateSuscripcionDto } from './dto/update-suscripcion.dto';

@Controller('suscripcion')
export class SuscripcionController {
  constructor(private readonly suscripcionService: SuscripcionService) {}

  @Post()
  create(@Body() createSuscripcionDto: CreateSuscripcionDto) {
    return this.suscripcionService.create(createSuscripcionDto);
  }

  @Get()
  findAll() {
    return this.suscripcionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.suscripcionService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSuscripcionDto: UpdateSuscripcionDto) {
    return this.suscripcionService.update(+id, updateSuscripcionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.suscripcionService.remove(+id);
  }
}
