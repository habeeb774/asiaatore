# Pages Directory Organization

This directory contains all application pages organized by functionality.

## Directory Structure

```
pages/
├── misc/                     # Miscellaneous pages
│   ├── Home.jsx
│   ├── Chat.jsx
│   ├── SearchResults.jsx
│   ├── OffersPage.jsx
│   └── Shipping.jsx
├── info/                     # Information pages
│   ├── About.jsx
│   ├── Contact.jsx
│   ├── FAQ.jsx
│   └── Blog.jsx
├── products/                 # Product-related pages
│   ├── Product.jsx
│   ├── ProductDetailPage.jsx
│   ├── ProductReviews.jsx
│   ├── Products.jsx
│   ├── Brands.jsx
│   ├── CatalogPage.jsx
│   ├── Categories.jsx
│   └── Collections.jsx
├── checkout/                 # Checkout process
│   ├── Cart.jsx
│   ├── CheckoutPage.jsx
│   └── CheckoutSuccess.jsx
├── orders/                   # Order management
│   ├── Orders.jsx
│   ├── OrderDetails.jsx
│   ├── MyOrders.jsx
│   └── InvoiceViewer.jsx
├── payment/                  # Payment processing
│   ├── PaymentMethod.jsx
│   ├── PaymentProcessing.jsx
│   └── PaymentSelect.jsx
├── legal/                    # Legal pages
│   ├── Legal.jsx
│   ├── Privacy.jsx
│   ├── Terms.jsx
│   └── Returns.jsx
├── features/                 # Feature pages
│   ├── GamificationPage.jsx
│   ├── NFTLoyaltyPage.jsx
│   ├── SubscriptionPlans.jsx
│   ├── PersonalizationPage.jsx
│   ├── SmartInventoryPage.jsx
│   ├── SocialCommercePage.jsx
│   ├── SustainabilityPage.jsx
│   ├── VoiceCommercePage.jsx
│   ├── Wishlist.jsx
│   └── ARViewerPage.jsx
├── store/                    # Store-related pages
│   ├── StoresPage.jsx
│   ├── StoreClone.jsx
│   └── Vendor.jsx
├── dev/                      # Development tools
│   ├── StyleGuide.jsx
│   ├── ToastTest.jsx
│   ├── UIPreview.jsx
│   └── TemplateDemos.jsx
├── account/                  # Account pages (existing)
├── admin/                    # Admin pages (existing)
├── auth/                     # Authentication pages (existing)
├── delivery/                 # Delivery pages (existing)
├── driver/                   # Driver pages (existing)
├── orders/                   # Orders pages (existing)
├── public/                   # Public pages (existing)
└── seller/                   # Seller pages (existing)
```

## Import Path Updates

All import paths in `AppRoutes.jsx` have been updated to reflect the new directory structure. Pages are now organized by their functional domain for better maintainability and scalability.

## Organization Logic

- **misc/**: General-purpose pages that don't fit other categories
- **info/**: Information and content pages (About, Contact, FAQ, Blog)
- **products/**: All product-related pages and catalogs
- **checkout/**: Complete checkout flow and cart management
- **orders/**: Order management and tracking
- **payment/**: Payment processing and methods
- **legal/**: Legal documents and policies
- **features/**: Advanced features and special functionality
- **store/**: Store management and vendor pages
- **dev/**: Development and testing tools

This organization makes the codebase more maintainable and easier to navigate as the application grows.
