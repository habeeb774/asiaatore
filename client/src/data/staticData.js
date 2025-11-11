/**
 * Static data for MainHome components
 * Contains fallback data for products, banners, and other static content
 */

export const FALLBACK_PRODUCTS = {
  hotDeals: [
    {
      id: 'hot-1',
      nameAr: 'لابتوب ديل',
      nameEn: 'Dell Laptop',
      price: 2500,
      oldPrice: 3500,
      images: ['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=400&q=80'],
      category: 'electronics'
    },
    {
      id: 'hot-2',
      nameAr: 'هاتف سامسونج',
      nameEn: 'Samsung Phone',
      price: 1200,
      oldPrice: 1800,
      images: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80'],
      category: 'phones'
    },
    {
      id: 'hot-3',
      nameAr: 'سماعات سوني',
      nameEn: 'Sony Headphones',
      price: 300,
      oldPrice: 500,
      images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80'],
      category: 'electronics'
    },
    {
      id: 'hot-4',
      nameAr: 'تلفزيون LG',
      nameEn: 'LG TV',
      price: 1800,
      oldPrice: 2500,
      images: ['https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=400&q=80'],
      category: 'electronics'
    }
  ],

  electronics: [
    {
      id: 'elec-1',
      nameAr: 'ماك بوك برو',
      nameEn: 'MacBook Pro',
      price: 4500,
      oldPrice: 5500,
      images: ['https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=400&q=80'],
      category: 'electronics'
    },
    {
      id: 'elec-2',
      nameAr: 'آيفون 15',
      nameEn: 'iPhone 15',
      price: 3200,
      oldPrice: 4000,
      images: ['https://images.unsplash.com/photo-1592899677977-9e10ca588bbd?auto=format&fit=crop&w=400&q=80'],
      category: 'phones'
    },
    {
      id: 'elec-3',
      nameAr: 'بلاي ستيشن 5',
      nameEn: 'PlayStation 5',
      price: 1800,
      oldPrice: 2200,
      images: ['https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=400&q=80'],
      category: 'electronics'
    },
    {
      id: 'elec-4',
      nameAr: 'سماعات وايرلس',
      nameEn: 'Wireless Earbuds',
      price: 150,
      oldPrice: 250,
      images: ['https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?auto=format&fit=crop&w=400&q=80'],
      category: 'electronics'
    }
  ],

  appliances: [
    {
      id: 'app-1',
      nameAr: 'ثلاجة سامسونج',
      nameEn: 'Samsung Fridge',
      price: 2200,
      oldPrice: 3000,
      images: ['https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=400&q=80'],
      category: 'appliances'
    },
    {
      id: 'app-2',
      nameAr: 'غسالة LG',
      nameEn: 'LG Washing Machine',
      price: 1600,
      oldPrice: 2200,
      images: ['https://images.unsplash.com/photo-1626806787426-5910811b6325?auto=format&fit=crop&w=400&q=80'],
      category: 'appliances'
    },
    {
      id: 'app-3',
      nameAr: 'ميكروويف باناسونيك',
      nameEn: 'Panasonic Microwave',
      price: 250,
      oldPrice: 350,
      images: ['https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=400&q=80'],
      category: 'appliances'
    },
    {
      id: 'app-4',
      nameAr: 'مكيف هواء',
      nameEn: 'Air Conditioner',
      price: 1200,
      oldPrice: 1800,
      images: ['https://images.unsplash.com/photo-1588854337236-6889d631faa8?auto=format&fit=crop&w=400&q=80'],
      category: 'appliances'
    }
  ],

  mobiles: [
    {
      id: 'mob-1',
      nameAr: 'سامسونج جالاكسي S24',
      nameEn: 'Samsung Galaxy S24',
      price: 2800,
      oldPrice: 3500,
      images: ['https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=400&q=80'],
      category: 'phones'
    },
    {
      id: 'mob-2',
      nameAr: 'آيفون 15 برو',
      nameEn: 'iPhone 15 Pro',
      price: 4200,
      oldPrice: 5000,
      images: ['https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=400&q=80'],
      category: 'phones'
    },
    {
      id: 'mob-3',
      nameAr: 'هواوي ميت 50',
      nameEn: 'Huawei Mate 50',
      price: 1800,
      oldPrice: 2400,
      images: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80'],
      category: 'phones'
    },
    {
      id: 'mob-4',
      nameAr: 'أوبو A96',
      nameEn: 'Oppo A96',
      price: 800,
      oldPrice: 1200,
      images: ['https://images.unsplash.com/photo-1605236453806-6ff36851218e?auto=format&fit=crop&w=400&q=80'],
      category: 'phones'
    }
  ]
};

export const BANNER_IMAGES = {
  bannerImages2: [
    'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=80'
  ],

  bannerImages3: [
    'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1607082350899-7e105aa886ae?auto=format&fit=crop&w=400&q=80'
  ]
};

export const DEFAULT_SLIDES = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&q=80',
    titleAr: 'عروض هائلة اليوم!',
    titleEn: 'Massive Deals Today!',
    subtitleAr: 'خصومات تصل إلى 70%',
    subtitleEn: 'Up to 70% off',
    link: '#offers'
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1607082350899-7e105aa886ae?auto=format&fit=crop&w=1200&q=80',
    titleAr: 'إلكترونيات حديثة',
    titleEn: 'Latest Electronics',
    subtitleAr: 'أحدث الأجهزة والتكنولوجيا',
    subtitleEn: 'Newest gadgets & technology',
    link: '#electronics'
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80',
    titleAr: 'أزياء عصرية',
    titleEn: 'Modern Fashion',
    subtitleAr: 'أحدث صيحات الموضة',
    subtitleEn: 'Latest fashion trends',
    link: '#fashion'
  }
];

export const BANNERS_4_DATA = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1607083206968-13611e3d76db?auto=format&fit=crop&w=400&q=80',
    title1Ar: 'خصومات',
    title1En: 'Discounts',
    title2Ar: 'على الإلكترونيات',
    title2En: 'on Electronics',
    discount: '70%',
    link: '#electronics'
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=400&q=80',
    title1Ar: 'أزياء',
    title1En: 'Fashion',
    title2Ar: 'جديدة',
    title2En: 'New Arrivals',
    discount: '50%',
    link: '#fashion'
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=400&q=80',
    title1Ar: 'أجهزة',
    title1En: 'Appliances',
    title2Ar: 'منزلية',
    title2En: 'Home Appliances',
    discount: '60%',
    link: '#appliances'
  },
  {
    id: 4,
    image: 'https://images.unsplash.com/photo-1607082350899-7e105aa886ae?auto=format&fit=crop&w=400&q=80',
    title1Ar: 'هواتف',
    title1En: 'Phones',
    title2Ar: 'ذكية',
    title2En: '& Tablets',
    discount: '40%',
    link: '#phones'
  }
];