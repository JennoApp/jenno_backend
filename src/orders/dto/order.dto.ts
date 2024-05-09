
interface Product {
  user: string
}

export class OrderDto {
  product: Product;
  buyerId: string;
  sellerId: string;
  status: string;
}
