import { Module } from '@nestjs/common'
import { MarketingController } from './marketing.controller'
import { MarketingService } from './marketing.service'
import { UsersModule } from '../users/users.module'

@Module({
  imports: [ UsersModule ],
  controllers: [ MarketingController ],
  providers: [ MarketingService ],
  exports: [],
})


export class MarketingModule { }
