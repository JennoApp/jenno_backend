import { Controller, Get, Post, Body, Param, BadRequestException, InternalServerErrorException } from "@nestjs/common";
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
  async getConversation(@Param('userId') userId: string) {
    if (!userId) {
      throw new BadRequestException('El userId es obligatorio');
    }

    try {
      return await this.chatService.getConversations(userId);
    } catch (error) {
      console.error('Error obteniendo conversaciones:', error);
      throw new InternalServerErrorException('Error al obtener las conversaciones');
    }
  }

  @Get('/conversations/unread/:userId')
  getUnreadConversationsCount(@Param('userId') userId: string) {
    return this.chatService.getUnreadConversationsCount(userId)
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

  @Post('/messages/markasread/:conversationId/:userId')
  markMessagesAsRead(
    @Param('conversationId') conversationId: string,
    @Param('userId') userId: string
  ) {
    return this.chatService.markMessagesAsRead(conversationId, userId)
  }
}
