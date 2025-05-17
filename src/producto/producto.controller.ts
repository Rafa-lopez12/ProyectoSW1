import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ProductoService } from './producto.service';
import { CreateProductDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { Funcionalidad } from '../auth/decorators/funcionalidad.decorator';
import { ProductFilterInterface } from './interface/product-filter.interface';

@Controller('producto')
export class ProductoController {
  constructor(private readonly productoService: ProductoService) {}

  @Post()
  @Funcionalidad('crear-producto')
  create(@Body() createProductoDto: CreateProductDto) {
    return this.productoService.create(createProductoDto);
  }

  @Get('findAll')
  @Funcionalidad('obtener-productos')
  findAll(@Query() filters: ProductFilterInterface) {
    return this.productoService.findAll();
  }

  @Get(':id')
  @Funcionalidad('obtener-producto')
  findOne(@Param('id') id: string) {
    return this.productoService.findOne(id);
  }

  @Patch('actualizar/:id')
  @Funcionalidad('actualizar-producto')
  update(@Param('id') id: string, @Body() updateProductoDto: UpdateProductoDto) {
    return this.productoService.update(id, updateProductoDto);
  }

  @Delete('eliminar/:id')
  @Funcionalidad('eliminar-producto')
  remove(@Param('id') id: string) {
    return this.productoService.remove(id);
  }


  @Get('category/:categoryId')
  findByCategory(@Param('categoryId') categoryId: string) {
    return this.productoService.findByCategory(categoryId);
  }
  
  @Get('subcategory/:subcategory')
  findBySubcategory(@Param('subcategory') subcategory: string) {
    return this.productoService.findBySubcategory(subcategory);
  }


  
}


