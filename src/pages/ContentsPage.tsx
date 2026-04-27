import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import './ContentsPage.css';

export default function ContentsPage() {
  const recommendedArticles = [
    {
      title: "유기농 생리대 실험 14개 중 12개 자궁 내막 세포 변형",
      desc: "국내 연구진이 시중에 판매 중인 유기농·프리미엄 생리대 제품 14종에 대한 세포 독성 실험을 한 결과, 12개 제품에서 생리대 화학 물질로 인한 자궁내막 세포 변형이 발생한 것으로 드러났습니다.",
      emoji: "🩸"
    },
    {
      title: "생수 1년 마시면, 미세플라스틱 9만개 더 섭취",
      desc: "일회용 플라스틱 생수병에서 발생하는 미세플라스틱이 인체 건강에 심각한 위험이 될 수 있다는 연구 결과가 발표되어 주목됩니다.",
      emoji: "💧"
    },
    {
      title: "’결혼 여부’가 암 영향 준다. 암 위험, 최대 5배 차이",
      desc: "실제, 미혼 여성은 자궁경부암 발생률이 약 3배 높은 것으로 확인됐습니다.",
      emoji: "💍"
    },
    {
      title: "약사가 뽑은 여성암 유발 Top 5",
      desc: "의외로 놓치시는 생활 속 습관들! 종이컵, 영수증, 즉석밥 등 내 몸의 호르몬 체계를 뒤흔드는 주범이에요.",
      emoji: "💊"
    }
  ];

  return (
    <div className="contents-container">
      <div className="contents-header">
        <h1 className="text-h2">콘텐츠</h1>
        <div className="contents-search-wrapper">
          <Search className="contents-search-icon" size={18} />
          <input 
            type="text" 
            className="contents-search" 
            placeholder="검색어를 입력하세요" 
          />
        </div>
      </div>

      <div className="hero-article">
        <div className="hero-image">
          ✂️
        </div>
        <h2 className="hero-title">스트레이트 파마약, 자궁암 위험 55% 높아져</h2>
        <p className="hero-desc">
          미국국립보건원연구에 따르면 해당 제품을 연 4회 이상 사용하는 여성의 자궁암 발생률은 최대 4.05%로, 미사용 여성보다 높게 나타났습니다. 연구 팀은 제품 내 화학 물질이 두피를 통해 흡수돼 영향을 줄 가능성을 제기했으며 위험이 약 55% 증가한 것으로 분석했습니다. 다만 특정 성분과의 직접적인 인과관계는 추가 연구가 필요하다고 밝혔습니다.
        </p>
      </div>

      <div className="article-list-section">
        <h3 className="article-list-title">이런 글은 어때요?</h3>
        
        <div className="article-list">
          {recommendedArticles.map((article, idx) => (
            <div key={idx} className="article-item" style={{ overflow: 'hidden' }}>
              <div className="article-thumb">{article.emoji}</div>
              <div className="article-text-content" style={{ overflow: 'hidden', flex: 1 }}>
                <h4 className="article-item-title">{article.title}</h4>
                <p className="article-item-desc">{article.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pagination-controls">
        <button className="page-btn"><ChevronLeft size={20} color="var(--text-secondary)" /></button>
        <button className="page-btn"><ChevronRight size={20} /></button>
      </div>
    </div>
  );
}
