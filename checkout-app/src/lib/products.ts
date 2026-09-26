export type Product = {
  id: string;
  name: string;
  price: number; // cents
  currency: string;
  imageUrl: string;
};

const PRODUCTS: Record<string, Product> = {
  prod_123: {
    id: "prod_123",
    name: "Wireless Keyboard",
    price: 4900,
    currency: "USD",
    imageUrl: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=200&q=80",
  },
  prod_456: {
    id: "prod_456",
    name: "Noise-Cancelling Headphones",
    price: 19900,
    currency: "USD",
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80",
  },
};

export function getProduct(productId: string): Product | null {
  return PRODUCTS[productId] ?? null;
}

export function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}