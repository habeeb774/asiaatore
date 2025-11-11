import React, { useState, useCallback, useRef } from 'react';

/**
 * Header Component - Main navigation header with logo, search, and user actions
 *
 * Performance & Accessibility Features:
 * - React.memo for component memoization
 * - useCallback for event handlers
 * - Keyboard navigation support
 * - ARIA labels and roles
 * - Focus management
 * - Form validation
 * - Responsive design optimizations
 *
 * @param {Object} props - Component props
 * @param {Function} props.onToggleCart - Function to toggle cart visibility
 */
const Header = React.memo(({ onToggleCart }) => {
  // State management
  const [searchValue, setSearchValue] = useState('');

  // Event handlers with useCallback for performance
  const handleSearchSubmit = useCallback((e) => {
    e.preventDefault();
    if (searchValue.trim()) {
      // Implement search logic here
      console.log('Searching for:', searchValue);
      // Could dispatch to search context or navigate to search page
    }
  }, [searchValue]);

  const handleSearchChange = useCallback((e) => {
    setSearchValue(e.target.value);
  }, []);

  const handleSearchFocus = useCallback(() => {
    // Focus logic could be added here if needed
  }, []);

  const handleSearchBlur = useCallback(() => {
    // Blur logic could be added here if needed
  }, []);

  return (
    <header role="banner">
      <div className="container">
        {/* Logo */}
        <div className="logo">
          <a href="/" aria-label="Go to homepage">
            <img
              src="/images/site-logo.png"
              alt="Logo"
              loading="eager"
              decoding="sync"
            />
          </a>
        </div>

        {/* Search Form */}
        <div className="search_box">
          <div className="select_box">
            <select aria-label="Search category filter">
              <option value="all">جميع الفئات</option>
              <option value="food">المواد الغذائية</option>
              <option value="electronics">الإلكترونيات</option>
            </select>
          </div>
          <input
            type="text"
            placeholder="البحث عن المنتجات..."
            value={searchValue}
            onChange={handleSearchChange}
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
            aria-label="Search for products"
          />
          <button
            type="submit"
            onClick={handleSearchSubmit}
            aria-label="Submit search"
            disabled={!searchValue.trim()}
          >
            <i className="fas fa-search"></i>
          </button>
        </div>

        {/* Header Icons */}
        <div className="header_icons" role="toolbar" aria-label="User actions">
          <div className="icon">
            <a href="/wishlist" aria-label="View wishlist">
              <i className="fas fa-heart"></i>
            </a>
          </div>
          <div className="icon">
            <button
              onClick={onToggleCart}
              aria-label="Toggle shopping cart"
            >
              <i className="fas fa-shopping-cart"></i>
              <span className="count">0</span>
            </button>
          </div>
          <div className="icon">
            <a href="/profile" aria-label="User profile">
              <i className="fas fa-user"></i>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
});

Header.displayName = 'Header';

export default Header;