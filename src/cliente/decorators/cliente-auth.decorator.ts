import { applyDecorators, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

export function ClienteAuth() {
  return applyDecorators(
    UseGuards(AuthGuard('cliente-jwt')),
  );
}