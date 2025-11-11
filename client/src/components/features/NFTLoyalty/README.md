# NFT Loyalty Program Component

A comprehensive NFT-based loyalty program component that integrates blockchain-inspired digital collectibles with e-commerce rewards.

## Features

- **NFT Minting**: Users can mint exclusive NFTs using loyalty points
- **Tier System**: Multi-tier loyalty program (Bronze, Silver, Gold, Platinum, Diamond)
- **Rarity System**: NFTs with different rarity levels (Common, Uncommon, Rare, Epic, Legendary)
- **Requirements System**: NFTs unlock based on user achievements and purchases
- **Collection Management**: Users can view and manage their NFT collection
- **Marketplace**: Browse available NFTs and mint new ones
- **Statistics Dashboard**: Track loyalty progress, NFT rarity distribution, and achievements
- **Multi-language Support**: Full RTL and LTR language support
- **Dark Mode**: Complete dark mode compatibility

## Usage

### Basic Setup

```jsx
import { NFTLoyaltyProvider, NFTLoyaltyDashboard } from './components/NFTLoyalty';

function App() {
  return (
    <NFTLoyaltyProvider>
      <NFTLoyaltyDashboard />
    </NFTLoyaltyProvider>
  );
}
```

### Using the Hook

```jsx
import { useNFTLoyalty } from './components/NFTLoyalty';

function CustomComponent() {
  const {
    userNFTs,
    userStats,
    mintNFT,
    getAvailableNFTsForUser,
    getNextTierProgress
  } = useNFTLoyalty();

  const handleMint = (nftId) => {
    const result = mintNFT(nftId);
    if (result.success) {
      console.log('NFT minted:', result.nft);
    }
  };

  return (
    <div>
      <p>Loyalty Points: {userStats.loyaltyPoints}</p>
      <button onClick={() => handleMint(1)}>Mint NFT</button>
    </div>
  );
}
```

## API Reference

### NFTLoyaltyProvider

Context provider that manages NFT loyalty state.

**Props:**
- `children`: React components to be wrapped

### useNFTLoyalty Hook

Returns NFT loyalty context values and functions.

**Returns:**
- `userNFTs`: Array of user's owned NFTs
- `availableNFTs`: Array of all available NFTs
- `loyaltyTiers`: Object containing tier definitions
- `userStats`: User's current loyalty statistics
- `mintNFT(nftId)`: Function to mint an NFT
- `getAvailableNFTsForUser()`: Get NFTs available for current user
- `getNextTierProgress()`: Get progress to next tier
- `transferNFT(nftId, recipientAddress)`: Transfer NFT (future feature)
- `getNFTRarityStats()`: Get NFT rarity distribution
- `checkRequirements(requirements)`: Check if user meets NFT requirements

### NFTLoyaltyDashboard

Main dashboard component for NFT loyalty program.

**Props:**
- `className`: Additional CSS classes

## NFT Structure

```javascript
{
  id: 1,
  name: "Golden Shopping Spree",
  description: "Exclusive golden NFT for loyal customers",
  image: "/api/placeholder/300/300",
  rarity: "Legendary",
  rarityColor: "from-yellow-400 to-orange-500",
  price: 500,
  requirements: {
    purchases: 50,
    tier: "gold"
  },
  benefits: ["10% lifetime discount", "Priority support"],
  attributes: {
    "Background": "Golden",
    "Rarity": "Legendary",
    "Benefits": "VIP Access"
  }
}
```

## Requirements System

NFTs can have various requirements:

- `purchases`: Minimum number of total purchases
- `tier`: Required loyalty tier
- `ecoScore`: Minimum eco-friendliness score
- `sustainablePurchases`: Minimum sustainable purchases
- `categoryPurchases`: Object with category-specific purchase counts

## Tier System

- **Bronze**: 0+ points - 1% discount
- **Silver**: 500+ points - 2% discount, free shipping
- **Gold**: 1,500+ points - 5% discount, priority support, exclusive NFTs
- **Platinum**: 5,000+ points - 10% discount, VIP events, personal shopper
- **Diamond**: 10,000+ points - 15% discount, all-access pass, custom products

## Rarity Levels

- **Common**: Basic NFTs for entry-level users
- **Uncommon**: Slightly rarer with better benefits
- **Rare**: Valuable NFTs with significant perks
- **Epic**: High-value NFTs with premium benefits
- **Legendary**: Ultra-rare NFTs with exclusive access

## Styling

The component uses Tailwind CSS classes and supports:
- Light/dark mode
- RTL/LTR text direction
- Responsive design
- Gradient backgrounds for rarity indicators
- Hover effects and transitions

## Dependencies

- React 18+
- Tailwind CSS
- LanguageContext (for internationalization)
- Modal, LazyImage, SkeletonLoader components

## Future Enhancements

- Blockchain integration for true NFT ownership
- NFT trading marketplace
- Cross-platform NFT transfers
- Dynamic NFT metadata updates
- Social features for NFT showcasing
- Integration with external wallets