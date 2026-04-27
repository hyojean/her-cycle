import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Calendar, Scan, MessageCircle, User, Book, FileText } from 'lucide-react';

export default function RootLayout() {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: '홈' },
    { path: '/calendar', icon: Calendar, label: '캘린더' },
    { path: '/diary', icon: Book, label: '일기' },
    { path: '/contents', icon: FileText, label: '콘텐츠' },
    { path: '/scanner', icon: Scan, label: '스캐너' },
    { path: '/chatbot', icon: MessageCircle, label: '챗봇' },
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
