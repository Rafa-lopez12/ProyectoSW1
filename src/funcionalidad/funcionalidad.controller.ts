import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { FuncionalidadService } from './funcionalidad.service';
import { CreateFuncionalidadDto } from './dto/create-funcionalidad.dto';
import { UpdateFuncionalidadDto } from './dto/update-funcionalidad.dto';

@Controller('funcionalidad')
export class FuncionalidadController {
  constructor(private readonly funcionalidadService: FuncionalidadService) {}

  @Post()
  create(@Body() createFuncionalidadDto: CreateFuncionalidadDto) {
    return this.funcionalidadService.create(createFuncionalidadDto);
  }

  @Get()
  findAll() {
    return this.funcionalidadService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.funcionalidadService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFuncionalidadDto: UpdateFuncionalidadDto) {
    return this.funcionalidadService.update(+id, updateFuncionalidadDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.funcionalidadService.remove(+id);
  }
}
