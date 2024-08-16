import { Body, Controller, Param, Post, Get } from "@nestjs/common";
import { WalletService } from './wallet.service'


@Controller('wallet')
export class WalletControler {
  constructor(private walletService: WalletService) {}

  @Get(':walletId')
  getWalletById(@Param('walletId') walletId) {
    return this.walletService.getWalletById(walletId)
  }

  @Post(':userid')
  createWallet(@Param('userid') userid, @Body() wallet) {
    return  this.walletService.createWallet(userid, wallet)
  }
}
