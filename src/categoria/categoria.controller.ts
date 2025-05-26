import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CategoriaService } from './categoria.service';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { UpdateCategoryDto } from './dto/update-categoria.dto';
import { GetTenantId } from '../common/decorators/get-tenant.decorator';
import { TenantFuncionalidadAuth } from '../common/decorators/tenant-auth.decorator';

@Controller('categoria')
export class CategoriaController {
  constructor(private readonly categoriaService: CategoriaService) {}

  @Post()
  @TenantFuncionalidadAuth('crear-categoria')
  create(
    @GetTenantId() tenantId: string,
    @Body() createCategoriaDto: CreateCategoriaDto
  ) {
    return this.categoriaService.create(tenantId, createCategoriaDto);
  }

  @Get('findAll')
  @TenantFuncionalidadAuth('obtener-categorias')
  findAll(@GetTenantId() tenantId: string) {
    return this.categoriaService.findAll(tenantId);
  }

  @Get(':id')
  @TenantFuncionalidadAuth('obtener-categoria')
  findOne(
    @GetTenantId() tenantId: string,
    @Param('id') id: string
  ) {
    return this.categoriaService.findOne(tenantId, id);
  }

  @Patch('actualizar/:id')
  @TenantFuncionalidadAuth('actualizar-categoria')
  update(
    @GetTenantId() tenantId: string,
    @Param('id') id: string, 
    @Body() updateCategoriaDto: UpdateCategoryDto
  ) {
    return this.categoriaService.update(tenantId, id, updateCategoriaDto);
  }

  @Delete('eliminar/:id')
  @TenantFuncionalidadAuth('eliminar-categoria')
  remove(
    @GetTenantId() tenantId: string,
    @Param('id') id: string
  ) {
    return this.categoriaService.remove(tenantId, id);
  }
}
