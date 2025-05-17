import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CategoriaService } from './categoria.service';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { UpdateCategoryDto } from './dto/update-categoria.dto';
import { FuncionalidadGuard } from '../auth/guards/funcionalidad.guard';
import { FuncionalidadAuth } from '../auth/decorators/funcionalidad-auth.decorator';

@Controller('categoria')
export class CategoriaController {
  constructor(private readonly categoriaService: CategoriaService) {}

  @Post()
  @FuncionalidadAuth('crear-categoria')
  create(@Body() createCategoriaDto: CreateCategoriaDto) {
    return this.categoriaService.create(createCategoriaDto);
  }

  @Get('findAll')
  @FuncionalidadAuth('obtener-categorias')
  findAll() {
    return this.categoriaService.findAll();
  }

  @Get(':id')
  @FuncionalidadAuth('obtener-categoria')
  findOne(@Param('id') id: string) {
    return this.categoriaService.findOne(id);
  }

  @Patch('actualizar/:id')
  @FuncionalidadAuth('actualizar-categoria')
  update(@Param('id') id: string, @Body() updateCategoriaDto: UpdateCategoryDto) {
    return this.categoriaService.update(id, updateCategoriaDto);
  }

  @Delete('eliminar/:id')
  @FuncionalidadAuth('eliminar-categoria')
  remove(@Param('id') id: string) {
    return this.categoriaService.remove(id);
  }
}
