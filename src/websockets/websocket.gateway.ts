import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'

@WebSocketGateway()
export class websocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server
  
  handleConnection(client: Socket) {
     console.log(`client connected: ${client.id}`) 
  }

  handleDisconnect(client: Socket) {
     console.log(`client disconnected: ${client.id}`) 
  }

  // this method is used to send messages to all connected clients
  @SubscribeMessage('message')
  handleMessages(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
    console.log(data)
    client.broadcast.emit('server:message', data)
  }
}
