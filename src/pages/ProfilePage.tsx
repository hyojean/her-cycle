import { useState } from 'react';
import { ChevronRight, User, ChevronLeft, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './CalendarPage.css';
import './ProfilePage.css';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import { ensureSupabaseSession } from '../lib/supabaseAuth';

export default function ProfilePage() {
  const navigate = useNavigate();
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  const handleConfirmLogout = async () => {
    const sb = getSupabase();
    if (sb && isSupabaseConfigured()) {
      try {
        const { error } = await sb.auth.signOut();
        if (error) console.error(error);
        await ensureSupabaseSession(sb);
      } catch (e) {
        console.error(e);
      }
    }
    setLogoutModalOpen(false);
    navigate('/');
  };
  const profileSettings = [
    { label: '닉네임', value: '해피님' },
    { label: '생년월일 또는 나이', value: '28세' },
    { label: '보유 여성 질환(난소/자궁/유방)', value: '없음' },
    { label: '복약 중인 약', value: '피임약' },
    { label: '임신 여부', value: '해당 없음' },
    { label: '월경 주기', value: '28일' },
    { label: '월경 기간', value: '5일' },
  ];

  return (
    <div className={`profile-container${logoutModalOpen ? ' profile-container--modal-open' : ''}`}>
      <div className="page-header">
        <button type="button" className="back-button" onClick={() => navigate(-1)} aria-label="뒤로">
          <ChevronLeft size={24} />
        </button>
        <h1 className="page-title">마이페이지</h1>
        <div style={{ width: 24 }} aria-hidden />
      </div>

      <div className="profile-header">
        <div className="profile-avatar">
          <User size={32} />
        </div>
        <div className="profile-info">
          <h1 className="text-h2">해피님</h1>
          <p className="text-body text-secondary">오늘도 건강한 하루 보내세요!</p>
        </div>
      </div>

      <div className="profile-section">
        <div className="section-title">
          <h2 className="text-h3">프로필 설정</h2>
        </div>
        <div className="menu-list">
          {profileSettings.map((item, idx) => (
            <button key={idx} className="menu-item">
              <span className="text-body">{item.label}</span>
              <div className="menu-item-right">
                {item.value && <span className="menu-item-value">{item.value}</span>}
                <ChevronRight size={18} color="var(--text-secondary)" />
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="account-actions">
        <button type="button" className="text-btn" onClick={() => setLogoutModalOpen(true)}>
          로그아웃
        </button>
        <span style={{ color: 'var(--border-color)' }}>|</span>
        <button type="button" className="text-btn">
          탈퇴
        </button>
      </div>

      {logoutModalOpen ? (
        <div
          className="modal-overlay"
          onClick={() => setLogoutModalOpen(false)}
          role="presentation"
        >
          <div className="form-modal figma-confirm-sheet" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="figma-confirm-sheet-close"
              onClick={() => setLogoutModalOpen(false)}
              aria-label="닫기"
            >
              <X size={22} color="#A3AAB2" strokeWidth={1.5} />
            </button>
            <div className="figma-confirm-sheet-body">
              <p className="figma-confirm-sheet-primary">로그아웃하시겠습니까?</p>
            </div>
            <div className="form-modal-actions figma-confirm-sheet-actions">
              <button type="button" className="form-btn-cancel" onClick={() => setLogoutModalOpen(false)}>
                취소
              </button>
              <button type="button" className="form-btn-submit" onClick={() => void handleConfirmLogout()}>
                로그아웃
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
