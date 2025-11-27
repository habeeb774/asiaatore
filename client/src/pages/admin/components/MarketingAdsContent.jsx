import React, { useState, useEffect } from 'react';
import { Megaphone, ImageIcon, Eye, MousePointerClick, Sparkles, Target, TrendingUp } from 'lucide-react';
import MarketingManager from './MarketingManager';
import AdsManager from './AdsManager';
import { useAdminMarketing } from '../hooks/useAdminMarketing';

const tabs = [
  { id: 'marketing', label: 'البانرات والميزات', icon: ImageIcon },
  { id: 'ads', label: 'الحملات الإعلانية', icon: Megaphone }
];

const StatCard = ({ icon: Icon, label, value, color = 'emerald' }) => {
  const colors = {
    emerald: 'from-emerald-500 to-emerald-600',
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    amber: 'from-amber-500 to-amber-600'
  };
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="text-2xl font-bold text-slate-800">{value}</p>
        </div>
        <div className={`rounded-xl bg-gradient-to-br ${colors[color]} p-3 shadow-lg`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  );
};

const MarketingAdsContent = ({ initialSection = 'marketing' }) => {
  const [activeTab, setActiveTab] = useState(initialSection);
  const { homeBanners, features } = useAdminMarketing();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('section') === 'ads') setActiveTab('ads');
  }, []);

  const activeBanners = homeBanners?.filter(b => b.active !== false)?.length || 0;
  const activeFeatures = features?.filter(f => f.active !== false)?.length || 0;

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 p-6 text-white shadow-xl">
        <div className="relative z-10 flex items-center gap-3">
          <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
            <Target className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">التسويق والإعلانات</h1>
            <p className="text-emerald-100 text-sm mt-0.5">إدارة الحملات التسويقية وبانرات الصفحة الرئيسية</p>
          </div>
        </div>
        <div className="absolute -top-10 -left-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-white/10 blur-xl" />
        <Sparkles className="absolute top-4 left-4 h-8 w-8 text-white/20" />
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={ImageIcon} label="البانرات النشطة" value={activeBanners} color="emerald" />
        <StatCard icon={Sparkles} label="رسائل القيمة" value={activeFeatures} color="blue" />
        <StatCard icon={Eye} label="المشاهدات اليوم" value="—" color="purple" />
        <StatCard icon={MousePointerClick} label="النقرات اليوم" value="—" color="amber" />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-medium text-sm transition-all ${
                isActive ? 'bg-emerald-50 text-emerald-700 border-b-2 border-emerald-500' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {activeTab === 'marketing' && <MarketingManager />}
        {activeTab === 'ads' && <AdsManager />}
      </div>
    </div>
  );
};

export default MarketingAdsContent;
