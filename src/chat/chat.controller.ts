import { Controller, Get, Post, Body, Param } from "@nestjs/common";
import { ChatService } from './chat.service'
import { conversationsDto } from './dto/conversations.dto'
import { messageDto } from './dto/message.dto'

@Controller('chat')
export class ChatController {
  constructor(
    private chatService: ChatService,
  ) { }
  
  //////// Conversations ///////
  @Post('/conversations')
  newConversation(@Body() conversation: conversationsDto) {
    return this.chatService.newConversation(conversation.members[0], conversation.members[1])
  }

  @Get('/conversations/:userId')
  getConversation(@Param('userId') userId: string) {
    return this.chatService.getConversation(userId) 
  }


  /////// Messages /////////
  @Post('/messages')
  addMessage(@Body() message: messageDto) {
    return this.chatService.addMessage(message)
  }

  @Get('/messages/:conversationId')
  getMessage(@Param('conversationId') conversationId: string) {
    return this.chatService.getMessages(conversationId)
  }
}
