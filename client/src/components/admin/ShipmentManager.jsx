import React, { useState } from 'react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { Button } from '../common/Button';
import { Truck, PackageCheck, XCircle } from 'lucide-react';

const ShipmentManager = ({ order, onShipmentUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [trackingInfo, setTrackingInfo] = useState(null);
  const toast = useToast();

  const shipment = order.shipments?.find(s => s.provider === 'smsa');

  const createShipment = async () => {
    setLoading(true);
    try {
      const newShipment = await api.request('post', `/shipping/smsa/create`, { data: { orderId: order.id } });
      onShipmentUpdate({
        ...order,
        shipments: [...(order.shipments || []), newShipment],
        status: 'SHIPPED',
      });
      toast.success('تم إنشاء الشحنة بنجاح!', `رقم التتبع: ${newShipment.trackingNumber}`);
    } catch (error) {
      toast.error('فشل إنشاء الشحنة', error.message);
    } finally {
      setLoading(false);
    }
  };

  const trackShipment = async () => {
    if (!shipment) return;
    setLoading(true);
    try {
      const info = await api.request('get', `/shipping/smsa/track/${shipment.trackingNumber}`);
      setTrackingInfo(info);
      toast.info('تم تحديث حالة الشحنة.');
    } catch (error) {
      toast.error('فشل تتبع الشحنة', error.message);
    } finally {
      setLoading(false);
    }
  };

  const cancelShipment = async () => {
    if (!shipment || !window.confirm('هل أنت متأكد من رغبتك في إلغاء هذه الشحنة؟')) return;
    setLoading(true);
    try {
      await api.request('post', `/shipping/smsa/cancel`, { data: { trackingNumber: shipment.trackingNumber } });
      onShipmentUpdate({
        ...order,
        status: 'CANCELLED', // Or another appropriate status
        shipments: order.shipments.filter(s => s.trackingNumber !== shipment.trackingNumber),
      });
      toast.success('تم إلغاء الشحنة بنجاح.');
    } catch (error) {
      toast.error('فشل إلغاء الشحنة', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 my-4 bg-slate-50 border rounded-lg">
      <h4 className="font-bold mb-4 flex items-center gap-2">
        <Truck size={18} />
        إدارة الشحن (SMSA)
      </h4>
      {shipment ? (
        <div className="space-y-3">
          <p className="text-sm">
            <strong>الحالة:</strong> <span className="font-mono bg-slate-200 px-2 py-1 rounded">{order.status}</span>
          </p>
          <p className="text-sm">
            <strong>رقم التتبع:</strong>
            <a href={`https://smsaexpress.com/trackingdetails?tracknumbers=${shipment.trackingNumber}`} target="_blank" rel="noopener noreferrer" className="font-mono text-blue-600 hover:underline mr-2">
              {shipment.trackingNumber}
            </a>
          </p>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={trackShipment} disabled={loading}>
              <PackageCheck size={14} className="mr-2" />
              تتبع الشحنة
            </Button>
            <Button variant="destructive" size="sm" onClick={cancelShipment} disabled={loading}>
              <XCircle size={14} className="mr-2" />
              إلغاء الشحنة
            </Button>
          </div>
          {trackingInfo && (
            <div className="mt-4 p-3 bg-white border rounded-md text-xs">
              <pre>{JSON.stringify(trackingInfo, null, 2)}</pre>
            </div>
          )}
        </div>
      ) : (
        <div>
          <p className="text-sm text-slate-600 mb-4">لا توجد معلومات شحن لهذا الطلب. قم بإنشاء شحنة جديدة.</p>
          <Button onClick={createShipment} disabled={loading}>
            {loading ? 'جارٍ الإنشاء...' : 'إنشاء شحنة سمسا'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ShipmentManager;
