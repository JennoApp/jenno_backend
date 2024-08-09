
interface Product {
  _id: string,
  user: string,
}

interface selectedOption {
  name: string
  value: string
}

export class OrderDto {
  product: Product;
  buyerId: string;
  sellerId: string;
  buyerName: string;
  buyerProfileImg: string;
  amount: number;
  status: string;
  selectedOptions: selectedOption[];
}
