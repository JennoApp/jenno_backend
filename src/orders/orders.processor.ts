import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Injectable } from '@nestjs/common'
import { Job } from 'bullmq'
import { OrdersService } from './orders.service'

@Injectable()
@Processor('autoCompleteOrder')
export class OrdersProcessor extends WorkerHost {
  constructor(private readonly orderService: OrdersService) { super() }

  async process(job: Job) {
    switch (job.name) {
      case 'completeOrder': {
        const { orderId } = job.data

        // cambiar el estado de la orden a 'completed'
        console.log(`Processing job: ${job.name} for orderId: ${orderId}`)
        await this.orderService.updateStatus(orderId, 'completed')
        console.log(`Order ${orderId} marked as completed`)

        return {
          sucess: true
        }
      }

      default:
        throw new Error(`No handler for job with name ${job.name}`)
    }
  }
}
