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
    return this.chatService.getConversations(userId)
  }


  /////// Messages /////////
  @Post('/messages')
  addMessage(@Body() message: messageDto) {
    return this.chatService.addMessage(message)
  }

  @Get('/messages/:conversationId')
  async getMessage(@Param('conversationId') conversationId: string) {
    if (!conversationId) {
      return {
        status: 400,
        message: 'Invalid conversationId'
      };
    }
    const result = await this.chatService.getMessages(conversationId)
    if (result.status !== 200) {
      return {
        status: result.status,
        message: 'Error retrieving messages',
        error: result.error
      };
    }

    return result
  }
}
