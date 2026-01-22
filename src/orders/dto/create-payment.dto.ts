export class CreatePaymentDto {
  items: {
    id: string;
    title: string;
    description?: string;
    quantity: number;
    unit_price: number;
  }[];

  payer: {
    email: string;
    first_name: string;
    last_name: string;
    documentType?: string;
    document: string;
  };
}
