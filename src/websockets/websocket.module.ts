import { Module } from '@nestjs/common'
import { websocketGateway } from './websocket.gateway'
import { MongooseModule } from '@nestjs/mongoose'
import { UserSocketioSchema } from './schemas/users-socketio.schema'

@Module({
  imports: [MongooseModule.forFeature([
    { name: 'UserSocketio', schema: UserSocketioSchema }
  ])],
  providers: [websocketGateway]
})

export class WebSocketModule {}
