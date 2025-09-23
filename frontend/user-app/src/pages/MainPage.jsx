import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './MainPage.css';
import AOS from 'aos';
import 'aos/dist/aos.css';

const MainPage = () => {
  const aboutRef = useRef(null);
  const ravoRef = useRef(null);
  const functionRef = useRef(null);
  const navigate = useNavigate();

  const scrollTo = (ref) => {
    if (ref && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
  }, []);

  return (
    <div className="main-page-wrapper">
      {/* Hero Section */}
      <section className="hero-section" id="hero">
        <div className="hero-top-bg">
          <div className="hero-content">
            <div className="hero-left" data-aos="fade-right">
              <img src="/images/hero-image.png" alt="아이 일러스트" className="hero-image" />
            </div>
            <div className="hero-right" data-aos="fade-left">
              <h1>라보야 놀자</h1>
              <p className="hero-subtitle">AI와 함께하는 좋은 부모 되기</p>
              <p className="hero-desc">
                ‘라보야 놀자’는<br />
                스마트 스피커와 홈캠을 통해<br />
                아이의 감정과 행동을 분석하고<br />
                맞춤형 육아 솔루션을 제공합니다.
              </p>
            </div>
          </div>
        </div>

        {/* Hero 하단 알약 네비 */}
        <div className="hero-pill-nav">
          <button className="hero-pill" onClick={() => scrollTo(aboutRef)}>About</button>
          <button className="hero-pill" onClick={() => scrollTo(ravoRef)}>Ravo</button>
          <button className="hero-pill" onClick={() => scrollTo(functionRef)}>Function</button>
        </div>

        <div className="hero-bottom-bg" />
      </section>

     {/* About Section */}
    <section id="about" className="section fullpage" ref={aboutRef} data-aos="fade-up">
      <h2>현대 부모들이 겪는 육아 문제</h2>
      <div className="circle-box" data-aos="zoom-in" data-aos-delay="300">
        
        <img src="/images/difficult.png" alt="아이 감정 이해의 어려움" className="about-icon" />
        <img src="/images/time.png" alt="시간 부족으로 인한 거리감" className="about-icon" />
        <img src="/images/money.png" alt="전문가 상담의 비용과 시간 부담" className="about-icon" />

      </div>
    </section>

      {/* Ravo Section */}
      <section id="ravo" className="section" ref={ravoRef} data-aos="fade-right">
        <h2>라보가 해결합니다</h2>
        <div className="ravo-feature-box" data-aos="zoom-in" data-aos-delay="300">
          <div className="ravo-feature">AI 감정 분석</div>
          <div className="ravo-feature">영상 기반 행동 인식</div>
          <div className="ravo-feature">맞춤형 육아 솔루션</div>
        </div>
      </section>

      {/* Ravo Device */}
      <section id="ravo-device" className="section" data-aos="fade-up">
        <h2>스마트 스피커 + 홈캠 라보</h2>
        <p className="ravo-subdesc">
          AI와 함께하는 좋은 부모<br />
          자연스러운 대화, 감정 표현 디스플레이, 영상 분석까지 한 번에
        </p>
        <div className="ravo-photo-placeholder">
        <img 
          src="/images/ravo_robot.png" 
          alt="라보 로봇" 
          className="ravo-photo" 
        />
    </div>
      </section>

      {/* Function Section */}
      <section id="function" className="section" ref={functionRef} data-aos="fade-up">
        <h2>대화하기</h2>
        <div className="feature-card">
          <img src="/images/chat.png" alt="대화하기 기능 이미지" className="function-image" />
        </div>
      </section>

      {/* 홈캠 Section */}
      <section className="section" data-aos="fade-up">
        <h2>홈캠</h2>
        <div className="feature-card">
          <img src="/images/homecam.png" alt="홈캠 이미지" className="function-image" />
        </div>
      </section>

      {/* Report Preview */}
      <section className="section" data-aos="fade-up">
        <h2>부모용 리포트 미리보기</h2>

        <div className="report-row">
          {/* 왼쪽 카드 */}
          <div className="report-block">
            <p className="report-caption">음성 보고서</p>
            <div className="feature-card report-card scrolly">
              <div className="report-inner">
                <img src="/images/voice_re.png" alt="리포트 1 미리보기" loading="lazy" />
              </div>
            </div>
          </div>

          {/* 오른쪽 카드 */}
          <div className="report-block">
            <p className="report-caption">영상 보고서</p>
            <div className="feature-card report-card scrolly">
              <div className="report-inner">
                <img src="/images/video_re.png" alt="리포트 2 미리보기" loading="lazy" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="section final-section" data-aos="fade-up">
        <h2>지금 라보와 함께 시작해볼까요?</h2>
        <div className="button-box">
          <button onClick={() => navigate('/chat')}>라보와 대화하러가기</button>
          <button onClick={() => navigate('/faq')}>F&Q</button>
        </div>
        {/* <div className="circle-image">라보 이미지</div> */}
        <img src="/images/ravo.png" alt="라보 이미지" className="ravo-image" />
      </section>
    </div>
  );
};

export default MainPage;
