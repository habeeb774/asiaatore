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
  return (
    <div>
      <h1>{t(product.name)}</h1>
      <p>{t(product.shortDescription || product.description)}</p>
      {/* ...existing code... */}
    </div>
  );
}