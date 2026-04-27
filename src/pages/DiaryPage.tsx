import { Plus, Info } from 'lucide-react';
import './DiaryPage.css';

export default function DiaryPage() {
  return (
    <div className="diary-container">
      <div className="diary-header">
        <h1 className="text-h2">나의 일기</h1>
        <p className="text-body text-secondary">4월 14일 (화) · 황체기 진입</p>
      </div>

      <div className="diary-content">
        <div className="white-card">
          <textarea 
            className="diary-textarea" 
            placeholder="오늘 하루는 어땠나요? 기분이나 신체 변화를 적어보세요."
          ></textarea>
        </div>

        <div className="record-tags-section">
          <h3 className="text-h3" style={{ marginBottom: 'var(--space-3)' }}>오늘의 상태 기록</h3>
          <div className="record-tags-grid">
            <button className="record-tag-btn active">기분 좋음</button>
            <button className="record-tag-btn">피곤함</button>
            <button className="record-tag-btn">아랫배 통증</button>
            <button className="record-tag-btn">식욕 증가</button>
            <button className="add-tag-btn"><Plus size={16}/>직접 입력</button>
          </div>
        </div>

        <div className="ai-advice-panel">
          <div className="advice-header">
            <div className="advice-icon">🌸</div>
            <h3 className="text-h3">자궁이의 생활 습관 조언</h3>
          </div>
          <p className="text-body" style={{ marginTop: 'var(--space-3)', lineHeight: '1.6' }}>
            해피님, 지금은 <strong>황체기</strong>에 진입했어요. 프로게스테론 분비가 늘어나서 몸이 붓거나 감정 기복이 생길 수 있어요. 오늘은 무리한 운동보다는 가벼운 스트레칭과 따뜻한 차트 한 잔을 추천할게요!
          </p>
        </div>

        <button className="btn btn-primary-filled save-btn">일기 저장하기</button>
      </div>
    </div>
  );
}
