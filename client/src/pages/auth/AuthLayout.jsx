import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../../components/ui/Card";

export const AuthLayout = ({ title, description, children }) => {
  return (
    <div className="min-h-screen modern-bg flex items-center justify-center p-4">
      {/* Main Content */}
      <div className="w-full max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Side - Modern Brand/Info */}
          <div className="hidden lg:block modern-sidebar">
            <div className="modern-logo">
              <div className="modern-logo-icon">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
                </svg>
              </div>
              <div>
                <div className="text-sm opacity-80 font-medium">منصة تجارية متكاملة</div>
                <div className="text-xs opacity-60">E-Commerce Platform</div>
              </div>
            </div>
            
            <h1 className="modern-title">
              منفذ آسيا
              <span className="block text-4xl font-bold opacity-90">Manfad Asia</span>
            </h1>
            
            <p className="modern-subtitle">
              حلول تجارية متكاملة لمساعدتك على نمو أعمالك بفعالية وكفاءة
            </p>
            
            <div className="modern-features">
              <div className="modern-feature">
                <div className="modern-feature-icon">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="modern-feature-content">
                  <h3>أداء فائق</h3>
                  <p>نظام محسّن لضمان سرعة واستجابة ممتازة</p>
                </div>
              </div>
              
              <div className="modern-feature">
                <div className="modern-feature-icon">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div className="modern-feature-content">
                  <h3>أمان متقدم</h3>
                  <p>حماية كاملة للبيانات والمعلومات الحساسة</p>
                </div>
              </div>
              
              <div className="modern-feature">
                <div className="modern-feature-icon">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="modern-feature-content">
                  <h3>سهولة استخدام</h3>
                  <p>واجهة بسيطة ومباشرة مصممة لجميع المستخدمين</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Side - Auth Form */}
          <div className="flex justify-center">
            <Card className="w-full max-w-md modern-card">
              <CardHeader className="text-center pb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900">{title}</CardTitle>
                <CardDescription className="text-gray-600">{description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                {children}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
