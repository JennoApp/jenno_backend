import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Wallet } from './interfaces/Wallet'
import { WalletDto } from './dto/wallet.dto'


@Injectable()
export class WalletService {
  constructor(
    @InjectModel('Wallet') private readonly walletModel: Model<Wallet>,
  ) { }

  async getWalletById(walletId) {
    const wallet = await this.walletModel.findById(walletId).lean();
    if (!wallet) {
        throw new NotFoundException('Wallet not found');
    }
    return { wallet }
  }

  async getWithdrawalbyId(walletId) {
    const wallet = await this.walletModel.findById(walletId).lean();
    if (!wallet) {
        throw new NotFoundException('Wallet not found');
    }
    return { withdrawals: wallet.withdrawals }
  }

  async createWallet(userId: string, data: WalletDto): Promise<Wallet> {
    if (!userId) {
      throw new NotFoundException('User not found')
    }

    const wallet = new this.walletModel({ ...data, userId: userId })
    return await wallet.save()
  }

  async updatePendingBalance(userId: string, balance: number) {
    try {

      const wallet = await this.walletModel.findOne({ userId })
      if (!wallet) {
        throw new NotFoundException(`Wallet not found for userId: ${userId}`)
      }

      wallet.pendingBalance += balance
      await wallet.save()

      console.log(`Update pending balance for userId: ${userId} with netbalance: ${balance}`)
    } catch (error) {
      // Manejo de errores
      console.error(`Error updating pending balance for userId: ${userId}: ${error.message}`);
      throw new Error(`Failed to update pending balance for userId: ${userId}`);
    }
  }

  async updateAvailableAndTotalEarned(order) {
    try {
      const wallet = await this.walletModel.findOne({ userId: order?.sellerId })
      if (!wallet) {
        throw new NotFoundException(`Wallet not found for userId: ${order?.sellerId}`)
      }
      // Calcula el total del precio del producto sin comision
      const productTotal = order?.product?.price * order?.amount
      const totalAfterComission = productTotal * 0.9

      // Calcular el costo total de envio
      const totalShipping = order?.product?.shippingfee * order?.amount

      const balance = totalAfterComission + totalShipping

      wallet.pendingBalance -= balance
      wallet.availableBalance += balance
      wallet.totalEarned += balance
      await wallet.save()

      console.log(`Updated Available and total Earned`)
    } catch (error) {
      throw new Error(`Error updating wallet for userId: ${order?.sellerId}: ${error.message}`);
    }
  }

  async getBalance(userId: string) {
    const wallet = await this.walletModel.findOne({ userId })
    if (!wallet) {
      throw new NotFoundException(`Wallet not found for userId: ${userId}`)
    }

    return wallet.availableBalance
  }

  async updateWithdrawlHistory(userId: string, amount: number, amountUsd: number, payoutBatchId: string) {
    const wallet = await this.walletModel.findOne({ userId })
    if (!wallet) {
      throw new NotFoundException(`Wallet not found for userId: ${userId}`)
    }

    const withdrawalEntry = {
      amount: amount,
      amountUsd: amountUsd,
      date: new Date(),
      type: 'withdrawal',
      status: 'completed'
    }

    // wallet.transactionHistory.push(withdrawalEntry)
    // wallet.withdrawals.unshift({payoutBatchId})
    await wallet.save()

    console.log(`Updated withdrawal history for userId: ${userId} with amount: ${amount} COP and ${amountUsd} USD`)
  }

  async reduceBalance(userId: string, amount: number): Promise<void> {
    const wallet = await this.walletModel.findOne({ userId });
    if (!wallet) {
      throw new NotFoundException(`Wallet not found for userId: ${userId}`);
    }

    wallet.availableBalance -= amount;
    await wallet.save();

    console.log(`Reduced balance for userId: ${userId} by amount: ${amount}`);
  }


  ////////////////
  async getWithdrawalBalances(userId: string) {
    const wallet = await this.walletModel.findOne({ userId}).lean()
    if (!wallet) {
      throw new NotFoundException(`Wallet not found for userId: ${userId}`)
    }

    return {
      withdrawalPendingBalance: wallet.withdrawalPendingBalance,
      withdrawalTotalBalance: wallet.withdrawalTotalBalance
    }
  }
}
