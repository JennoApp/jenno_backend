import { Body, Controller, Param, Post } from "@nestjs/common";
import { WalletService } from './wallet.service'


@Controller('wallet')
export class WalletControler {
  constructor(private walletService: WalletService) {}

  @Post(':userid')
  createWallet(@Param('userid') userid, @Body() wallet) {
    return  this.walletService.createWallet(userid, wallet)
  }
}
