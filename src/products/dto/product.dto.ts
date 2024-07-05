
export class ProductDto {
  productId?: string;
  productname: string;
  imgs?: string[];
  price: number;
  quantity: number;
  location?: string;
  SKU?: string;
  duration?: string;
  requirements?: string;
  policies?: string;
  description?: string;
  category?: string;
  attributes?: string[];
  weight?: number;
  dimensions?: {
    length?: number,
    width?: number,
    height?: number
  };
  status?: string[];
  visibility?: boolean;
  Tags?: string[];
  score?: number;
  reviews?: string[];
  discounts?: string[];
  user?: string;
  username?: string;
  country: string[]
  userProfileImg?: string;
  options?: any[]
  especifications?: any[]
}
