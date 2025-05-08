import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { DiagramWsService } from './diagram-ws.service';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({cors: true})
export class DiagramWsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect{
  
  @WebSocketServer() 
  wss:Server

  constructor(private readonly diagramWsService: DiagramWsService) {}

  handleConnection(client: Socket) {
    console.log('cliente conectado', client.id)
  }
  handleDisconnect(client: Socket) {
    console.log('cliente desconectado', client.id)
  }

  afterInit(server: Server) {
    console.log('WebSocket iniciado');
  }

  // Escuchar cuando un usuario mueve una forma
  @SubscribeMessage('moveShape')
  handleMoveShape(client: Socket, payload: any) {
    console.log(`Movimiento recibido:`, payload);
    
    // Reenviar la actualización a los demás clientes
    client.broadcast.emit('updateShape', payload);
  }
}

