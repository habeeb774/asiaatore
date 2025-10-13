import Product from '../Product'
import '../../styles/ProductList.scss';

const ProductList = ({ addToCart }) => {
  // بيانات المنتجات الافتراضية
  const products = [
    {
      id: 1,
      name: "iPhone 14 Pro",
      price: 999,
  image: "/vite.svg",
      description: "Latest iPhone with advanced camera system"
    },
    {
      id: 2,
      name: "Samsung Galaxy S23",
      price: 849,
  image: "/vite.svg",
      description: "Powerful Android smartphone"
    },
    {
      id: 3,
      name: "MacBook Pro",
      price: 1999,
  image: "/vite.svg",
      description: "Professional laptop for creators"
    },
    {
      id: 4,
      name: "iPad Air",
      price: 599,
  image: "/vite.svg",
      description: "Versatile tablet for work and play"
    },
    {
      id: 5,
      name: "AirPods Pro",
      price: 249,
  image: "/vite.svg",
      description: "Wireless earbuds with noise cancellation"
    },
    {
      id: 6,
      name: "Apple Watch",
      price: 399,
  image: "/vite.svg",
      description: "Smartwatch for health and fitness"
    }
  ]

  return (
    <div className="product-list">
      <h2 className="section-title">Our Products</h2>
      <div className="products-grid">
        {products.map(product => (
          <Product 
            key={product.id} 
            product={product} 
            addToCart={addToCart}
          />
        ))}
      </div>
    </div>
  )
}

export default ProductList