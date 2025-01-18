import { Injectable } from "@nestjs/common";
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Conversations } from './interfaces/Conversations'
import { Message } from './interfaces/Message'
import { messageDto } from './dto/message.dto'

@Injectable()
export class ChatService {
  constructor(
    @InjectModel('Conversations') private conversationsModel: Model<Conversations>,
    @InjectModel('Message') private messageModel: Model<Message>,
  ) { }

  /////////// Conversations /////////////
  async newConversation(senderId: string, receiverId: string) {
    try {
      // Buscar conversacion existente entre los dos usuarios
      const existingConversation = await this.conversationsModel.findOne({
        members: { $all: [senderId, receiverId] }
      })
      if (existingConversation) {
        return {
          status: 200,
          message: 'Conversation already exists',
          conversationId: existingConversation._id
        }
      }

      // Crear una nueva conversacion si no existe
      const newConversation = new this.conversationsModel({
        members: [senderId, receiverId],
        unreadCount: { [senderId]: 0, [receiverId]: 0 }
      })
      const savedConversation = await newConversation.save()
      return {
        status: 200,
        savedConversation,
        conversationId: savedConversation._id
      }
    } catch (error) {
      console.error('Error creating conversation:', error)
      return {
        status: 500,
        message: 'Error creating conversation',
        error
      }
    }
  }

  async getConversations(userId: string) {
    try {
      if (!userId) {
        throw new Error('El userId es obligatorio');
      }

      const conversations = await this.conversationsModel.find({
        members: { $in: [userId] }
      })

      const conversationsWithUnreadCount = conversations.map(conversation => {
        const unreadCount = conversation.unreadCount?.get(userId) || 0

        return {
          ...conversation.toObject(),
          unreadCount
        }
      });

      return {
        status: 200,
        conversations: conversationsWithUnreadCount
      }
    } catch (err) {
      console.error('Error retrieving conversations:', err)
      return {
        status: 500,
        err
      }
    }
  }

  /////////// Messages /////////////
  async addMessage(message: messageDto) {
    const newMessage = new this.messageModel({
      ...message,
      isRead: false
    })

    try {
      const savedMessage = await newMessage.save()

      // Incrementar el contador de mensajes no leídos para los otros miembros
      const conversation = await this.conversationsModel.findById(message.conversationId)

      if (conversation) {
        const otherMembers = conversation.members.filter(member => member !== message.sender)

        const unreadCount = conversation.unreadCount || new Map()
        otherMembers.forEach(member => {
          const currentCount = unreadCount.get(member) || 0
          unreadCount.set(member, currentCount + 1)
        });

        conversation.unreadCount = unreadCount
        await conversation.save();
      }

      return {
        status: 200,
        message: 'Message saved successfully.',
        savedMessage
      }
    } catch (error) {
      console.error('Error saving message:', error)
      return {
        status: 500,
        message: 'An error occurred while saving the message.',
        error
      }
    }
  }

  async getMessages(conversationId: string, page: number = 1, limit: number = 20) {
    if (!conversationId) {
      return {
        status: 400,
        message: 'Invalid conversationId'
      };
    }

    if (page < 1 || limit < 1) {
      return {
        status: 400,
        message: 'Invalid pagination parameters'
      };
    }

    try {
      const messages = await this.messageModel
        .find({ conversationId })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)

      const totalMessages = await this.messageModel.countDocuments({ conversationId })

      const reversedMessages = messages.reverse()

      return {
        status: 200,
        messages: reversedMessages,
        totalMessages,
        totalPages: Math.ceil(totalMessages / limit),
        currentPage: page
      }
    } catch (error) {
      console.error('Error retrieving messages:', error);
      return {
        status: 500,
        message: 'Error retrieving messages',
        error
      }
    }
  }

  async markMessagesAsRead(conversationId: string, userId: string) {
    try {
      // Marcar los mensajes como leídos
      await this.messageModel.updateMany(
        { conversationId, isRead: false, sender: { $ne: userId } },
        { $set: { isRead: true } }
      );

      // Resetear el contador de mensajes no leídos para el usuario
      const conversation = await this.conversationsModel.findById(conversationId);

      if (conversation) {
        const unreadCount = { ...conversation.unreadCount }
        unreadCount[userId] = 0;
        conversation.unreadCount = unreadCount

        await conversation.save();
      }

      return {
        status: 200,
        message: 'Messages marked as read successfully.'
      };
    } catch (error) {
      console.error('Error marking messages as read:', error);
      return {
        status: 500,
        message: 'Error marking messages as read.',
        error
      };
    }
  }

}



