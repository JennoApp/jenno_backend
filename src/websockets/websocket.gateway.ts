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
    console.log(`client disconnect: ${client.id}`)
  }

  @SubscribeMessage('addUser')
  async handleAddUser(@ConnectedSocket() client: Socket, @MessageBody() userId: string) {
    try {
      const existingUser = await this.userSocketioModel.findOne({ userId })
      if (!existingUser) {
        const newUser = new this.userSocketioModel({ userId: userId, socketId: client.id })
        await newUser.save()
      }
    } catch (err) {
      console.error("Error adding user: ", err)
    }

    client.emit("getUsers", async () => {
      try {
        const users = await this.userSocketioModel.find()
        console.log(users)
        // return users
      } catch (err) {
        console.error("Error loading users: ", err)
      }
    })
    console.log(userId)
  }

  @SubscribeMessage('removeUser')
  async handleRemoveUser(@ConnectedSocket() client: Socket, @MessageBody() userId: string) {
    try {
      const user = await this.userSocketioModel.find({ userId: userId })
      if (user) {
        const userRemoved = await this.userSocketioModel.deleteOne({ userId: userId })
        console.log("user remove sucessful", userRemoved.acknowledged, client.id)
      } else {
        console.log("usuario no existe en la conexion de socket.io")
      }
    } catch (err) {
      console.error(err)
    }
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(@ConnectedSocket() client: Socket, @MessageBody() { senderId, receiverId, text }) {
    const user = await this.userSocketioModel.find({ userId: receiverId })
    if (user && user.length > 0 && user[0].socketId) {
      client?.to(user[0].socketId).emit("getMessage", {
        senderId,
        text
      })
    } else {
      console.error("User not found or missing socketId property.")
    }
    console.log({ senderId, receiverId, text })
  }

  // this method is used to send messages to all connected clients
  @SubscribeMessage('message')
  handleMessages(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
    console.log(data)
    client.broadcast.emit('server:message', data)
  }
}
