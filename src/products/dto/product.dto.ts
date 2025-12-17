// DTO para opciones simples (coincide con optionSchema)
export class SimpleOptionDto {
  name: string;
  values: string[]; // Solo strings, como en el schema
}

// DTO para variants (opciones complejas)
export class VariantDto {
  sku?: string;
  price!: number;
  quantity?: number;
  imgs?: string[];
  options?: { name: string; value: string }[];
  weight?: number;
  meta?: any;
}

// DTO para especificaciones
export class EspecificationDto {
  title: string;
  content: string;
}

// DTO principal del producto
export class ProductDto {
  productId?: string;
  productname: string;
  imgs?: string[];
  price?: number; // Opcional si usas variants
  quantity?: number;
  location?: string;
  SKU?: string;
  duration?: string;
  requirements?: string;
  policies?: string;
  description?: string;
  additionalInfo?: string;
  category?: string;
  shippingfee?: number;
  attributes?: string[];
  weight?: number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };
  status?: string;
  visibility?: boolean;
  Tags?: string[];
  score?: number;
  reviews?: string[];
  discounts?: string[];
  user?: string;
  username?: string;
  country: string[];
  userProfileImg?: string;

  // OPCIONES SIMPLES: { name, values: [strings] }
  options?: SimpleOptionDto[];

  // VARIANTS: opciones complejas con precio, stock, etc.
  variants?: VariantDto[];

  // ESPECIFICACIONES
  especifications?: EspecificationDto[];
}
