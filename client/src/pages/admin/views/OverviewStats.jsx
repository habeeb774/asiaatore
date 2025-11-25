import React from 'react';

// Lightweight presentational component for overview stats & recent orders.
// Receives preformatted card arrays and order data to avoid heavy logic duplication.
const OverviewStats = ({
  labels,
  summaryCards = [],
  storeCards = [],
  financialCards = [],
  recentOrders = [],
  showEmptyOrders,
  usingFallbackOrders,
  fallbackNotice,
  hasError,
}) => {
  return (
    <div className="overview-view">
      {hasError && (
        <div
          className="overview-notice"
          style={{
            backgroundColor: 'rgba(16,185,129,0.12)',
            border: '1px solid rgba(16,185,129,0.25)',
            color: '#047857',
            padding: '12px 16px',
            borderRadius: '12px',
            marginBottom: '24px',
            lineHeight: 1.5,
          }}
          role="status"
        >
          {labels.fallbackNotice}
        </div>
      )}

      <section className="overview-section">
        <h2 className="section-title">{labels.sections.daily}</h2>
        <div className="stat-grid">
          {summaryCards.map((card) => (
            <div key={card.key} className="stat-card">
              <div className="stat-value">{card.formatter(card.value)}</div>
              <div className="stat-label">{card.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="overview-section">
        <h2 className="section-title">{labels.sections.store}</h2>
        <div className="stat-grid">
          {storeCards.map((card) => (
            <div key={card.key} className="stat-card">
              <div className="stat-value">{card.formatter(card.value)}</div>
              <div className="stat-label">{card.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="overview-section">
        <h2 className="section-title">{labels.sections.financial}</h2>
        <div className="stat-grid">
          {financialCards.map((card) => (
            <div key={card.key} className="stat-card">
              <div className="stat-value">{card.formatter(card.value)}</div>
              <div className="stat-label">{card.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="overview-section">
        <h2 className="section-title">{labels.sections.orders}</h2>
        <div className="recent-orders">
          {showEmptyOrders ? (
            <div className="empty-state">{labels.emptyOrders}</div>
          ) : (
            <div className="orders-list">
              {recentOrders.map((order) => (
                <div key={order.id} className="order-card">
                  <div className="order-info">
                    <div className="order-id">#{order.id}</div>
                    <div className="order-customer">{order.customer}</div>
                  </div>
                  <div className="order-details">
                    <div className="order-total">{order.displayTotal}</div>
                    <div className="order-status">{order.status}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default OverviewStats;