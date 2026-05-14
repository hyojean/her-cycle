import { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import './HomePage.css';

type Lang = 'ko' | 'en';
const HOME_LANG_STORAGE_KEY = 'home:lang';

function loadLangFromStorage(): Lang {
  if (typeof window === 'undefined') return 'en';
  try {
    const raw = window.localStorage.getItem(HOME_LANG_STORAGE_KEY);
    return raw === 'ko' || raw === 'en' ? raw : 'en';
  } catch {
    return 'en';
  }
}

export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [lang, setLang] = useState<Lang>(() => loadLangFromStorage());

  useEffect(() => {
    try {
      window.localStorage.setItem(HOME_LANG_STORAGE_KEY, lang);
    } catch {
      // ignore quota / private mode errors
    }
  }, [lang]);

  const handleMockLogin = () => {
    setIsLoggedIn(true);
  };

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
        <div className="lang-toggle" role="tablist" aria-label="언어 선택">
          <button
            type="button"
            role="tab"
            aria-selected={lang === 'ko'}
            className={`lang-btn ${lang === 'ko' ? 'active' : ''}`}
            onClick={() => setLang('ko')}
          >
            한국어
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={lang === 'en'}
            className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
            onClick={() => setLang('en')}
          >
            English
          </button>
        </div>

        <div className="character-placeholder" style={{ backgroundColor: 'transparent', position: 'relative' }}>
          <img src="/images/character_uterus.png" alt="자공이 캐릭터" style={{ width: '180%', height: '180%', objectFit: 'contain', mixBlendMode: 'multiply', filter: 'contrast(1.1) brightness(1.1)', position: 'absolute', top: '-40%', left: '-40%' }} />
        </div>

        {isLoggedIn ? (
          <>
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
          </>
        ) : (
          <div className="login-prompt-area" style={{ width: '100%', padding: '0 var(--space-2)' }}>
            <h1 className="greeting-title" style={{ marginBottom: 'var(--space-4)' }}>환영합니다!</h1>
            <p className="greeting-desc" style={{ marginBottom: 'var(--space-8)' }}>
              로그인 후<br />
              생리 주기와 정보를 등록하시면<br />
              자궁이가 스케줄과 생활 습관을 조언해 드릴게요.
            </p>
            
            <button className="social-login-btn" onClick={handleMockLogin}>
              <div className="social-icon-wrapper">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M23.04 12.261c0-.853-.076-1.674-.22-2.46H12v4.654h6.458c-.279 1.505-1.127 2.78-2.401 3.633v3.01h3.892c2.278-2.096 3.591-5.18 3.591-8.837z" fill="#4285F4"/>
                  <path d="M12 24c3.24 0 5.955-1.075 7.941-2.902L16.05 18.09c-1.077.72-2.455 1.147-4.048 1.147-3.125 0-5.77-2.112-6.714-4.948H1.276v3.109C3.25 21.31 7.309 24 12 24z" fill="#34A853"/>
                  <path d="M5.285 14.288A6.68 6.68 0 0 1 4.925 12c0-.79.136-1.56.36-2.288V6.602H1.276A11.954 11.954 0 0 0 0 12c0 1.933.464 3.766 1.276 5.398l4.009-3.11z" fill="#FBBC05"/>
                  <path d="M12 4.773c1.761 0 3.344.606 4.587 1.792l3.442-3.442C17.947 1.189 15.232 0 12 0 7.309 0 3.25 2.69 1.276 6.602l4.009 3.11c.942-2.836 3.589-4.94 6.714-4.94z" fill="#EA4335"/>
                </svg>
              </div>
              Google 계정으로 로그인
            </button>
            <button className="social-login-btn" onClick={handleMockLogin}>
              <div className="social-icon-wrapper">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="12" fill="#FEE500"/>
                  <path d="M12 5.5c-4.417 0-8 2.805-8 6.265 0 2.215 1.488 4.155 3.738 5.32l-1.036 3.864c-.062.235.21.41.413.27l4.468-3.003c.138.01.276.015.417.015 4.417 0 8-2.805 8-6.266S16.417 5.5 12 5.5z" fill="#191919"/>
                </svg>
              </div>
              카카오 계정으로 로그인
            </button>
          </div>
        )}
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
