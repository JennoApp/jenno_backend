import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Injectable } from '@nestjs/common'
import { Job } from 'bullmq'
import { OrdersService } from './orders.service'
import { WalletService } from 'src/wallet/wallet.service'

@Injectable()
@Processor('autoCompleteOrder')
export class OrdersProcessor extends WorkerHost {
  constructor(
    private readonly orderService: OrdersService,
    private readonly walletService: WalletService
  ) { super() }

  async process(job: Job) {
    switch (job.name) {
      case 'completeOrder': {
        const { orderId } = job.data

        // cambiar el estado de la orden a 'completed'
        console.log(`Processing job: ${job.name} for orderId: ${orderId}`)
        await this.orderService.updateStatus(orderId, 'completed')
        console.log(`Order ${orderId} marked as completed`)

        // Actualizar el balance disponible y total ganado en el wallet del vendedor
        const order = await this.orderService.getOrder(orderId)
        await this.walletService.updateAvailableAndTotalEarned(order)
        console.log(`Order ${orderId} updated Available balance and total earned`)

        return {
          sucess: true
        }
      }

      default:
        throw new Error(`No handler for job with name ${job.name}`)
    }
  }
}
