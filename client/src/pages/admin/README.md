# Admin Directory Organization

This directory contains all admin-related pages and components organized by functionality.

## Directory Structure

```
admin/
├── Settings.jsx              # Main settings page
├── analytics/                # Analytics and reporting
│   ├── Analytics.jsx
│   └── AnalyticsDashboard.jsx
├── dashboard/                # Dashboard components
│   ├── AdminDashboard.jsx
│   ├── Dashboard.jsx
│   └── Dashboard.css
├── integrations/             # Third-party integrations
│   ├── Apps.jsx
│   ├── DeveloperSettings.jsx
│   ├── EnvEditor.jsx
│   ├── ExperimentsPage.jsx
│   ├── Integrations.jsx
│   └── Marketing.jsx
├── orders/                   # Order management
│   ├── BankTransfers.jsx
│   ├── Invoices.jsx
│   ├── Orders.jsx
│   └── OrdersManagement.jsx
├── products/                 # Product management (legacy redirects + utilities)
│   ├── BrandsAdmin.jsx
│   ├── CategoriesAdmin.jsx
│   ├── ProductInventory.jsx  # Locale-aware redirect to /admin/products
│   └── ReviewsAdmin.jsx
├── reports/                  # Reports and auditing
│   ├── AuditAdmin.jsx
│   └── Reports.jsx
├── settings/                 # Settings components
│   ├── SettingsCompanyFooter.jsx
│   ├── SettingsHero.jsx
│   ├── SettingsLinksApps.jsx
│   ├── SettingsLogo.jsx
│   ├── SettingsShippingPayment.jsx
│   ├── SettingsShippingProviders.jsx
│   ├── SettingsTopStrip.jsx
│   ├── SettingsUi.jsx
│   ├── SettingsWhatsapp.jsx
│   ├── Settings.css
│   └── README.md
├── users/                    # User management
│   ├── AdminKycReview.jsx
│   ├── AdminUsers.jsx
│   ├── Customers.jsx
│   ├── Sellers.jsx
│   ├── SellersList.jsx
│   └── SellersManagement.jsx
├── components/               # Shared admin components
├── hooks/                    # Custom hooks for admin
└── views/                    # View components (e.g., ProductsView, OverviewView)
```

## Import Path Updates

All import paths have been updated in `AppRoutes.jsx` to reflect the new directory structure. Components are now organized by their functional domain for better maintainability and scalability.
