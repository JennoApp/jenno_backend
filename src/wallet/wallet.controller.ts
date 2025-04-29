import { Body, Controller, Param, Post, Get, Req, UseGuards, HttpException, Patch, Delete, Query } from "@nestjs/common";
import { WalletService } from './wallet.service'
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { PaypalService } from "./paypal.service";
import { BankAccountDto } from "./dto/bankaccount.dto";
import { PaginatedDto } from "./dto/paginated.dto";


@Controller('wallet')
export class WalletControler {
  constructor(
    private walletService: WalletService,
    private paypalService: PaypalService
  ) { }

  @UseGuards(JwtAuthGuard)
  @Get('getwithdrawalBalances')
  getWithdrawalBalances(@Req() req) {
    const userId = req.user['userId'];
    if (!userId) {
      throw new HttpException('User not authenticated', 401)
    }

    return this.walletService.getWithdrawalBalances(userId);
  }

  @Get('getwithdrawals/:walletId')
  async getWithdrawalById(
    @Param('walletId') walletId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ): Promise<PaginatedDto<any>> {
    const p = Math.max(1, parseInt(page) || 1);
    const l = Math.max(1, parseInt(limit) || 10);
    return this.walletService.getWithdrawalByWallet(walletId, p, l);
  }

  /**
  * GET /wallet/withdrawals/pending?page=&limit=
  * Retiros pendientes de todas las wallets (admin only), paginados.
  */
  @UseGuards(JwtAuthGuard)
  @Get('withdrawals/pending')
  async listPendingWithdrawals(
    @Req() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ): Promise<PaginatedDto<any>> {
    if (!req.user.isAdmin) throw new HttpException('Forbidden', 403);
    const p = Math.max(1, parseInt(page) || 1);
    const l = Math.max(1, parseInt(limit) || 20);
    return this.walletService.getPendingWithdrawals(p, l);
  }

  @Get('getPaypalPayoutDetails/:batchId')
  getPaypalPayoutDetails(@Param('batchId') batchId) {
    return this.paypalService.getPaypalDetails(batchId)
  }

  @Get(':walletId')
  getWalletById(@Param('walletId') walletId) {
    return this.walletService.getWalletById(walletId)
  }

  @Post(':userid')
  createWallet(@Param('userid') userid, @Body() wallet) {
    return this.walletService.createWallet(userid, wallet)
  }

  @UseGuards(JwtAuthGuard)
  @Post('withdraw/:accountId')
  async requestWithdrawal(@Param('accountId') accountId, @Req() req, @Body('amount') amount: number) {
    console.log('Headers:', req.headers);

    const user = req.user
    const userId = user.userId
    if (!user || !userId) {
      throw new HttpException('User not authenticated', 401)
    }

    if (amount <= 0) {
      throw new HttpException('El monto debe ser mayor a cero', 400);
    }

    // Delegamos la lógica al servicio
    const updatedWallet = await this.walletService.requestWithdrawal(
      userId,
      accountId,
      amount
    );

    return {
      message: 'Retiro solicitado exitosamente',
      withdrawalPendingBalance: updatedWallet.withdrawalPendingBalance,
      withdrawalTotalBalance: updatedWallet.withdrawalTotalBalance,
      withdrawals: updatedWallet.withdrawals.filter(w => w.status === 'pending')
    };
  }

  // Crear nueva cuenta bancaria (Nequi o Bancolombia)
  @UseGuards(JwtAuthGuard)
  @Post('bankAccounts/create')
  async addBankAccount(@Req() req, @Body() dto: BankAccountDto) {
    const userId = req.user['userId'];
    if (!userId) {
      throw new HttpException('User not authenticated', 401);
    }
    return this.walletService.addBankAccount(userId, dto);
  }

  // Actualizar cuenta bancaria existente
  @UseGuards(JwtAuthGuard)
  @Patch('bankAccounts/update/:accountId')
  async updateBankAccount(
    @Req() req,
    @Param('accountId') accountId: string,
    @Body() dto: BankAccountDto
  ) {
    const userId = req.user['userId'];
    if (!userId) {
      throw new HttpException('User not authenticated', 401);
    }
    return this.walletService.updateBankAccount(userId, accountId, dto);
  }

  // Eliminar cuenta bancaria
  @UseGuards(JwtAuthGuard)
  @Delete('bankAccounts/delete/:accountId')
  async deleteBankAccount(
    @Req() req,
    @Param('accountId') accountId: string
  ) {
    const userId = req.user['userId'];
    if (!userId) {
      throw new HttpException('User not authenticated', 401);
    }
    return this.walletService.deleteBankAccount(userId, accountId);
  }
}
