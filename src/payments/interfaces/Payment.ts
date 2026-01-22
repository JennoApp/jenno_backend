import { Document } from 'mongoose';

export type PaymentStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'in_process';

export interface Payment extends Document {
  externalReference: string;
  status: PaymentStatus;
  items: any[];
  buyer?: {
    _id?: string;
    email?: string;
    name?: string;
    lastname?: string;
    document?: string;
    documentType?: string;
    [key: string]: any;
  };

  preferenceId?: string;
  initPoint?: string;

  providerPaymentId?: string;

  rawResponse?: any;

  orderIds?: string[];

  createdAt?: Date;
  updatedAt?: Date;
}
