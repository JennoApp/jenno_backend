import { Injectable } from "@nestjs/common";
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Conversations } from './interfaces/Conversations'
import { Message } from './interfaces/Message'

@Injectable()
export class ChatService {
  constructor(
    @InjectModel('Conversations') private conversationsModel: Model<Conversations>,
    @InjectModel('Message') private messageModel: Model<Message>,
  ) { }
  
  /////////// Conversations /////////////
  async newConversation(senderId: string, receiverId: string) {
    const newConversation = new this.conversationsModel({
      members: [senderId, receiverId]
    })

    try {
      const savedConversation = await newConversation.save()
      return {
        status: 200,
        savedConversation
      }
    } catch (err) {
      return {
        status: 500,
        err
      }
    }
  }

  async getConversation(userId: string) {
    try {
      const conversation = await this.conversationsModel.find({
        members: { $in: [userId] }
      })

      return {
        status: 200,
        conversation
      }
    } catch (err) {

      return {
        status: 500,
        err
      }
    }
  }

  /////////// Messages /////////////
  async addMessage(message: any) {
    const newMessage = new this.messageModel(message)

    try {
      const savedMessage = await newMessage.save()
      return {
        status: 200,
        savedMessage
      }
    } catch (err) {
      return {
        status: 500,
        err
      }
    }
  }

  async getMessages(conversationId: string) {
    try {
      const messages = await this.messageModel.find({
        conversationId: conversationId
      })
      return {
        status: 200,
        messages
      }
    } catch (err) {
      return  {
        status: 500,
        err
      }
    }
  }

}



