import { t } from '../utils/i18n';
import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getProduct } from '../services/api/products';

export default function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);

  useEffect(() => {
    async function fetchProduct() {
      const productData = await getProduct(id);
      setProduct(productData);
    }
    fetchProduct();
  }, [id]);

  if (!product) return null;

  // Handle multilingual product data
  const productName = typeof product.name === 'object' && product.name[locale]
    ? product.name[locale]
    : typeof product.name === 'string'
    ? product.name
    : 'Product';

  const productDescription = typeof (product.shortDescription || product.description) === 'object' &&
    (product.shortDescription || product.description)[locale]
    ? (product.shortDescription || product.description)[locale]
    : typeof (product.shortDescription || product.description) === 'string'
    ? (product.shortDescription || product.description)
    : '';

  return (
    <div>
      <h1>{productName}</h1>
      <p>{productDescription}</p>
      {/* ...existing code... */}
    </div>
  );
}