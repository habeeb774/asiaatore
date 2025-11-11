import React, { useState, useEffect, useContext, createContext } from 'react';
import { useLanguage } from '../../../stores/LanguageContext';

const NFTLoyaltyContext = createContext();

export const useNFTLoyalty = () => {
  const context = useContext(NFTLoyaltyContext);
  if (!context) {
    throw new Error('useNFTLoyalty must be used within a NFTLoyaltyProvider');
  }
  return context;
};

export const NFTLoyaltyProvider = ({ children }) => {
  const [userNFTs, setUserNFTs] = useState([]);
  const [availableNFTs, setAvailableNFTs] = useState([]);
  const [loyaltyTiers, setLoyaltyTiers] = useState({});
  const [userStats, setUserStats] = useState({
    currentTier: 'bronze',
    loyaltyPoints: 1250,
    totalPurchases: 45,
    nftCount: 3,
    rarityScore: 85
  });

  // Initialize with sample data
  useEffect(() => {
    const sampleAvailableNFTs = [
      {
        id: 1,
        name: 'Golden Shopping Spree',
        description: 'Exclusive golden NFT for loyal customers with 50+ purchases',
        image: '/api/placeholder/300/300',
        rarity: 'Legendary',
        rarityColor: 'from-yellow-400 to-orange-500',
        price: 500,
        requirements: { purchases: 50, tier: 'gold' },
        benefits: ['10% lifetime discount', 'Priority support', 'Exclusive events access'],
        attributes: {
          'Background': 'Golden',
          'Rarity': 'Legendary',
          'Benefits': 'VIP Access'
        }
      },
      {
        id: 2,
        name: 'Eco Warrior Badge',
        description: 'Celebrating your commitment to sustainable shopping',
        image: '/api/placeholder/300/300',
        rarity: 'Epic',
        rarityColor: 'from-purple-500 to-pink-600',
        price: 300,
        requirements: { ecoScore: 80, sustainablePurchases: 10 },
        benefits: ['5% eco-discount', 'Tree planting certificate', 'Green badge display'],
        attributes: {
          'Background': 'Forest Green',
          'Rarity': 'Epic',
          'Theme': 'Eco-Friendly'
        }
      },
      {
        id: 3,
        name: 'Fashion Icon Token',
        description: 'Show off your fashion expertise with this stylish NFT',
        image: '/api/placeholder/300/300',
        rarity: 'Rare',
        rarityColor: 'from-blue-500 to-cyan-600',
        price: 200,
        requirements: { categoryPurchases: { fashion: 20 } },
        benefits: ['Fashion insider access', 'Early sale notifications', 'Style consultation'],
        attributes: {
          'Background': 'Urban Chic',
          'Rarity': 'Rare',
          'Category': 'Fashion'
        }
      },
      {
        id: 4,
        name: 'Tech Enthusiast Card',
        description: 'For the gadget lovers and tech aficionados',
        image: '/api/placeholder/300/300',
        rarity: 'Uncommon',
        rarityColor: 'from-green-500 to-teal-600',
        price: 150,
        requirements: { categoryPurchases: { electronics: 15 } },
        benefits: ['Tech product previews', 'Beta testing access', 'Exclusive discounts'],
        attributes: {
          'Background': 'Circuit Board',
          'Rarity': 'Uncommon',
          'Category': 'Technology'
        }
      }
    ];

    const sampleUserNFTs = [
      {
        id: 101,
        name: 'Silver Shopper',
        description: 'Your first step into NFT loyalty rewards',
        image: '/api/placeholder/200/200',
        rarity: 'Common',
        rarityColor: 'from-gray-400 to-gray-600',
        acquiredDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        tokenId: 'NFT-001-12345',
        benefits: ['2% discount', 'Birthday rewards'],
        attributes: {
          'Background': 'Silver',
          'Rarity': 'Common',
          'Tier': 'Silver'
        }
      },
      {
        id: 102,
        name: 'Review Master',
        description: 'Awarded for being an active product reviewer',
        image: '/api/placeholder/200/200',
        rarity: 'Uncommon',
        rarityColor: 'from-green-500 to-teal-600',
        acquiredDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        tokenId: 'NFT-002-67890',
        benefits: ['Priority review visibility', 'Exclusive reviewer badge'],
        attributes: {
          'Background': 'Review Green',
          'Rarity': 'Uncommon',
          'Achievement': 'Reviewer'
        }
      }
    ];

    const sampleTiers = {
      bronze: { name: 'Bronze', minPoints: 0, color: 'from-amber-600 to-yellow-700', benefits: ['1% discount'] },
      silver: { name: 'Silver', minPoints: 500, color: 'from-gray-400 to-gray-600', benefits: ['2% discount', 'Free shipping'] },
      gold: { name: 'Gold', minPoints: 1500, color: 'from-yellow-400 to-orange-500', benefits: ['5% discount', 'Priority support', 'Exclusive NFTs'] },
      platinum: { name: 'Platinum', minPoints: 5000, color: 'from-slate-300 to-slate-500', benefits: ['10% discount', 'VIP events', 'Personal shopper'] },
      diamond: { name: 'Diamond', minPoints: 10000, color: 'from-cyan-400 to-blue-600', benefits: ['15% discount', 'All-access pass', 'Custom products'] }
    };

    setAvailableNFTs(sampleAvailableNFTs);
    setUserNFTs(sampleUserNFTs);
    setLoyaltyTiers(sampleTiers);
  }, []);

  // Mint NFT
  const mintNFT = (nftId) => {
    const nft = availableNFTs.find(n => n.id === nftId);
    if (!nft || userStats.loyaltyPoints < nft.price) {
      return { success: false, message: 'Insufficient points or NFT not available' };
    }

    // Check requirements
    if (!checkRequirements(nft.requirements)) {
      return { success: false, message: 'Requirements not met' };
    }

    // Deduct points
    setUserStats(prev => ({
      ...prev,
      loyaltyPoints: prev.loyaltyPoints - nft.price,
      nftCount: prev.nftCount + 1
    }));

    // Add to user collection
    const newNFT = {
      ...nft,
      id: Date.now(),
      acquiredDate: new Date(),
      tokenId: `NFT-${nftId.toString().padStart(3, '0')}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
    };

    setUserNFTs(prev => [...prev, newNFT]);

    return { success: true, message: 'NFT minted successfully!', nft: newNFT };
  };

  // Check if user meets NFT requirements
  const checkRequirements = (requirements) => {
    if (requirements.purchases && userStats.totalPurchases < requirements.purchases) return false;
    if (requirements.tier && userStats.currentTier !== requirements.tier) return false;
    if (requirements.ecoScore && userStats.ecoScore < requirements.ecoScore) return false;
    if (requirements.sustainablePurchases && userStats.sustainablePurchases < requirements.sustainablePurchases) return false;
    if (requirements.categoryPurchases) {
      for (const [category, count] of Object.entries(requirements.categoryPurchases)) {
        if (!userStats.categoryPurchases?.[category] || userStats.categoryPurchases[category] < count) {
          return false;
        }
      }
    }
    return true;
  };

  // Get available NFTs for user
  const getAvailableNFTsForUser = () => {
    return availableNFTs.filter(nft => {
      const meetsRequirements = checkRequirements(nft.requirements);
      const canAfford = userStats.loyaltyPoints >= nft.price;
      const notOwned = !userNFTs.some(userNft => userNft.name === nft.name);
      return meetsRequirements && canAfford && notOwned;
    });
  };

  // Calculate next tier progress
  const getNextTierProgress = () => {
    const currentTier = userStats.currentTier;
    const tiers = Object.keys(loyaltyTiers);
    const currentIndex = tiers.indexOf(currentTier);

    if (currentIndex === tiers.length - 1) {
      return { nextTier: null, progress: 100, pointsNeeded: 0 };
    }

    const nextTier = tiers[currentIndex + 1];
    const nextTierMin = loyaltyTiers[nextTier].minPoints;
    const currentPoints = userStats.loyaltyPoints;
    const pointsNeeded = nextTierMin - currentPoints;
    const progress = Math.min(100, (currentPoints / nextTierMin) * 100);

    return { nextTier, progress, pointsNeeded };
  };

  // Transfer NFT (future feature)
  const transferNFT = (nftId, recipientAddress) => {
    // This would integrate with blockchain
    console.log('Transferring NFT', nftId, 'to', recipientAddress);
    return { success: true, message: 'Transfer initiated' };
  };

  // Get NFT rarity distribution
  const getNFTRarityStats = () => {
    const total = userNFTs.length;
    const distribution = userNFTs.reduce((acc, nft) => {
      acc[nft.rarity] = (acc[nft.rarity] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(distribution).map(([rarity, count]) => ({
      rarity,
      count,
      percentage: ((count / total) * 100).toFixed(1)
    }));
  };

  const value = {
    userNFTs,
    availableNFTs,
    loyaltyTiers,
    userStats,
    mintNFT,
    getAvailableNFTsForUser,
    getNextTierProgress,
    transferNFT,
    getNFTRarityStats,
    checkRequirements
  };

  return (
    <NFTLoyaltyContext.Provider value={value}>
      {children}
    </NFTLoyaltyContext.Provider>
  );
};

const NFTLoyaltyDashboard = ({ className = '' }) => {
  const {
    userNFTs,
    availableNFTs,
    loyaltyTiers,
    userStats,
    mintNFT,
    getAvailableNFTsForUser,
    getNextTierProgress,
    getNFTRarityStats,
    checkRequirements
  } = useNFTLoyalty();

  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState('collection');
  const [mintingMessage, setMintingMessage] = useState(null);

  const tabs = [
    { id: 'collection', label: language.code === 'ar' ? 'مجموعتي' : 'My Collection', count: userNFTs.length },
    { id: 'marketplace', label: language.code === 'ar' ? 'السوق' : 'Marketplace' },
    { id: 'tiers', label: language.code === 'ar' ? 'المستويات' : 'Tiers' },
    { id: 'stats', label: language.code === 'ar' ? 'الإحصائيات' : 'Stats' }
  ];

  const availableForUser = getAvailableNFTsForUser();
  const nextTier = getNextTierProgress();
  const rarityStats = getNFTRarityStats();

  const handleMint = (nftId) => {
    const result = mintNFT(nftId);
    setMintingMessage(result);

    setTimeout(() => setMintingMessage(null), 5000);
  };

  return (
    <div className={`nft-loyalty-dashboard ${className}`} dir={language.direction}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            🏆 {language.code === 'ar' ? 'برنامج الولاء NFT' : 'NFT Loyalty Program'}
          </h2>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {language.code === 'ar' ? 'نقاط الولاء' : 'Loyalty Points'}
              </div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {userStats.loyaltyPoints.toLocaleString()}
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r ${loyaltyTiers[userStats.currentTier]?.color} text-white`}>
              {loyaltyTiers[userStats.currentTier]?.name} {language.code === 'ar' ? 'عضو' : 'Member'}
            </div>
          </div>
        </div>

        {/* Minting Message */}
        {mintingMessage && (
          <div className={`p-4 rounded-lg mb-4 ${
            mintingMessage.success
              ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
              : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
          }`}>
            <div className="flex items-center gap-2">
              <span className="text-lg">
                {mintingMessage.success ? '✅' : '❌'}
              </span>
              <span>{mintingMessage.message}</span>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-96">
          {activeTab === 'collection' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userNFTs.map((nft) => (
                <NFTCard key={nft.id} nft={nft} owned={true} />
              ))}
              {userNFTs.length === 0 && (
                <div className="col-span-full text-center py-8">
                  <div className="text-4xl mb-4">🏆</div>
                  <p className="text-gray-500 dark:text-gray-400">
                    {language.code === 'ar' ? 'لا توجد NFTs بعد. ابدأ في كسب النقاط واكتساب المكافآت!' : 'No NFTs yet. Start earning points and unlocking rewards!'}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'marketplace' && (
            <div className="space-y-6">
              {/* Available NFTs */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {language.code === 'ar' ? 'NFTs متاحة لك' : 'Available NFTs for You'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableForUser.map((nft) => (
                    <NFTCard
                      key={nft.id}
                      nft={nft}
                      owned={false}
                      onMint={() => handleMint(nft.id)}
                      canAfford={userStats.loyaltyPoints >= nft.price}
                    />
                  ))}
                </div>
                {availableForUser.length === 0 && (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">🔒</div>
                    <p className="text-gray-500 dark:text-gray-400">
                      {language.code === 'ar' ? 'لا توجد NFTs متاحة حالياً. استمر في التسوق لفتح المزيد!' : 'No NFTs available right now. Keep shopping to unlock more!'}
                    </p>
                  </div>
                )}
              </div>

              {/* All NFTs */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {language.code === 'ar' ? 'جميع NFTs المتاحة' : 'All Available NFTs'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableNFTs.map((nft) => (
                    <NFTCard
                      key={nft.id}
                      nft={nft}
                      owned={false}
                      onMint={() => handleMint(nft.id)}
                      canAfford={userStats.loyaltyPoints >= nft.price}
                      meetsRequirements={checkRequirements(nft.requirements)}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tiers' && (
            <div className="space-y-6">
              {/* Current Tier Progress */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-6 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {language.code === 'ar' ? 'تقدم المستوى الحالي' : 'Current Tier Progress'}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {loyaltyTiers[userStats.currentTier]?.name} {language.code === 'ar' ? 'عضو' : 'Member'}
                    </p>
                  </div>
                  {nextTier.nextTier && (
                    <div className="text-right">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {language.code === 'ar' ? 'النقاط المطلوبة' : 'Points Needed'}
                      </div>
                      <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                        {nextTier.pointsNeeded.toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>

                {nextTier.nextTier ? (
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <span>{loyaltyTiers[userStats.currentTier]?.name}</span>
                      <span>{loyaltyTiers[nextTier.nextTier]?.name}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-pink-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${nextTier.progress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div className="text-2xl mb-2">👑</div>
                    <p className="text-gray-600 dark:text-gray-400">
                      {language.code === 'ar' ? 'وصلت لأعلى مستوى! شكراً لولائك' : 'You\'ve reached the highest tier! Thank you for your loyalty'}
                    </p>
                  </div>
                )}
              </div>

              {/* All Tiers */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {language.code === 'ar' ? 'مستويات الولاء' : 'Loyalty Tiers'}
                </h3>
                <div className="space-y-3">
                  {Object.entries(loyaltyTiers).map(([tierKey, tier]) => (
                    <div
                      key={tierKey}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        tierKey === userStats.currentTier
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                          : userStats.loyaltyPoints >= tier.minPoints
                          ? 'border-green-300 bg-green-50 dark:bg-green-900/20'
                          : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${tier.color} flex items-center justify-center text-white font-bold`}>
                            {tierKey === userStats.currentTier ? '★' : tier.name[0]}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {tier.name}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {tier.minPoints.toLocaleString()}+ {language.code === 'ar' ? 'نقطة' : 'points'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            {language.code === 'ar' ? 'المزايا' : 'Benefits'}:
                          </div>
                          <ul className="text-xs text-gray-500 dark:text-gray-400">
                            {tier.benefits.slice(0, 2).map((benefit, index) => (
                              <li key={index}>• {benefit}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="space-y-6">
              {/* User Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  icon="💎"
                  value={userStats.loyaltyPoints.toLocaleString()}
                  label={language.code === 'ar' ? 'نقاط الولاء' : 'Loyalty Points'}
                  color="purple"
                />
                <StatCard
                  icon="🛍️"
                  value={userStats.totalPurchases}
                  label={language.code === 'ar' ? 'إجمالي المشتريات' : 'Total Purchases'}
                  color="blue"
                />
                <StatCard
                  icon="🏆"
                  value={userNFTs.length}
                  label={language.code === 'ar' ? 'NFTs المملوكة' : 'Owned NFTs'}
                  color="green"
                />
                <StatCard
                  icon="⭐"
                  value={`${userStats.rarityScore}%`}
                  label={language.code === 'ar' ? 'نقاط الندرة' : 'Rarity Score'}
                  color="yellow"
                />
              </div>

              {/* NFT Rarity Distribution */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {language.code === 'ar' ? 'توزيع ندرة NFTs' : 'NFT Rarity Distribution'}
                </h3>
                <div className="space-y-3">
                  {rarityStats.map((stat) => (
                    <div key={stat.rarity} className="flex items-center gap-4">
                      <div className="w-20 text-sm font-medium text-gray-600 dark:text-gray-400">
                        {stat.rarity}
                      </div>
                      <div className="flex-1">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-pink-600 h-3 rounded-full"
                            style={{ width: `${stat.percentage}%` }}
                          />
                        </div>
                      </div>
                      <div className="w-16 text-sm text-gray-600 dark:text-gray-400 text-right">
                        {stat.count} ({stat.percentage}%)
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const NFTCard = ({ nft, owned = false, onMint, canAfford = true, meetsRequirements = true }) => {
  const { language } = useLanguage();

  const getRarityIcon = (rarity) => {
    switch (rarity.toLowerCase()) {
      case 'legendary': return '👑';
      case 'epic': return '💎';
      case 'rare': return '⭐';
      case 'uncommon': return '🔹';
      default: return '⚪';
    }
  };

  return (
    <div className={`border-2 rounded-lg p-4 transition-all ${
      owned
        ? 'border-green-300 bg-green-50 dark:bg-green-900/20'
        : meetsRequirements && canAfford
        ? 'border-purple-300 bg-purple-50 dark:bg-purple-900/20 hover:border-purple-400'
        : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 opacity-60'
    }`}>
      <div className="text-center mb-3">
        <div className={`w-20 h-20 mx-auto rounded-lg bg-gradient-to-r ${nft.rarityColor} flex items-center justify-center text-2xl mb-2`}>
          🏆
        </div>
        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${nft.rarityColor} text-white`}>
          {getRarityIcon(nft.rarity)} {nft.rarity}
        </div>
      </div>

      <div className="text-center mb-3">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
          {nft.name}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {nft.description}
        </p>
      </div>

      {!owned && (
        <div className="text-center mb-3">
          <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
            {nft.price.toLocaleString()} {language.code === 'ar' ? 'نقطة' : 'points'}
          </div>
        </div>
      )}

      {nft.benefits && (
        <div className="mb-3">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {language.code === 'ar' ? 'المزايا' : 'Benefits'}:
          </div>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            {nft.benefits.slice(0, 2).map((benefit, index) => (
              <li key={index}>• {benefit}</li>
            ))}
          </ul>
        </div>
      )}

      {owned ? (
        <div className="text-center">
          <div className="text-green-600 dark:text-green-400 font-medium text-sm">
            {language.code === 'ar' ? 'مملوك' : 'Owned'}
          </div>
          {nft.tokenId && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Token: {nft.tokenId}
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={onMint}
          disabled={!canAfford || !meetsRequirements}
          className={`w-full py-2 rounded-lg font-medium transition-colors ${
            canAfford && meetsRequirements
              ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:from-purple-600 hover:to-pink-700'
              : 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
          }`}
        >
          {!meetsRequirements
            ? (language.code === 'ar' ? 'لا تتوفر المتطلبات' : 'Requirements Not Met')
            : !canAfford
            ? (language.code === 'ar' ? 'نقاط غير كافية' : 'Insufficient Points')
            : (language.code === 'ar' ? 'إصدار NFT' : 'Mint NFT')
          }
        </button>
      )}
    </div>
  );
};

const StatCard = ({ icon, value, label, color }) => {
  const colorClasses = {
    purple: 'from-purple-500 to-pink-600',
    blue: 'from-blue-500 to-cyan-600',
    green: 'from-green-500 to-teal-600',
    yellow: 'from-yellow-500 to-orange-600'
  };

  return (
    <div className={`bg-gradient-to-r ${colorClasses[color]} text-white p-4 rounded-lg text-center`}>
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-xl font-bold mb-1">{value}</div>
      <div className="text-sm opacity-90">{label}</div>
    </div>
  );
};

const NFTLoyalty = ({ className = '' }) => {
  return (
    <NFTLoyaltyProvider>
      <NFTLoyaltyDashboard className={className} />
    </NFTLoyaltyProvider>
  );
};

export default NFTLoyalty;