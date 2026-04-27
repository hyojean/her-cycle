import { ChevronRight, User } from 'lucide-react';
import './ProfilePage.css';

export default function ProfilePage() {
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
    <div className="profile-container">
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
        <button className="text-btn">로그아웃</button>
        <span style={{ color: 'var(--border-color)' }}>|</span>
        <button className="text-btn">탈퇴</button>
      </div>
    </div>
  );
}
