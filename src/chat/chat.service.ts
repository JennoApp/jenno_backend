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
        members: [senderId, receiverId]
      })
      const savedConversation = await newConversation.save()
      return {
        status: 200,
        savedConversation,
        conversationId: savedConversation._id
      }
    } catch (error) {
      return {
        status: 500,
        message: 'Error creating conversation',
        error
      }
    }
  }

  async getConversations(userId: string) {
    try {
      const conversations = await this.conversationsModel.find({
        members: { $in: [userId] }
      })

      return {
        status: 200,
        conversations
      }
    } catch (err) {

      return {
        status: 500,
        err
      }
    }
  }

  /////////// Messages /////////////
  async addMessage(message: messageDto) {
    const newMessage = new this.messageModel(message)

    try {
      const savedMessage = await newMessage.save()
      return {
        status: 200,
        message: 'Message saved successfully.',
        savedMessage
      }
    } catch (error) {
      console.error('Error saving message:', error)
      return {
        status: 500,
        message: 'An error occurred while saving the message.'
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

      return {
        status: 200,
        messages,
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

}



