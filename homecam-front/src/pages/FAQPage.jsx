import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './FAQPage.css';

const faqData = [
  {
    question: '회원가입은 어떻게 하나요?',
    answer: '상단 메뉴의 "회원가입" 버튼을 통해 가능합니다.',
  },
  {
    question: '아이의 감정 분석은 어떻게 이루어지나요?',
    answer: '아이의 음성과 표정을 AI가 실시간으로 분석해 감정을 파악합니다.',
  },
  {
    question: '아이와 대화한 내용은 어디서 보나요?',
    answer: '"대화하기" 메뉴에서 라보와 나눈 대화를 실시간으로 확인할 수 있어요.',
  },
  {
    question: '분석 결과는 얼마나 자주 확인할 수 있나요?',
    answer: '매일 1회 이상 확인할 수 있으며, 주간 리포트도 제공됩니다.',
  },
  {
    question: '특이사항은 어떻게 기록하나요?',
    answer: '마이페이지의 "아이정보 수정"에서 특이사항을 기록할 수 있습니다.',
  },
  {
    question: '라보와 대화는 어떻게 시작하나요?',
    answer: '"대화하기" 메뉴에서 "라보와 대화하기" 버튼을 누르세요.',
  },
  {
    question: '대화 기록은 보관되나요?',
    answer: '네, 모든 대화는 자동 저장되며 분석 리포트에도 반영됩니다.',
  },
  {
    question: '감정 분석 정확도는 얼마나 되나요?',
    answer: '7세~13세 아동 기준 약 87% 이상의 정확도를 보입니다.',
  },
  {
    question: '분석 결과는 어떻게 활용되나요?',
    answer: '아이에게 맞춤형 솔루션을 제공하는 데 사용됩니다.',
  },
  {
    question: '보고서는 어디서 확인하나요?',
    answer: '분석 결과 메뉴에서 날짜별로 확인할 수 있습니다.',
  },
];

const FAQPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const navigate = useNavigate();


  const goToChatBot = () => {
    navigate('/chatbot');
  };

  const itemsPerPage = 5;

  const handleSearch = (e) => {
    setSearchKeyword(e.target.value);
    setCurrentPage(1); // 검색 시 첫 페이지로 초기화
    setExpandedIndex(null);
  };

  const filteredFaqs = faqData.filter((item) =>
    item.question.toLowerCase().includes(searchKeyword.toLowerCase())
  );

  const totalPages = Math.ceil(filteredFaqs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentFaqs = filteredFaqs.slice(startIndex, startIndex + itemsPerPage);

  const toggleAnswer = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    setExpandedIndex(null);
  };

  return (
    <div className="faq-wrapper">
      <div className="faq-header">
        <h2 className="faq-title">자주 묻는 질문(F&Q)</h2>
        <div className="search-box">
          <input
            type="text"
            placeholder="Search"
            value={searchKeyword}
            onChange={handleSearch}
          />
          <img src="/images/search.png" alt="검색" />
        </div>
      </div>

      <div className="faq-box">
        {currentFaqs.map((item, index) => (
          <div
            key={index}
            className={`faq-item ${expandedIndex === index ? 'expanded' : ''}`}
            onClick={() => toggleAnswer(index)}
          >
            <div className="faq-question">
              <span>{`Q${startIndex + index + 1}. ${item.question}`}</span>
              <img
                className={`arrow-icon ${expandedIndex === index ? 'rotated' : ''}`}
                src="/images/arrow.png"
                alt="화살표"
              />
            </div>
            {expandedIndex === index && (
              <div className="faq-answer">{item.answer}</div>
            )}
          </div>
        ))}

        <div className="faq-pagination">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              className={`faq-page-btn ${currentPage === i + 1 ? 'active' : ''}`}
              onClick={() => handlePageChange(i + 1)}
            >
              {i + 1}
            </button>
          ))}
        </div>

        <div className="faq-inquiry-wrapper">
        <button className="faq-inquiry-btn" onClick={goToChatBot}>
        1:1 문의하기
       </button>
        </div>
      </div>
    </div>
  );
};

export default FAQPage;
