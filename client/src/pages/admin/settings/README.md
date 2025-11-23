# Settings Components

This directory contains all the modular settings components for the admin settings page.

## Components

- **SettingsUi.jsx** - UI components and theme settings
- **SettingsLogo.jsx** - Logo upload and preview
- **SettingsWhatsapp.jsx** - WhatsApp integration settings
- **SettingsShippingPayment.jsx** - Shipping and payment configuration
- **SettingsShippingProviders.jsx** - Shipping providers (Aramex, SMSA)
- **SettingsLinksApps.jsx** - Important links and mobile apps
- **SettingsCompanyFooter.jsx** - Company footer information
- **SettingsTopStrip.jsx** - Top strip configuration
- **SettingsHero.jsx** - Hero section settings
- **Settings.css** - Styles for all settings components

## Architecture

Each component is a modular piece that receives props from the main Settings component:
- `form` - Current form data
- `onChange` - Function to update form data
- `errors` - Validation errors (if applicable)
- Component-specific props for special functionality

## Import Paths

All components are imported from the main Settings.jsx using relative paths:
```javascript
import SettingsUi from './settings/SettingsUi';
```
