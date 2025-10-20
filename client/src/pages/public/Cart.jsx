import '../../styles/Cart.css'
import { resolveLocalized } from '../../utils/locale';

const Cart = ({ cartItems, removeFromCart, updateQuantity, toggleCart }) => {
  const locale = 'ar'
  const asText = (val) => {
    try {
      const r = resolveLocalized ? resolveLocalized(val, locale) : val
      if (typeof r === 'string') return r
      if (r && typeof r === 'object') return r[locale] || r.ar || r.en || ''
      return r != null ? String(r) : ''
    } catch {
      return ''
    }
  }
  const asNumber = (v) => {
    const n = Number(v)
    return Number.isFinite(n) ? n : 0
  }
  const totalPrice = cartItems.reduce((total, item) => total + (asNumber(item.price) * (item.quantity || 0)), 0)

  return (
    <div className="cart-overlay" onClick={toggleCart}>
      <div className="cart-sidebar" onClick={(e) => e.stopPropagation()}>
        <div className="cart-header">
          <h2>Shopping Cart</h2>
          <button className="close-btn" onClick={toggleCart}>×</button>
        </div>
        
        <div className="cart-content">
          {cartItems.length === 0 ? (
            <p className="empty-cart">Your cart is empty</p>
          ) : (
            <>
              <div className="cart-items">
                {cartItems.map(item => (
                  <div key={item.id} className="cart-item">
                    <img src={item.image} alt={asText(item.name)} className="cart-item-image" />
                    <div className="cart-item-details">
                      <h4>{asText(item.name)}</h4>
                      <p>${asNumber(item.price).toFixed(2)}</p>
                      <div className="quantity-controls">
                        <button onClick={() => updateQuantity(item.id, Math.max(0, (item.quantity || 0) - 1))}>-</button>
                        <span>{item.quantity || 0}</span>
                        <button onClick={() => updateQuantity(item.id, (item.quantity || 0) + 1)}>+</button>
                      </div>
                    </div>
                    <button 
                      className="remove-btn" 
                      onClick={() => removeFromCart(item.id)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="cart-summary">
                <div className="total">
                  <strong>Total: ${totalPrice.toFixed(2)}</strong>
                </div>
                <button className="checkout-btn">Proceed to Checkout</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Cart