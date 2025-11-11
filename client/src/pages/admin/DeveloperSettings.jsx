import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/features/admin/AdminLayout';
import { Tabs } from '../../components/ui/Tabs';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../stores/AuthContext';
import { useToast } from '../../stores/ToastContext';

// Import icons directly for immediate availability
import { Settings, Droplets, Eye } from 'lucide-react';

const STORAGE_KEY = 'developer:uiSettings:v1';

const defaultSettings = {
  enabled: true,
  inputRadius: 6,
  inputSize: 'md',
  topbarBg: '#ffffff',
  sidebarBg: '#ffffff',
  heroBg: '#f8fafc',
  footerBg: '#ffffff',
  buttonBg: '#0ea5a4',
  textColor: '#222222',
  borderColor: '#e6e6e6',
  showTopbar: true,
  showSidebar: true,
  sidebarCollapsed: false,
  heroVariant: 'default',
  experimental: {
    newSidebar: false,
    aiAssistant: false,
    abTesting: false,
  },
};

export default function DeveloperSettings() {
  const { user } = useAuth() || {};
  const toast = useToast();
  const [settings, setSettings] = useState(defaultSettings);
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);

  const tabs = [
    { key: 'general', label: 'عام', icon: <Settings /> },
    { key: 'colors', label: 'الألوان', icon: <Droplets /> },
    { key: 'preview', label: 'معاينة', icon: <Eye /> },
    { key: 'experimental', label: 'تجريبي', icon: <Settings /> },
  ];

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">إعدادات المطور</h1>
        
        <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab}>
          {activeTab === 'general' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">إعدادات عامة</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">نصف قطر الإدخال</label>
                  <Input
                    type="number"
                    value={settings.inputRadius}
                    onChange={(e) => setSettings({...settings, inputRadius: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">حجم الإدخال</label>
                  <Select
                    value={settings.inputSize}
                    onChange={(value) => setSettings({...settings, inputSize: value})}
                    options={[
                      { value: 'sm', label: 'صغير' },
                      { value: 'md', label: 'متوسط' },
                      { value: 'lg', label: 'كبير' }
                    ]}
                  />
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'colors' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">إعدادات الألوان</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">خلفية الشريط العلوي</label>
                  <Input
                    type="color"
                    value={settings.topbarBg}
                    onChange={(e) => setSettings({...settings, topbarBg: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">خلفية الشريط الجانبي</label>
                  <Input
                    type="color"
                    value={settings.sidebarBg}
                    onChange={(e) => setSettings({...settings, sidebarBg: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">خلفية البطل</label>
                  <Input
                    type="color"
                    value={settings.heroBg}
                    onChange={(e) => setSettings({...settings, heroBg: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">خلفية التذييل</label>
                  <Input
                    type="color"
                    value={settings.footerBg}
                    onChange={(e) => setSettings({...settings, footerBg: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">لون الزر</label>
                  <Input
                    type="color"
                    value={settings.buttonBg}
                    onChange={(e) => setSettings({...settings, buttonBg: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">لون النص</label>
                  <Input
                    type="color"
                    value={settings.textColor}
                    onChange={(e) => setSettings({...settings, textColor: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">لون الحدود</label>
                  <Input
                    type="color"
                    value={settings.borderColor}
                    onChange={(e) => setSettings({...settings, borderColor: e.target.value})}
                  />
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'preview' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">معاينة الإعدادات</h2>
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    checked={settings.showTopbar}
                    onChange={(e) => setSettings({...settings, showTopbar: e.target.checked})}
                  />
                  <label>إظهار الشريط العلوي</label>
                </div>
                <div className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    checked={settings.showSidebar}
                    onChange={(e) => setSettings({...settings, showSidebar: e.target.checked})}
                  />
                  <label>إظهار الشريط الجانبي</label>
                </div>
                <div className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    checked={settings.sidebarCollapsed}
                    onChange={(e) => setSettings({...settings, sidebarCollapsed: e.target.checked})}
                  />
                  <label>طي الشريط الجانبي</label>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'experimental' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">الميزات التجريبية</h2>
              <div className="space-y-2">
                <div className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    checked={settings.experimental.newSidebar}
                    onChange={(e) => setSettings({
                      ...settings,
                      experimental: {...settings.experimental, newSidebar: e.target.checked}
                    })}
                  />
                  <label>الشريط الجانبي الجديد</label>
                </div>
                <div className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    checked={settings.experimental.aiAssistant}
                    onChange={(e) => setSettings({
                      ...settings,
                      experimental: {...settings.experimental, aiAssistant: e.target.checked}
                    })}
                  />
                  <label>مساعد الذكاء الاصطناعي</label>
                </div>
                <div className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    checked={settings.experimental.abTesting}
                    onChange={(e) => setSettings({
                      ...settings,
                      experimental: {...settings.experimental, abTesting: e.target.checked}
                    })}
                  />
                  <label>اختبار A/B</label>
                </div>
              </div>
            </div>
          )}
        </Tabs>
        
        <div className="mt-6 flex space-x-4">
          <Button onClick={() => {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
            toast?.success('تم حفظ الإعدادات');
          }}>
            حفظ
          </Button>
          <Button variant="outline" onClick={() => {
            setSettings(defaultSettings);
            localStorage.removeItem(STORAGE_KEY);
            toast?.info('تم إعادة تعيين الإعدادات');
          }}>
            إعادة تعيين
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
;