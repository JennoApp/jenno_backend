import { Module } from "@nestjs/common";
import { MongooseModule } from '@nestjs/mongoose'
import { ConversationsSchema } from './schemas/conversations.schema'
import { MessageSchema } from './schemas/message.schema'
import { ChatService } from './chat.service'
import { ChatController } from './chat.controller'

@Module({
  imports: [MongooseModule.forFeature([
    { name: 'Conversations', schema: ConversationsSchema },
    { name: 'Message', schema: MessageSchema }
  ])],
  controllers: [ChatController],
  providers: [ChatService]
})

export class ChatModule {}  
