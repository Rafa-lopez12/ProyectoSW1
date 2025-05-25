import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TenantGuard } from '../guard/tenant.guard';
import { UserRoleGuard } from '../../auth/guards/user-role.guard';
import { FuncionalidadGuard } from '../../auth/guards/funcionalidad.guard';
import { ValidRoles } from '../../auth/interfaces/valid-roles';


export function TenantAuth(...roles: ValidRoles[]) {
  return applyDecorators(
    SetMetadata('requires-tenant', true),
    SetMetadata('roles', roles),
    UseGuards(TenantGuard, AuthGuard(), UserRoleGuard),
  );
}


export function TenantFuncionalidadAuth(funcionalidad: string) {
  return applyDecorators(
    SetMetadata('requires-tenant', true),
    SetMetadata('funcionalidad', funcionalidad),
    UseGuards(TenantGuard, AuthGuard(), FuncionalidadGuard),
  );
}


export function PublicRoute() {
  return applyDecorators(
    SetMetadata('requires-tenant', false),
  );
}

export function ClienteTenantAuth() {
  return applyDecorators(
    SetMetadata('requires-tenant', true),
    UseGuards(TenantGuard, AuthGuard('cliente-jwt')),
  );
}