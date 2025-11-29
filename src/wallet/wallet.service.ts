import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage } from 'mongoose';
import { Wallet } from './interfaces/Wallet';
import { WalletDto } from './dto/wallet.dto';
import { BankAccountDto } from './dto/bankaccount.dto';
import { PaginatedDto } from './dto/paginated.dto';

@Injectable()
export class WalletService {
  constructor(
    @InjectModel('Wallet') private readonly walletModel: Model<Wallet>,
  ) {}

  async getWalletById(walletId) {
    const wallet = await this.walletModel.findById(walletId).lean();
    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }
    return { wallet };
  }

  async getWithdrawalbyId(walletId) {
    const wallet = await this.walletModel.findById(walletId).lean();
    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }
    return { withdrawals: wallet.withdrawals };
  }

  async createWallet(userId: string, data: WalletDto): Promise<Wallet> {
    if (!userId) {
      throw new NotFoundException('User not found');
    }

    const wallet = new this.walletModel({ ...data, userId: userId });
    return await wallet.save();
  }

  async updatePendingBalance(userId: string, balance: number) {
    try {
      const wallet = await this.walletModel.findOne({ userId });
      if (!wallet) {
        throw new NotFoundException(`Wallet not found for userId: ${userId}`);
      }

      wallet.pendingBalance += balance;
      await wallet.save();

      console.log(
        `Update pending balance for userId: ${userId} with netbalance: ${balance}`,
      );
    } catch (error) {
      // Manejo de errores
      console.error(
        `Error updating pending balance for userId: ${userId}: ${error.message}`,
      );
      throw new Error(`Failed to update pending balance for userId: ${userId}`);
    }
  }

  async updateAvailableAndTotalEarned(order) {
    try {
      const wallet = await this.walletModel.findOne({
        userId: order?.sellerId,
      });
      if (!wallet) {
        throw new NotFoundException(
          `Wallet not found for userId: ${order?.sellerId}`,
        );
      }
      // Calcula el total del precio del producto sin comision
      const productTotal = order?.product?.price * order?.amount;
      const totalAfterComission = productTotal * 0.9;

      // Calcular el costo total de envio
      const totalShipping = order?.product?.shippingfee * order?.amount;

      const balance = totalAfterComission + totalShipping;

      wallet.pendingBalance -= balance;
      wallet.availableBalance += balance;
      wallet.totalEarned += balance;
      await wallet.save();

      console.log(`Updated Available and total Earned`);
    } catch (error) {
      throw new Error(
        `Error updating wallet for userId: ${order?.sellerId}: ${error.message}`,
      );
    }
  }

  async getBalance(userId: string) {
    const wallet = await this.walletModel.findOne({ userId });
    if (!wallet) {
      throw new NotFoundException(`Wallet not found for userId: ${userId}`);
    }

    return wallet.availableBalance;
  }

  async updateWithdrawlHistory(
    userId: string,
    amount: number,
    amountUsd: number,
    payoutBatchId: string,
  ) {
    const wallet = await this.walletModel.findOne({ userId });
    if (!wallet) {
      throw new NotFoundException(`Wallet not found for userId: ${userId}`);
    }

    const withdrawalEntry = {
      amount: amount,
      amountUsd: amountUsd,
      date: new Date(),
      type: 'withdrawal',
      status: 'completed',
    };

    // wallet.transactionHistory.push(withdrawalEntry)
    // wallet.withdrawals.unshift({payoutBatchId})
    await wallet.save();

    console.log(
      `Updated withdrawal history for userId: ${userId} with amount: ${amount} COP and ${amountUsd} USD`,
    );
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
    const wallet = await this.walletModel.findOne({ userId }).lean();
    if (!wallet) {
      throw new NotFoundException(`Wallet not found for userId: ${userId}`);
    }

    return {
      withdrawalPendingBalance: wallet.withdrawalPendingBalance,
      withdrawalTotalBalance: wallet.withdrawalTotalBalance,
    };
  }

  // Agregar nueva cuenta bancaria
  async addBankAccount(userId: string, dto: BankAccountDto): Promise<Wallet> {
    const wallet = await this.walletModel.findOne({ userId });
    if (!wallet) {
      throw new NotFoundException(`Wallet not found for userId: ${userId}`);
    }
    wallet.bankAccounts.push(dto as any);
    wallet.markModified('bankAccounts');
    return wallet.save();
  }

  // Actualizar cuenta bancaria existente
  async updateBankAccount(
    userId: string,
    accountId: string,
    dto: BankAccountDto,
  ): Promise<Wallet> {
    const wallet = await this.walletModel.findOne({ userId });
    if (!wallet)
      throw new NotFoundException(`Wallet not found for userId: ${userId}`);

    // wallet.bankAccounts es un array de subdocumentos
    const accounts = (wallet.bankAccounts as any[]) || [];
    const acct = accounts.find((a) => a._id?.toString() === accountId);
    if (!acct) {
      throw new NotFoundException(`Bank account not found: ${accountId}`);
    }

    // Actualizar campos del subdocumento encontrado
    acct.bankType = dto.bankType;
    acct.accountType = dto.accountType;
    acct.accountNumber = dto.accountNumber;
    acct.name = dto.name;
    acct.legalIdType = dto.legalIdType;
    acct.legalId = dto.legalId;

    // Marcar el campo modificado (opcional)
    wallet.markModified('bankAccounts');
    return wallet.save();
  }

  // Eliminar cuenta bancaria
  async deleteBankAccount(userId: string, accountId: string): Promise<Wallet> {
    const wallet = await this.walletModel.findOne({ userId });
    if (!wallet) {
      throw new NotFoundException(`Wallet not found for userId: ${userId}`);
    }

    // wallet.bankAccounts es un array de subdocumentos
    const accounts = (wallet.bankAccounts as any[]) || [];
    // busco el índice de la cuenta a eliminar
    const index = accounts.findIndex((a) => a._id?.toString() === accountId);
    if (index === -1) {
      throw new NotFoundException(`Bank account not found: ${accountId}`);
    }

    // elimino el subdocumento del array
    accounts.splice(index, 1);
    wallet.bankAccounts = accounts as any;
    wallet.markModified('bankAccounts');
    return wallet.save();
  }

  /**
   * Solicitar un retiro de fondos a una cuenta asociada.
   * - Verifica balance disponible
   * - Reduce availableBalance
   * - Incrementa withdrawalPendingBalance
   * - Agrega un registro en withdrawals con estado 'pending'
   */
  async requestWithdrawal(
    userId: string,
    accountId: string,
    amount: number,
  ): Promise<Wallet> {
    const wallet = await this.walletModel.findOne({ userId });
    if (!wallet)
      throw new NotFoundException(`Wallet not found for userId: ${userId}`);

    // verificar que exista la cuenta destino
    const acct = (wallet.bankAccounts as any[]).find(
      (a) => a._id?.toString() === accountId,
    );
    if (!acct)
      throw new NotFoundException(`Bank account not found: ${accountId}`);

    // verificar fondos disponibles
    if (wallet.availableBalance < amount) {
      throw new Error('Insufficient balance');
    }

    // ajustar balances
    wallet.availableBalance -= amount;
    wallet.withdrawalPendingBalance += amount;

    // crear orden de retiro pending
    wallet.withdrawals.push({
      bankId: accountId,
      amount,
      requestDate: new Date(),
      status: 'pending',
    });

    wallet.markModified('withdrawals');
    wallet.markModified('withdrawalPendingBalance');
    wallet.markModified('availableBalance');
    return wallet.save();
  }

  /** Retiros de una wallet, paginados */
  async getWithdrawalByWallet(
    walletId: string,
    page = 1,
    limit = 10,
  ): Promise<PaginatedDto<any>> {
    const wallet = await this.walletModel.findById(walletId).lean();
    if (!wallet) throw new NotFoundException('Wallet not found');

    // ordenar desc por requestDate
    const all = wallet.withdrawals
      .map((w) => ({ ...w, requestDate: new Date(w.requestDate) }))
      .sort((a, b) => b.requestDate.getTime() - a.requestDate.getTime());

    const itemCount = all.length;
    const start = (page - 1) * limit;
    const paged = all.slice(start, start + limit);

    return new PaginatedDto(paged, page, limit, itemCount);
  }

  /** Retiros pending de todas las wallets, paginados */
  async getPendingWithdrawals(
    page = 1,
    limit = 20,
  ): Promise<PaginatedDto<any>> {
    const skip = (page - 1) * limit;

    // 1. Desanidar retiros, 2. Unir bankAccounts
    const aggregationPipeline: PipelineStage[] = [
      { $unwind: '$withdrawals' },
      { $match: { 'withdrawals.status': 'pending' } },

      // 1. Adjuntar la información bancaria (funciona)
      {
        $addFields: {
          bankDetails: {
            $arrayElemAt: [
              {
                $filter: {
                  input: '$bankAccounts',
                  as: 'bank',
                  cond: { $eq: ['$$bank._id', '$withdrawals.bankId'] },
                },
              },
              0,
            ],
          },
        },
      },

      { $sort: { 'withdrawals.requestDate': -1 } },

      // 2. PROYECCIÓN CORREGIDA: Incluir todos los campos anidados y bankDetails
      {
        $project: {
          _id: 0,
          withdrawalId: '$withdrawals._id',
          walletId: '$_id',
          userId: '$userId',
          amount: '$withdrawals.amount',
          status: '$withdrawals.status',
          requestDate: '$withdrawals.requestDate',

          // *** ESTOS CAMPOS FALTABAN PROYECTARSE ***
          bankAccountNumber: '$bankDetails.accountNumber',
          bankAccountName: '$bankDetails.name',
          bankAccountType: '$bankDetails.bankType',
        },
      },
    ];

    // 3. Agregar $facet para paginación
    const [agg] = await this.walletModel.aggregate([
      ...aggregationPipeline,
      {
        $facet: {
          items: [{ $skip: skip }, { $limit: limit }],
          totalCount: [{ $count: 'count' }],
        },
      },
    ]);

    const items = agg.items;
    const itemCount = agg.totalCount[0]?.count ?? 0;

    return new PaginatedDto(items, page, limit, itemCount);
  }
}
