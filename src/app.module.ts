import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { DiagramWsModule } from './diagram-ws/diagram-ws.module';
import { RolModule } from './rol/rol.module';
import { FuncionalidadModule } from './funcionalidad/funcionalidad.module';
import { ProductoModule } from './producto/producto.module';
import { CategoriaModule } from './categoria/categoria.module';
import { ProveedorModule } from './proveedor/proveedor.module';
import { MovimientoInvModule } from './movimiento_inv/movimiento_inv.module';
import { SizeModule } from './size/size.module';
import { VentaModule } from './venta/venta.module';
import { ClienteModule } from './cliente/cliente.module';
import { CarritoModule } from './carrito/carrito.module';
import { Tenant } from './tenant/entities/tenant.entity';
import { TenantModule } from './tenant/tenant.module';
import { TenantMiddleware } from './common/middleware/tenant.middleware';



@Module({
  imports: [
    DiagramWsModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: 5432,
      database: process.env.DB_NAME,
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,      
      autoLoadEntities: true,
      synchronize: true,
    }),
    TypeOrmModule.forFeature([Tenant]),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname,'..','public'), 
    }),
    AuthModule,
    RolModule,
    FuncionalidadModule,
    ProductoModule,
    CategoriaModule,
    ProveedorModule,
    MovimientoInvModule,
    SizeModule,
    VentaModule,
    ClienteModule,
    CarritoModule,
    TenantModule,
    
  ],
  providers: [],

})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .forRoutes('*'); // Aplicar a todas las rutas
  }
}
