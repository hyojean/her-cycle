import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import './HomePage.css';

export default function HomePage() {
  const menuItems = [
    {
      title: '스케줄 관리',
      sub: '내 주기 기반으로 스케줄을 재배치해요.',
      icon: '/images/icon_calendar.png',
      link: '/calendar',
    },
    {
      title: '일기 작성',
      sub: '내 주기 기반으로 생활 습관을 관리해요.',
      icon: '/images/icon_diary.png',
      link: '/diary',
    },
    {
      title: '챗봇 대화',
      sub: '논문 기반 챗봇에게 궁금한 점을 물어봐요.',
      icon: '/images/icon_chatbot.png',
      link: '/chatbot',
    },
    {
      title: '호르몬 유해 제품 성분 분석',
      sub: '호르몬을 교란하는 유해 성분을 분석해요.',
      icon: '/images/icon_earth.png',
      link: '/scanner',
    },
    {
      title: '호르몬 콘텐츠',
      sub: '호르몬 관리에 유용한 콘텐츠를 둘러봐요.',
      icon: '/images/icon_butterfly.png',
      link: '/contents',
    },
    {
      title: '마이페이지',
      sub: '내 생체 주기와 관련 질환을 등록해요.',
      icon: '/images/icon_profile.png',
      link: '/profile',
    },
  ];

  return (
    <div className="home-container">
      {/* Top Greeting Card */}
      <div className="main-greeting-card">
        <div className="lang-toggle">
          <button className="lang-btn">한국어</button>
          <button className="lang-btn active">English</button>
        </div>

        <div className="character-placeholder" style={{ backgroundColor: 'transparent', position: 'relative' }}>
          <img src="/images/character_uterus.png" alt="자공이 캐릭터" style={{ width: '180%', height: '180%', objectFit: 'contain', mixBlendMode: 'multiply', filter: 'contrast(1.1) brightness(1.1)', position: 'absolute', top: '-40%', left: '-40%' }} />
        </div>

        <h1 className="greeting-title">안녕하세요 자공이님</h1>
        <p className="greeting-desc">
          지금은 황체기로 월경 시작 2일 전으로 예상돼요.<br />
          생리 전 증후군이 발생할 수 있어요.<br />
          유제품 섭취는 지양하고 배를 따뜻하게 해 주세요.<br />
          액티비티한 활동은 2주 후에 추천해요.
        </p>

        <div className="summary-grid">
          <div className="summary-card">
            <span className="summary-title">월경 시작</span>
            <span className="summary-value">D-2</span>
          </div>
          <div className="summary-card">
            <span className="summary-title">금일 일정</span>
            <span className="summary-value">3개</span>
          </div>
        </div>
      </div>

      {/* Menu List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {menuItems.map((item, index) => (
          <Link to={item.link} key={index} className="menu-card" style={{ overflow: 'hidden' }}>
            <div className="menu-icon-placeholder" style={{ backgroundColor: 'transparent', position: 'relative' }}>
              <img src={item.icon} alt={item.title} style={{ width: '150%', height: '150%', objectFit: 'contain', mixBlendMode: 'multiply', filter: 'contrast(1.1) brightness(1.1)', position: 'absolute', top: '-25%', left: '-25%' }} />
            </div>
            <div className="menu-text">
              <h2 className="menu-title">{item.title}</h2>
              <p className="menu-subtitle">{item.sub}</p>
            </div>
            <ChevronRight size={24} color="#CCC" />
          </Link>
        ))}
      </div>

      {/* Bottom Banner */}
      <div className="bottom-banner">
        <div className="banner-text-wrapper">
          <h2 className="banner-title">
            알림을 통해<br />관리를 받으세요
          </h2>
          <p className="banner-desc">
            생체 주기와 라이프스타일을<br />동기화하세요.
          </p>
        </div>
        <div className="banner-icon-placeholder" style={{ backgroundColor: 'transparent', position: 'relative' }}>
          <div className="white-glow-blob" />
          <img src="/images/icon_mail.png" alt="알림 메일" style={{ width: '200%', height: '200%', objectFit: 'contain', mixBlendMode: 'multiply', filter: 'contrast(1.1) brightness(1.1)', position: 'absolute', top: '-50%', left: '-60%', zIndex: 1 }} />
        </div>
      </div>
    </div>
  );
}
