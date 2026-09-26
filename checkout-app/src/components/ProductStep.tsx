import { formatPrice, type Product } from "../lib/products";

type Props = {
  product: Product;
  onContinue: () => void;
};

export function ProductStep({ product, onContinue }: Props) {
  return (
    <div className="step">
      <img src={product.imageUrl} alt={product.name} className="step__product-image" />
      <h2 className="step__product-name">{product.name}</h2>
      <p className="step__product-price">{formatPrice(product.price, product.currency)}</p>
      <button className="btn btn--primary" onClick={onContinue}>
        Continue
      </button>
    </div>
  );
}