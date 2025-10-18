/**
 * CustomProductCard
 * Lightweight, framework-agnostic product card.
 * Usage:
 * <custom-product-card product='{"id":1,"name":"Item","price":120,"regular_price":150,"sale_price":99,"is_on_sale":true,"image":"url.jpg"}'></custom-product-card>
 *
 * Or in JS:
 * const el = document.createElement('custom-product-card');
 * el.product = {...};
 * container.appendChild(el);
 */
class CustomProductCard extends HTMLElement {
  static get observedAttributes() { return ['product', 'size']; }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._product = null;
  }

  set product(val) {
    this._product = val;
    this.render();
  }
  get product() { return this._product; }

  attributeChangedCallback(name, _old, value) {
    if (name === 'product' && value) {
      try { this._product = JSON.parse(value); }
      catch { /* silently ignore malformed JSON */ }
      this.render();
    }
    if (name === 'size') {
      this.shadowRoot.querySelector('host')?.setAttribute('size', value);
    }
  }

  connectedCallback() {
    if (!this._product && this.getAttribute('product')) {
      try { this._product = JSON.parse(this.getAttribute('product')); } catch {}
    }
    this.render();
  }

  /* ---------- Helpers ---------- */
  formatPrice(p) {
    if (p === null || p === undefined || p === '') return '';
    return new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR', maximumFractionDigits: 2 }).format(Number(p));
  }
  hasSale() {
    const p = this._product;
    return p && p.is_on_sale && Number(p.sale_price) > 0 && Number(p.regular_price) > Number(p.sale_price);
  }
  isOut() {
    const p = this._product;
    return p && (p.is_out_of_stock || p.stock === 0);
  }
  getBadge() {
    const p = this._product;
    if (!p) return '';
    if (this.hasSale()) {
      const rp = Number(p.regular_price);
      const sp = Number(p.sale_price);
      const pct = Math.round((1 - (sp / rp)) * 100);
      return `<span class="cp-badge">-${pct}%</span>`;
    }
    if (p.promotion_title) return `<span class="cp-badge">${this.escape(p.promotion_title)}</span>`;
    return '';
  }
  escape(str) {
    return String(str).replace(/[&<>"']/g, s => ({
      '&': '&amp;','<': '&lt;','>': '&gt;','"': '&quot;',"'": '&#39;'
    }[s]));
  }

  /* ---------- Render ---------- */
  render() {
    const p = this._product;
    if (!this.shadowRoot) return;
    this.shadowRoot.innerHTML = `
      <style>
        :host { all: initial; display: block; }
        :host([hidden]) { display: none !important; }
        /* Inherit outer styles from global sheet (class hooks inside light DOM) */
        .outer { all: unset; display: block; }
      </style>
      <div class="outer ${this.isOut() ? 'out-of-stock' : ''}" part="card">
        ${p ? `
          <div class="cp-media">
            <img loading="lazy" alt="${this.escape(p.name || '')}" src="${this.escape(p.image || p.thumbnail || '')}">
            ${this.getBadge()}
          </div>
          <div class="cp-content">
            <h3 class="cp-title"><a part="title" href="${this.escape(p.url || '#')}">${this.escape(p.name || '')}</a></h3>
            ${p.subtitle ? `<p class="cp-sub">${this.escape(p.subtitle)}</p>` : ''}
            <div class="cp-price-row">
              ${this.hasSale()
                ? `<span class="cp-price">${this.formatPrice(p.sale_price)}</span>
                   <span class="cp-price-before">${this.formatPrice(p.regular_price)}</span>`
                : p.starting_price
                  ? `<span class="cp-price-start">من</span><span class="cp-price">${this.formatPrice(p.starting_price)}</span>`
                  : `<span class="cp-price">${this.formatPrice(p.price)}</span>`}
            </div>
            <div class="cp-actions">
              ${this.isOut()
                ? `<button class="cp-btn out" disabled part="add-btn">غير متوفر</button>`
                : `<button class="cp-btn primary" part="add-btn" data-id="${p.id}">اضف للسلة</button>`}
              <button class="cp-btn" part="wish-btn" data-id="${p.id}" aria-pressed="false">❤</button>
            </div>
          </div>
        ` : `<div style="padding:.75rem;font-size:.7rem;color:#64748b;">لا توجد بيانات منتج</div>`}
      </div>
    `;
    this.bindEvents();
  }

  bindEvents() {
    const addBtn = this.shadowRoot.querySelector('[part="add-btn"]');
    const wishBtn = this.shadowRoot.querySelector('[part="wish-btn"]');
    if (addBtn && !addBtn.disabled) {
      addBtn.addEventListener('click', () => {
        this.dispatchEvent(new CustomEvent('product:add', {
          bubbles: true,
          composed: true,
          detail: { product: this._product }
        }));
      });
    }
    if (wishBtn) {
      wishBtn.addEventListener('click', () => {
        const pressed = wishBtn.getAttribute('aria-pressed') === 'true';
        wishBtn.setAttribute('aria-pressed', String(!pressed));
        wishBtn.classList.toggle('active', !pressed);
        this.dispatchEvent(new CustomEvent('product:wishlist-toggle', {
          bubbles: true,
            composed: true,
          detail: { product: this._product, added: !pressed }
        }));
      });
    }
  }
}

if (!customElements.get('custom-product-card')) {
  customElements.define('custom-product-card', CustomProductCard);
}

/* Example (remove in production):
document.addEventListener('DOMContentLoaded', () => {
  const demo = document.querySelector('#demo-card');
  if (demo) {
    demo.product = {
      id: 10,
      name: 'ساعة أنيقة فاخرة',
      price: 250,
      regular_price: 300,
      sale_price: 250,
      is_on_sale: true,
  image: '/vite.svg'
    };
  }
});
*/
