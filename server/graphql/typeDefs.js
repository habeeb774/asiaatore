export default `#graphql
  scalar JSON

  type User { id: ID! email: String! role: String! name: String }

  type Brand { id: ID! slug: String! nameAr: String! nameEn: String! logo: String }
  type ProductImage { id: ID! url: String! altEn: String, altAr: String, sort: Int }
  type TierPrice { id: ID! minQty: Int! price: Float! packagingType: String! noteAr: String, noteEn: String }
  type Product {
    id: ID!
    slug: String!
    nameAr: String!
    nameEn: String!
    shortAr: String
    shortEn: String
    category: String!
    price: Float!
    oldPrice: Float
    image: String
    rating: Int
    stock: Int
    brand: Brand
    productImages: [ProductImage!]!
    tierPrices: [TierPrice!]!
    createdAt: String!
    updatedAt: String!
  }

  type OrderItem { id: ID! productId: String! nameAr: String! nameEn: String! price: Float! oldPrice: Float quantity: Int! }
  type Order {
    id: ID!
    userId: String!
    status: String!
    currency: String!
    subtotal: Float!
    discount: Float!
    tax: Float!
    grandTotal: Float!
    paymentMethod: String
    paymentMeta: JSON
    items: [OrderItem!]!
    createdAt: String!
    updatedAt: String!
  }

  type ProductPage { items: [Product!]! page: Int! pageSize: Int! total: Int! totalPages: Int! }
  type OrderPage { items: [Order!]! page: Int! pageSize: Int! total: Int! totalPages: Int! }

  input OrderItemInput { productId: String!, quantity: Int!, price: Float, nameAr: String, nameEn: String, oldPrice: Float }
  input CreateOrderInput { items: [OrderItemInput!]!, currency: String, paymentMethod: String, paymentMeta: JSON }
  input UpdateOrderInput { status: String, paymentMethod: String, paymentMeta: JSON, items: [OrderItemInput!] }

  type Query {
    me: User
    products(q: String, category: String, minPrice: Float, maxPrice: Float, page: Int, pageSize: Int): ProductPage
    product(id: ID!): Product
    orders(page: Int, pageSize: Int, status: String): OrderPage
    order(id: ID!): Order
  }

  type Mutation {
    createOrder(input: CreateOrderInput!): Order
    updateOrder(id: ID!, input: UpdateOrderInput!): Order
  }
`;
