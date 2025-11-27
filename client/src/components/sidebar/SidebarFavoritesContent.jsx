import React from 'react';
import { X } from 'lucide-react';
import SafeImage from '../common/SafeImage';

const SidebarFavoritesContent = ({
  favorites = [],
  locale,
  closePanel,
  handleRemoveFromFavorites,
}) => {
  const title = locale === 'ar' ? 'المفضلة' : 'Favorites';
  const emptyMessage = locale === 'ar' ? 'ليس لديك عناصر مفضلة بعد.' : 'You have no favorite items.';

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
      <div className="flex items-center justify-between p-4 border-b border-slate-200/70 dark:border-slate-800/70">
        <h2 className="text-lg font-semibold">{title}</h2>
        <button
          onClick={closePanel}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          aria-label={locale === 'ar' ? 'إغلاق المفضلة' : 'Close favorites'}
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!favorites.length ? (
          <p className="text-sm text-slate-500 dark:text-slate-300">{emptyMessage}</p>
        ) : (
          favorites.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 rounded-2xl border border-slate-200/70 bg-white/80 p-3 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/60"
            >
              <SafeImage src={item.image} alt={item.name} className="w-16 h-16 rounded-xl object-cover" />
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-slate-800 dark:text-slate-100 truncate">{item.name}</h3>
                {item.price != null && (
                  <p className="text-sm text-slate-500 dark:text-slate-300">${item.price}</p>
                )}
              </div>
              <button
                onClick={() => handleRemoveFromFavorites?.(item.id)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                aria-label={locale === 'ar' ? 'إزالة من المفضلة' : 'Remove favorite'}
              >
                <X size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SidebarFavoritesContent;
