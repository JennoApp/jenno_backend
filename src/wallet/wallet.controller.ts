import { Body, Controller, Param, Post, Get, Req, UseGuards, HttpException } from "@nestjs/common";
import { WalletService } from './wallet.service'
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { PaypalService } from "./paypal.service";


@Controller('wallet')
export class WalletControler {
  constructor(
    private walletService: WalletService,
    private paypalService: PaypalService
  ) {}

  @Get(':walletId')
  getWalletById(@Param('walletId') walletId) {
    return this.walletService.getWalletById(walletId)
  }

  @Post(':userid')
  createWallet(@Param('userid') userid, @Body() wallet) {
    return  this.walletService.createWallet(userid, wallet)
  }

  @UseGuards(JwtAuthGuard)
  @Post('withdraw/:paypalAccount')
  async withdrawFunds(@Param('paypalAccount') paypalAccount,@Req() req, @Body() body: { amount: number }) {
    const user = req.user
    const amount = body.amount

    const userId = user.userId
    if (!user || !userId) {
      throw new HttpException('User not authenticated', 401)
    }

    // verificar si el usuario tiene suficiente balance para retirar
    const balance = await this.walletService.getBalance(userId)
    if (balance < amount) {
      throw new HttpException('No tienes suficiente balance para retirar esta cantidad', 400)
    }

    // Realiza el payout utilizando el PaypalService
    const payoutResult = await this.paypalService.createPayout(paypalAccount, amount)

    // Actualiza el historial de retiros y reduce el balance del usuario
    await this.walletService.updateWithdrawlHistory(userId, amount)
    await this.walletService.reduceBalance(userId, amount)

    return {
      message: 'Retiro realizado exitosamente',
      payoutResult
    }
  }
}
