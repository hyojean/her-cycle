import { Search, Camera, Image as ImageIcon, ChevronRight, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './ScannerPage.css';

export default function ScannerPage() {
  const navigate = useNavigate();

  return (
    <div className="scanner-container">
      <div className="page-header">
        <button type="button" className="back-button" onClick={() => navigate(-1)} aria-label="뒤로">
          <ChevronLeft size={24} />
        </button>
        <h1 className="page-title">성분 분석 스캐너</h1>
        <div style={{ width: 24 }} aria-hidden />
      </div>

      <div className="scanner-header">
        <p className="text-body">제품의 호르몬 유해도를 빠르게 확인하세요.</p>
      </div>

      <div className="search-bar-wrapper">
        <Search className="search-icon" size={20} />
        <input 
          type="text" 
          className="search-input" 
          placeholder="제품명, 브랜드, 성분 검색" 
        />
      </div>

      <h2 className="text-h3" style={{ marginBottom: 'var(--space-2)' }}>제품 스캔하기</h2>
      <div className="scan-actions-grid">
        <button className="scan-action-card">
          <div className="action-icon-wrapper">
            <Camera size={24} />
          </div>
          <div>
            <h3>바코드/성분 촬영</h3>
            <p>카메라로 직접 찍기</p>
          </div>
        </button>

        <button className="scan-action-card">
          <div className="action-icon-wrapper">
            <ImageIcon size={24} />
          </div>
          <div>
            <h3>이미지 업로드</h3>
            <p>갤러리에서 사진 선택</p>
          </div>
        </button>
      </div>

      <div className="recent-scans-section">
        <div className="recent-scans-header">
          <h2 className="text-h3">최근 분석 기록</h2>
          <span className="text-caption" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            전체보기 <ChevronRight size={14} />
          </span>
        </div>
        
        <div className="empty-state">
          아직 스캔한 제품이 없어요.<br />
          궁금한 제품의 유해도를 확인해보세요!
        </div>
      </div>
    </div>
  );
}
