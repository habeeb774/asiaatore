import { audit } from './audit.js';
import prisma from '../db/client.js';

// Environment variables for SMSA API credentials
const SMSA_API_URL = process.env.SMSA_API_URL || 'https://api.smsaexpress.com/v2';
const SMSA_API_KEY = process.env.SMSA_API_KEY;
const SMSA_SANDBOX = process.env.SMSA_SANDBOX === '1';

/**
 * Helper to make requests to the SMSA API.
 * @param {string} endpoint - The API endpoint to call.
 * @param {string} method - HTTP method (e.g., 'POST', 'GET').
 * @param {object} body - The request body for POST requests.
 * @returns {Promise<object>} - The JSON response from the API.
 */
async function smsaRequest(endpoint, method = 'POST', body = {}) {
  // Sandbox mode: return mocked responses without real network calls
  if (SMSA_SANDBOX) {
    // Basic simulated behaviors per endpoint
    if (endpoint === 'shipments' && method === 'POST') {
      const trackingNumber = `SM${Math.floor(100000 + Math.random()*900000)}`;
      return { ok: true, trackingNumber, shipmentId: `sandbox-${trackingNumber}` };
    }
    if (endpoint.startsWith('tracking/') && method === 'GET') {
      const tn = endpoint.split('/').pop();
      return {
        ok: true,
        trackingNumber: tn,
        status: 'in_transit',
        history: [
          { ts: new Date(Date.now()-86400000).toISOString(), status: 'created' },
          { ts: new Date(Date.now()-43200000).toISOString(), status: 'picked_up' },
          { ts: new Date().toISOString(), status: 'in_transit' }
        ]
      };
    }
    if (endpoint === 'shipments/cancel' && method === 'POST') {
      return { ok: true, cancelled: true };
    }
  }

  if (!SMSA_API_KEY) {
    throw new Error('SMSA_API_KEY is not configured.');
  }

  const url = `${SMSA_API_URL}/${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'apiKey': SMSA_API_KEY,
    },
  };

  if (method === 'POST') {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`SMSA API request failed with status ${response.status}: ${errorBody}`);
    }
    return await response.json();
  } catch (error) {
    console.error('SMSA API request error:', error);
    throw new Error('Failed to communicate with SMSA API.');
  }
}

/**
 * Creates a shipment with SMSA.
 * @param {object} order - The order object from the database.
 * @returns {Promise<object>} - The shipment details including tracking number.
 */
export async function createSmsaShipment(order) {
  // Try load store settings if DB available; ignore errors
  let setting = null; 
  try { setting = await prisma.storeSetting?.findUnique?.({ where: { id: 'singleton' } }).catch(() => null); } catch {}

  const payload = {
    // Fallbacks due to varying schema shapes: use order meta or user context if needed
    customerName: order.customerName || order.user?.name || 'Customer',
    customerAddress: order.deliveryLocation?.address || order.deliveryLocation?.street || 'Unspecified address',
    customerCity: order.deliveryLocation?.city || 'Riyadh',
    customerPhone: order.deliveryLocation?.phone || order.user?.phone || '0500000000',
    senderName: setting?.companyNameAr || setting?.siteNameAr || 'My Store',
    senderAddress: setting?.addressAr || setting?.addressEn || 'Riyadh',
    senderCity: 'Riyadh',
    senderPhone: setting?.supportMobile || setting?.supportPhone || '0500000000',
    codAmount: order.paymentMethod === 'cod' ? order.grandTotal : 0,
    shipmentDescription: `Order #${order.id}`,
    // Add other required fields by SMSA
  };

  const response = await smsaRequest('shipments', 'POST', payload);

  if (!response || !response.trackingNumber) {
    throw new Error('Failed to create SMSA shipment or tracking number not returned.');
  }

  // Audit the shipment creation
  await audit({
    action: 'CREATE_SHIPMENT',
    entity: 'Order',
    entityId: order.id,
    userId: order.userId,
    meta: { provider: 'smsa', trackingNumber: response.trackingNumber },
  });

  return {
    provider: 'smsa',
    trackingNumber: response.trackingNumber,
    shipmentId: response.shipmentId || null,
    status: 'created',
  };
}

/**
 * Tracks a shipment with SMSA.
 * @param {string} trackingNumber - The shipment tracking number.
 * @returns {Promise<object>} - The tracking status and history.
 */
export async function trackSmsaShipment(trackingNumber) {
  if (!trackingNumber) {
    throw new Error('Tracking number is required.');
  }

  const response = await smsaRequest(`tracking/${trackingNumber}`, 'GET');
  
  return response;
}

/**
 * Cancels a shipment with SMSA.
 * @param {string} trackingNumber - The shipment tracking number to cancel.
 * @param {string} reason - The reason for cancellation.
 * @returns {Promise<object>} - The cancellation confirmation.
 */
export async function cancelSmsaShipment(trackingNumber, reason = 'Cancelled by customer') {
  if (!trackingNumber) {
    throw new Error('Tracking number is required for cancellation.');
  }

  const payload = {
    trackingNumber,
    cancellationReason: reason,
  };

  const response = await smsaRequest('shipments/cancel', 'POST', payload);

  // Best-effort audit (order lookup is done in route; keep util generic)
  try {
    await audit({ action: 'CANCEL_SHIPMENT', entity: 'Shipment', entityId: trackingNumber, meta: { provider: 'smsa', trackingNumber, reason } });
  } catch {}

  return response;
}
