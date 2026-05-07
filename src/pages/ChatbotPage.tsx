import { Send, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './ChatbotPage.css';

export default function ChatbotPage() {
  const navigate = useNavigate();
  const suggestedQuestions = [
    "생리통이 심한데 진통제 먹어도 될까요?",
    "생리 주기가 점점 불규칙해져요.",
    "이번 달 생리가 너무 지연되고 있어요.",
    "생리 전 증후군(PMS) 완화 방법이 있나요?"
  ];

  return (
    <div className="chat-container">
      <div className="page-header">
        <button type="button" className="back-button" onClick={() => navigate(-1)} aria-label="뒤로">
          <ChevronLeft size={24} />
        </button>
        <h1 className="page-title">채팅</h1>
        <div style={{ width: 24 }} aria-hidden />
      </div>

      <div className="chat-header">
        <div className="disclaimer-banner">
          제공되는 답변은 의학적 효력이 없으며, 전문의의 진단을 대체하지 않습니다.
        </div>
      </div>

      <div className="chat-history">
        <div className="chat-bubble-wrapper bot">
          <div className="bot-avatar">
            <img src="/images/character_uterus.png" alt="자궁이" className="bot-avatar-img" />
          </div>
          <div className="chat-bubble">
            안녕하세요 해피님! 자궁이에요.<br/>
            오늘 컨디션은 어떠신가요?<br/>
            궁금한 점이 있다면 무엇이든 물어보세요!
          </div>
        </div>
      </div>

      <div className="chat-input-area">
        <div className="suggested-questions">
          {suggestedQuestions.map((q, idx) => (
            <button key={idx} className="suggestion-pill">
              {q}
            </button>
          ))}
        </div>
        
        <div className="input-box-wrapper">
          <input 
            type="text" 
            className="chat-input"
            placeholder="자궁이에게 질문하기..."
          />
          <button className="send-btn">
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
