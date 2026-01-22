import { Schema } from 'mongoose'

export const PaymentSchema = new Schema({
    externalReference: {
        type: String,
        required: true,
        unique: true
    },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'approved', 'rejected', 'cancelled', 'in_process'],
        default: 'pending'
    },
    items: {
        type: [],

    },
    buyer: {},
    preferenceId: String,
    initPoint: String,
    providerPaymentId: String,
    rawResponse: {},
    orderIds: [String]
})
