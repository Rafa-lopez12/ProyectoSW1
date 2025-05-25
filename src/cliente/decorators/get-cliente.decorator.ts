import { createParamDecorator, ExecutionContext, InternalServerErrorException } from '@nestjs/common';

export const GetCliente = createParamDecorator(
    (data: string, ctx: ExecutionContext) => {
        const req = ctx.switchToHttp().getRequest();
        const cliente = req.user;

        if (!cliente)
            throw new InternalServerErrorException('Cliente not found (request)');
        
        return (!data) 
            ? cliente 
            : cliente[data];
    }
);

// src/cliente/decorators/cliente-auth.decorator.ts
