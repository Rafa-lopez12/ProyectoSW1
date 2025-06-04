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


  @Get('findAlll')
  @ClienteTenantAuth()
  findAlll(
    @GetTenantId() tenantId: string,
    @Query() filters: ProductFilterInterface
  ) {
    return this.productoService.findAll(tenantId, filters);
  }

  @Get('obtener/:id')
  @ClienteTenantAuth()
  findOnee(
    @GetTenantId() tenantId: string,
    @Param('id') id: string
  ) {
    return this.productoService.findOne(tenantId, id);
  }


  // @Get('catalog')
  // @ClienteTenantAuth()
  // findAllPublic(
  //   @GetTenantId() tenantId: string,
  //   @Query() filters: ProductFilterInterface
  // ) {
  //   // Solo mostrar productos activos en el catálogo público
  //   const publicFilters = { ...filters, active: true };
  //   return this.productoService.findAllForCatalog(tenantId, publicFilters);
  // }

  // @Get('catalog/:id')
  // @ClienteTenantAuth()
  // findOnePublic(
  //   @GetTenantId() tenantId: string,
  //   @Param('id') id: string
  // ) {
  //   return this.productoService.findOneForCatalog(tenantId, id);
  // }

  // @Get('catalog/category/:categoryId')
  // @ClienteTenantAuth()
  // findByCategoryPublic(
  //   @GetTenantId() tenantId: string,
  //   @Param('categoryId') categoryId: string
  // ) {
  //   return this.productoService.findByCategoryForCatalog(tenantId, categoryId);
  // }
  
  // @Get('catalog/subcategory/:subcategory')
  // @ClienteTenantAuth()
  // findBySubcategoryPublic(
  //   @GetTenantId() tenantId: string,
  //   @Param('subcategory') subcategory: string
  // ) {
  //   return this.productoService.findBySubcategoryForCatalog(tenantId, subcategory);
  // }

  // @Get('catalog/search')
  // @ClienteTenantAuth()
  // searchPublic(
  //   @GetTenantId() tenantId: string,
  //   @Query('q') searchTerm: string,
  //   @Query() filters: ProductFilterInterface
  // ) {
  //   const searchFilters = { ...filters, search: searchTerm, active: true };
  //   return this.productoService.findAllForCatalog(tenantId, searchFilters);
  // }

  // =================== RUTAS ADMINISTRATIVAS EXISTENTES ===================
  
  // @Get('category/:categoryId')
  // @TenantFuncionalidadAuth('obtener-productos')
  // findByCategory(
  //   @GetTenantId() tenantId: string,
  //   @Param('categoryId') categoryId: string
  // ) {
  //   return this.productoService.findByCategory(tenantId, categoryId);
  // }
  
  // @Get('subcategory/:subcategory')
  // @TenantFuncionalidadAuth('obtener-productos')
  // findBySubcategory(
  //   @GetTenantId() tenantId: string,
  //   @Param('subcategory') subcategory: string
  // ) {
  //   return this.productoService.findBySubcategory(tenantId, subcategory);
  // }
}




