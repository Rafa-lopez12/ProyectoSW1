import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { DiagramWsModule } from './diagram-ws/diagram-ws.module';
import { RolModule } from './rol/rol.module';
import { FuncionalidadModule } from './funcionalidad/funcionalidad.module';



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

    ServeStaticModule.forRoot({
      rootPath: join(__dirname,'..','public'), 
    }),
    AuthModule,
    RolModule,
    FuncionalidadModule
    
  ],
  providers: [],

})
export class AppModule {}
