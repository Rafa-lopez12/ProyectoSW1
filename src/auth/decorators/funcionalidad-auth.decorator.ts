import { applyDecorators, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FuncionalidadGuard } from '../guards/funcionalidad.guard';
import { Funcionalidad } from './funcionalidad.decorator';

export function FuncionalidadAuth(nombreFuncionalidad: string) {
  return applyDecorators(
    Funcionalidad(nombreFuncionalidad),
    UseGuards(AuthGuard(), FuncionalidadGuard),
  );
}