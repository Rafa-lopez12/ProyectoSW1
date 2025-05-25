import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class ClienteAuthGuard extends AuthGuard('cliente-jwt') {}