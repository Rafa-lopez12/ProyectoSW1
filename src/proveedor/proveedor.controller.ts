import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, Query } from '@nestjs/common';
import { ProveedorService } from './proveedor.service';
import { CreateProveedorDto } from './dto/create-proveedor.dto';
import { UpdateProveedorDto } from './dto/update-proveedor.dto';
import { FuncionalidadAuth } from 'src/auth/decorators/funcionalidad-auth.decorator';

@Controller('proveedor')
export class ProveedorController {
  constructor(private readonly proveedorService: ProveedorService) {}

  @Post()
  @FuncionalidadAuth('crear-proveedor')
  create(@Body() createProveedorDto: CreateProveedorDto) {
    return this.proveedorService.create(createProveedorDto);
  }
  
  @Get()
  @FuncionalidadAuth('obtener-proveedores')
  findAll() {
    return this.proveedorService.findAll();
  }
  
  @Get('active')
  @FuncionalidadAuth('obtener-proveedores')
  findAllActive() {
    return this.proveedorService.findAllActive();
  }
  
  @Get(':id')
  @FuncionalidadAuth('obtener-proveedor')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.proveedorService.findOne(id);
  }
  
  @Get('buscar/nombre')
  @FuncionalidadAuth('obtener-proveedor')
  findByName(@Query('nombre') nombre: string) {
    return this.proveedorService.findByName(nombre);
  }
  
  @Patch(':id')
  @FuncionalidadAuth('actualizar-proveedor')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProveedorDto: UpdateProveedorDto,
  ) {
    return this.proveedorService.update(id, updateProveedorDto);
  }
  
  @Delete(':id')
  @FuncionalidadAuth('desactivar-proveedor')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.proveedorService.remove(id);
  }
  
  @Patch('activate/:id')
  @FuncionalidadAuth('activar-proveedor')
  activate(@Param('id', ParseUUIDPipe) id: string) {
    return this.proveedorService.activate(id);
  }
}
