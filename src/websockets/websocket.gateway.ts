import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
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
import { UserSocketio } from './interfaces/users-socketio'

@WebSocketGateway({ cors: true })
export class websocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(@InjectModel('UserSocketio') private userSocketioModel: Model<UserSocketio>) { }

  @WebSocketServer()
  server: Server
  
  handleConnection(client: Socket) {
     console.log(`client connected: ${client.id}`) 
  }

  handleDisconnect(client: Socket) {
    this.removeUser(client.id)
    client.emit("getUsers", this.getUsers())
    console.log(`client disconnected: ${client.id}`)
  }

  // methods for sockets 
  async addUser(userId: string, socketId: string) {
    try {
      const existingUser = await this.userSocketioModel.findOne({userId})
      if (!existingUser) {
        const newUser = new this.userSocketioModel({ userId, socketId })
        await newUser.save()
      }
    } catch (err) {
      console.error("Error adding user: ", err)
    }
  }

  async getUsers() {
    try {
      const users = await this.userSocketioModel.find()
      return users
    } catch (err) {
      console.error("Error loading users: ", err)
    }
  }

  async removeUser(socketId: string) {
    try {
      const userRemoved = await this.userSocketioModel.deleteOne({ socketId })
      return userRemoved
    } catch (err) {
      console.error("Error removing user: ", err)
    }
  }

  @SubscribeMessage('addUser')
  async handleAddUser(@ConnectedSocket() client: Socket, @MessageBody() userId: string) {
    this.addUser(userId, client.id)
    client.emit("getUsers", this.getUsers())
  }

  // this method is used to send messages to all connected clients
  @SubscribeMessage('message')
  handleMessages(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
    console.log(data)
    client.broadcast.emit('server:message', data)
  }
}
