import { Module } from '@nestjs/common';
import { DiagramWsService } from './diagram-ws.service';
import { DiagramWsGateway } from './diagram-ws.gateway';

@Module({
  providers: [DiagramWsGateway, DiagramWsService],
})
export class DiagramWsModule {}
