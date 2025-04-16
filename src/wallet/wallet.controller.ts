import { Body, Controller, Param, Post, Get, Req, UseGuards, HttpException } from "@nestjs/common";
import { WalletService } from './wallet.service'
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { PaypalService } from "./paypal.service";


@Controller('wallet')
export class WalletControler {
  constructor(
    private walletService: WalletService,
    private paypalService: PaypalService
  ) { }

  @Get(':walletId')
  getWalletById(@Param('walletId') walletId) {
    return this.walletService.getWalletById(walletId)
  }

  @Get('getwithdrawals/:walletId')
  getWithdrawalbyId(@Param('walletId') walletId) {
    return this.walletService.getWithdrawalbyId(walletId)
  }

  @Get('getPaypalPayoutDetails/:batchId')
  getPaypalPayoutDetails(@Param('batchId') batchId) {
    return this.paypalService.getPaypalDetails(batchId)
  }

  @UseGuards(JwtAuthGuard)
  @Get('getwithdrawalBalances/:userId')
  getWithdrawalBalances(@Param('userId') userId: string) {
    return this.walletService.getWithdrawalBalances(userId);
  }

  @Post(':userid')
  createWallet(@Param('userid') userid, @Body() wallet) {
    return this.walletService.createWallet(userid, wallet)
  }

  @UseGuards(JwtAuthGuard)
  @Post('withdraw/:paypalAccount')
  async withdrawFunds(@Param('paypalAccount') paypalAccount, @Req() req, @Body() body: { amount: number, amountUsd: number }) {
    console.log('Headers:', req.headers);

    const user = req.user
    const amount = body.amount        // monto en pesos colombianos
    const amountUsd = body.amountUsd  // monto en dolares

    const userId = user.userId
    if (!user || !userId) {
      throw new HttpException('User not authenticated', 401)
    }

    // verificar si el usuario tiene suficiente balance para retirar
    const balance = await this.walletService.getBalance(userId)
    if (balance < amount) {
      throw new HttpException('No tienes suficiente balance para retirar esta cantidad', 400)
    }

    // Realiza el payout utilizando el PaypalService en USD
    const payoutResult = await this.paypalService.createPayout(paypalAccount, amountUsd)

    // Actualiza el historial de retiros y reduce el balance del usuario
    await this.walletService.updateWithdrawlHistory(userId, amount, amountUsd, payoutResult?.batch_header?.payout_batch_id)
    await this.walletService.reduceBalance(userId, amount) // Reducir en pesos colombianos

    return {
      message: 'Retiro realizado exitosamente',
      payoutResult
    }
  }
}
