import { useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Calendar, Scan, MessageCircle, User, Book, FileText } from 'lucide-react';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import { ensureSupabaseSession } from '../lib/supabaseAuth';

export default function RootLayout() {
  const location = useLocation();

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const sb = getSupabase();
    if (!sb) return;
    ensureSupabaseSession(sb).catch((err) => {
      console.warn('[Supabase] 세션 준비 실패(익명 로그인 미설정 등):', err);
    });
  }, []);

  const navItems = [
    { path: '/', icon: Home, label: '홈' },
    { path: '/calendar', icon: Calendar, label: '캘린더' },
    { path: '/diary', icon: Book, label: '일기' },
    { path: '/chatbot', icon: MessageCircle, label: '채팅' },
    { path: '/scanner', icon: Scan, label: '스캐너' },
    { path: '/contents', icon: FileText, label: '콘텐츠' },
    { path: '/profile', icon: User, label: '마이' },
  ];

  return (
    <div className="app-container">
      <main className="main-content">
        <Outlet />
      </main>
      
      <nav className="bottom-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={item.path} 
              to={item.path} 
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={24} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
