import { useState } from 'react'
import { useStore } from '../../context/StoreContext'
import SellersManagement from './SellersManagement'
import ProductsManagement from './ProductsManagement'
import OrdersManagement from './OrdersManagement'
import './Dashboard.css'

const AdminDashboard = () => {
  const { products, sellers, orders } = useStore()
  const [activeTab, setActiveTab] = useState('overview')

  const stats = {
    totalProducts: products.length,
    totalSellers: sellers.length,
    totalOrders: orders.length,
    pendingOrders: orders.filter(o => o.status === 'processing').length,
  totalRevenue: orders.reduce((sum, order) => sum + (order.grandTotal != null ? order.grandTotal : (order.total || 0)), 0)
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <Overview stats={stats} />
      case 'sellers':
        return <SellersManagement />
      case 'products':
        return <ProductsManagement />
      case 'orders':
        return <OrdersManagement />
      default:
        return <Overview stats={stats} />
    }
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
      </div>

      <div className="dashboard-layout">
        <aside className="sidebar">
          <nav>
            <button 
              className={activeTab === 'overview' ? 'active' : ''}
              onClick={() => setActiveTab('overview')}
            >
              📊 Overview
            </button>
            <button 
              className={activeTab === 'sellers' ? 'active' : ''}
              onClick={() => setActiveTab('sellers')}
            >
              👥 Sellers
            </button>
            <button 
              className={activeTab === 'products' ? 'active' : ''}
              onClick={() => setActiveTab('products')}
            >
              📦 Products
            </button>
            <button 
              className={activeTab === 'orders' ? 'active' : ''}
              onClick={() => setActiveTab('orders')}
            >
              🛒 Orders
            </button>
          </nav>
        </aside>

        <main className="dashboard-content">
          {renderContent()}
        </main>
      </div>
    </div>
  )
}

const Overview = ({ stats }) => (
  <div className="overview">
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-icon">📦</div>
        <div className="stat-info">
          <h3>{stats.totalProducts}</h3>
          <p>Total Products</p>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon">👥</div>
        <div className="stat-info">
          <h3>{stats.totalSellers}</h3>
          <p>Total Sellers</p>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon">🛒</div>
        <div className="stat-info">
          <h3>{stats.totalOrders}</h3>
          <p>Total Orders</p>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon">💰</div>
        <div className="stat-info">
          <h3>${stats.totalRevenue}</h3>
          <p>Total Revenue</p>
        </div>
      </div>
    </div>

    <div className="recent-activity">
      <h2>Recent Activity</h2>
      <div className="activity-list">
        <div className="activity-item">
          <div className="activity-icon">🆕</div>
          <div className="activity-content">
            <p>New seller registered: Fashion Hub</p>
            <span>2 hours ago</span>
          </div>
        </div>
        <div className="activity-item">
          <div className="activity-icon">📦</div>
          <div className="activity-content">
            <p>New product added: iPhone 14 Pro</p>
            <span>4 hours ago</span>
          </div>
        </div>
        <div className="activity-item">
          <div className="activity-icon">🛒</div>
          <div className="activity-content">
            <p>New order received: #12345</p>
            <span>6 hours ago</span>
          </div>
        </div>
      </div>
    </div>
  </div>
)

export default AdminDashboard