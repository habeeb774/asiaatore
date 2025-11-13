import React, { useState, useEffect } from 'react';
import ProductSlider from '../products/ProductSlider';

// Function to generate random recommended products
const generateRecommendedProducts = () => {
  const products = [
    {
      id: 1,
      name: 'سماعات بلوتوث لاسلكية',
      nameEn: 'Wireless Bluetooth Headphones',
      price: Math.floor(Math.random() * 50) + 120,
      oldPrice: Math.floor(Math.random() * 30) + 150,
      image: '/images/products/bluetooth-headphones.jpg',
      category: 'electronics'
    },
    {
      id: 2,
      name: 'ساعة ذكية مقاومة للماء',
      nameEn: 'Waterproof Smart Watch',
      price: Math.floor(Math.random() * 100) + 180,
      oldPrice: Math.floor(Math.random() * 50) + 230,
      image: '/images/products/smart-watch.jpg',
      category: 'electronics'
    },
    {
      id: 3,
      name: 'حقيبة ظهر عصرية مقاومة للماء',
      nameEn: 'Modern Waterproof Backpack',
      price: Math.floor(Math.random() * 40) + 80,
      oldPrice: Math.floor(Math.random() * 30) + 110,
      image: '/images/products/backpack.jpg',
      category: 'accessories'
    },
    {
      id: 4,
      name: 'لوحة مفاتيح ميكانيكية RGB',
      nameEn: 'RGB Mechanical Keyboard',
      price: Math.floor(Math.random() * 100) + 250,
      oldPrice: Math.floor(Math.random() * 50) + 300,
      image: '/images/products/mechanical-keyboard.jpg',
      category: 'electronics'
    },
    {
      id: 5,
      name: 'فأرة لاسلكية ألعاب',
      nameEn: 'Wireless Gaming Mouse',
      price: Math.floor(Math.random() * 30) + 70,
      oldPrice: Math.floor(Math.random() * 20) + 90,
      image: '/images/products/gaming-mouse.jpg',
      category: 'electronics'
    },
    {
      id: 6,
      name: 'شاحن سريع USB-C',
      nameEn: 'Fast USB-C Charger',
      price: Math.floor(Math.random() * 20) + 40,
      oldPrice: Math.floor(Math.random() * 15) + 55,
      image: '/images/products/usb-charger.jpg',
      category: 'accessories'
    },
    {
      id: 7,
      name: 'سماعات أذن لاسلكية',
      nameEn: 'Wireless Earbuds',
      price: Math.floor(Math.random() * 40) + 100,
      oldPrice: Math.floor(Math.random() * 30) + 130,
      image: '/images/products/earbuds.jpg',
      category: 'electronics'
    },
    {
      id: 8,
      name: 'حافظة هاتف جلدية',
      nameEn: 'Leather Phone Case',
      price: Math.floor(Math.random() * 15) + 25,
      oldPrice: Math.floor(Math.random() * 10) + 35,
      image: '/images/products/phone-case.jpg',
      category: 'accessories'
    }
  ];

  // Shuffle and return random subset
  return products.sort(() => Math.random() - 0.5).slice(0, 6);
};

const RecommendationsSection = () => {
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call delay
    const loadRecommendations = async () => {
      setLoading(true);
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setRecommendedProducts(generateRecommendedProducts());
      setLoading(false);
    };

    loadRecommendations();

    // Refresh recommendations every 30 seconds
    const interval = setInterval(() => {
      setRecommendedProducts(generateRecommendedProducts());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              منتجات مقترحة لك
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              جاري تحميل المنتجات المقترحة...
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-lg p-4 animate-pulse">
                <div className="aspect-square bg-gray-300 dark:bg-gray-600 rounded mb-4"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            منتجات مقترحة لك
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            اكتشف المنتجات التي يوصي بها فريقنا خصيصاً لك - تتحدث كل 30 ثانية
          </p>
        </div>
        <ProductSlider products={recommendedProducts} title="منتجات مقترحة" limit={8} />
      </div>
    </section>
  );
};

export default RecommendationsSection;
