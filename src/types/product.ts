export type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  images: string[];
  category: string;
  sizes: string[];
  colors: string[];
  material: string;
};

export type CartItem = {
  id: string;
  product: Product;
  quantity: number;
  selectedSize: string;
  selectedColor: string;
  customizations: Customization[];
};

export type Customization = {
  type: string;
  option: string;
  value: string;
};

export type Measurement = {
  label: string;
  value: number;
  unit: string;
};

export type SizeRecommendation = {
  productId: string;
  recommendedSize: string;
  measurements: Measurement[];
};
