import React from 'react';
import { Sparkles, ShieldCheck, Truck, Clock, Headset, Package as PackageIcon } from 'lucide-react';

const ICON_MAP = {
  sparkles: Sparkles,
  shield: ShieldCheck,
  shieldcheck: ShieldCheck,
  truck: Truck,
  delivery: Truck,
  clock: Clock,
  support: Headset,
  headset: Headset,
  package: PackageIcon,
  box: PackageIcon
};

const normalizeKey = (value) => {
  if (!value || typeof value !== 'string') return '';
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
};

const HighlightItem = ({ item }) => {
  const key = normalizeKey(item?.icon);
  const Icon = ICON_MAP[key] || Sparkles;
  return (
    <div className="home-highlight-bar__item" role="listitem">
      <span className="home-highlight-bar__icon" aria-hidden="true">
        <Icon size={20} strokeWidth={2.2} />
      </span>
      <div className="home-highlight-bar__content">
        <p className="home-highlight-bar__title">{item?.title || ''}</p>
        {item?.description ? (
          <p className="home-highlight-bar__description">{item.description}</p>
        ) : null}
      </div>
    </div>
  );
};

const SkeletonItem = () => (
  <div className="home-highlight-bar__item home-highlight-bar__item--skeleton" aria-hidden="true">
    <span className="home-highlight-bar__icon" />
    <div className="home-highlight-bar__content">
      <span className="home-highlight-bar__skeleton-line home-highlight-bar__skeleton-line--short" />
      <span className="home-highlight-bar__skeleton-line" />
    </div>
  </div>
);

const HomeHighlightBar = ({ items = [], loading = false }) => {
  const normalizedItems = Array.isArray(items) ? items.filter(Boolean) : [];
  const showSkeleton = loading && normalizedItems.length === 0;

  if (!showSkeleton && normalizedItems.length === 0) {
    return null;
  }

  return (
    <div className="home-highlight-bar" role="list" aria-label="Store value highlights">
      {showSkeleton
        ? Array.from({ length: 3 }).map((_, index) => <SkeletonItem key={`highlight-skeleton-${index}`} />)
        : normalizedItems.map((item) => <HighlightItem key={item.id || item.title} item={item} />)}
    </div>
  );
};

export default HomeHighlightBar;
