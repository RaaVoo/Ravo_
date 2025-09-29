// src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import Header from './components/Header';
import Footer from './components/Footer';
// 음성 보고서
import VoiceReport from './components/VoiceReport';       // 상세 페이지
import VoiceReportList from './components/VoiceReportList'; // 목록 페이지
// 영상 보고서
import VideoReport from './components/VideoReport';
import VideoReportList from './components/VideoReportList';

const RequireAuth = ({ children }) => {
  // 필요하면 토큰/쿠키 체크
  const isLoggedIn = true;
  return isLoggedIn ? children : <Navigate to="/login" replace />;
};

function App() {
  
  return (
    <div className="app-container">
      <Header 
        showAsLoggedIn={true}     // ✅ 항상 로그인 UI로 보이기
        mockUserName="김가나" // 로그인명 없을 때 표시
      />
      <main style={{ margin: '100px' }}>
        <Routes>
          
          {/* === 영상 보고서 === */}
          {/* 목록 */}
          <Route path="/report/video" element={<RequireAuth><VideoReportList /></RequireAuth>}/>
          {/* 상세 */}
          <Route path="/report/video/:video_no" element={<RequireAuth><VideoReport /></RequireAuth>}/>

          {/* === 음성 보고서 === */}
          {/* 목록 */}
          <Route path="/report/voice" element={<RequireAuth><VoiceReportList /></RequireAuth>} />
          {/* 상세 */}
          <Route path="/report/voice/:id" element={<RequireAuth><VoiceReport/></RequireAuth>} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
