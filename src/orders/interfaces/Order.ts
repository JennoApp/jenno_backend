import { Document } from 'mongoose';

interface Product {
  price: number;
  shippingfee: number;
  amount: number;
}

interface ReturnRequest {
  type: 'refund' | 'exchange';
  reason: string;
  requestedAt: Date;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  approvedAt?: Date;
  processedAt?: Date;
  exchangeProductId?: string;
  approved?: boolean;
  refundAmount?: number;
  mpRefundId?: string; // para reembolsos automáticos con MercadoPago
}

export type OrderStatus =
  | 'pending'
  | 'sending'
  | 'completed'
  | 'cancelled'
  | 'returned'
  | 'refunded'
  | 'payment_failed'
  | 'on_hold';

export interface Order extends Document {
  product: Product;
  buyerId: string;
  sellerId: string;
  buyerName: string;
  buyerProfileImg: string;
  status: OrderStatus;
  amount: number;

  // NUEVO: soporte para solicitudes de devolución o cambio
  returnRequest?: any;
}

