import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ProductoService } from './producto.service';
import { CreateProductDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { Funcionalidad } from '../auth/decorators/funcionalidad.decorator';
import { ProductFilterInterface } from './interface/product-filter.interface';
import { GetTenantId } from '../common/decorators/get-tenant.decorator';
import { ClienteTenantAuth, TenantFuncionalidadAuth } from '../common/decorators/tenant-auth.decorator';

@Controller('producto')
export class ProductoController {
  constructor(private readonly productoService: ProductoService) {}

  @Post()
  @TenantFuncionalidadAuth('crear-producto')
  create(
    @GetTenantId() tenantId: string,
    @Body() createProductoDto: CreateProductDto
  ) {
    return this.productoService.create(tenantId, createProductoDto);
  }

  @Get('findAll')
  @TenantFuncionalidadAuth('obtener-productos')
  findAll(
    @GetTenantId() tenantId: string,
    @Query() filters: ProductFilterInterface
  ) {
    return this.productoService.findAll(tenantId, filters);
  }

  @Get('variedades')
  @TenantFuncionalidadAuth('obtener-productos')
  findAllVarieties(
    @GetTenantId() tenantId: string
  ) {
    return this.productoService.findAllProductVarieties(tenantId);
  }

  @Get(':id')
  @TenantFuncionalidadAuth('obtener-producto')
  findOne(
    @GetTenantId() tenantId: string,
    @Param('id') id: string
  ) {
    return this.productoService.findOne(tenantId, id);
  }

  @Patch('actualizar/:id')
  @TenantFuncionalidadAuth('actualizar-producto')
  update(
    @GetTenantId() tenantId: string,
    @Param('id') id: string, 
    @Body() updateProductoDto: UpdateProductoDto
  ) {
    return this.productoService.update(tenantId, id, updateProductoDto);
  }

  @Delete('eliminar/:id')
  @TenantFuncionalidadAuth('eliminar-producto')
  remove(
    @GetTenantId() tenantId: string,
    @Param('id') id: string
  ) {
    return this.productoService.remove(tenantId, id);
  }

  @Get('category/:categoryId')
  findByCategoryy(
    @GetTenantId() tenantId: string,
    @Param('categoryId') categoryId: string
  ) {
    return this.productoService.findByCategory(tenantId, categoryId);
  }
  
  @Get('subcategory/:subcategory')
  findBySubcategoryy(
    @GetTenantId() tenantId: string,
    @Param('subcategory') subcategory: string
  ) {
    return this.productoService.findBySubcategory(tenantId, subcategory);
  }


  @Get('tienda/findAll')
  @ClienteTenantAuth()
  findAllStore(
  @GetTenantId() tenantId: string,
  @Query() filters: ProductFilterInterface
  ) {
  return this.productoService.findAll(tenantId, filters);
  }

@Get('tienda/:id')
@ClienteTenantAuth()
findOneStore(
  @GetTenantId() tenantId: string,
  @Param('id') id: string
) {
  return this.productoService.findOne(tenantId, id);
}

}




