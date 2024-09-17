import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Wallet } from './interfaces/Wallet'
import { WalletDto } from './dto/wallet.dto'

@Injectable()
export class WalletService {
  constructor(
    @InjectModel('Wallet') private readonly walletModel: Model<Wallet>,
  ) {}

  async getWalletById(walletId) {
    return this.walletModel.findById(walletId)
  }

  async createWallet(userId: string, data: WalletDto): Promise<Wallet> {
    if (!userId) {
      throw new NotFoundException('User not found')
    }

    const wallet = new this.walletModel({ ...data, userId: userId })
    return await wallet.save()
  }

  async updatePendingBalance(userId: string, amount: number) {
    const wallet = await this.walletModel.findOne({ userId })
    if (!wallet) {
      throw new NotFoundException(`Wallet not found for userId: ${userId}`)
    }

    // Aplicar el 10% de comision y sumar el 90% al pendingBalance
    const netAmount = amount * 0.9

    wallet.pendingBalance += netAmount
    await wallet.save()

    console.log(`Update pending balance for userId: ${userId} with net amoun: ${netAmount}`)
  }
}
