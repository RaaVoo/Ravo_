// src/App.jsx
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import HomecamPage from './pages/HomecamPage';
import HomecamDetail from './pages/HomecamDetail';
import HomecamList from './pages/HomecamList';
import ChatPage from './pages/ChatPage';
import Footer from './components/Footer';
import FAQPage from './pages/FAQPage';
import ChatBot from './pages/ChatBot';
import ChatButton from './components/ChatButton';
import ScrollTopButton from './components/ScrollTopButton';

// ✅ HLS Player import
import HlsPlayer from './pages/HlsPlayer';

const HLS_URL = "http://10.207.17.0:3000/stream/out.m3u8";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [userName, setUserName] = useState('예지');

  return (
    <Router>
      <Header
        isLoggedIn={isLoggedIn}
        userName={userName}
        onLogout={() => {
          setIsLoggedIn(false);
          setUserName('');
        }}
      />

      <Routes>
        <Route path="/homecam" element={<HomecamPage />} />
        <Route path="/homecam/camlist" element={<HomecamList />} />
        <Route path="/homecam/camlist/:record_no" element={<HomecamDetail />} />
        <Route path="/chatbot" element={<ChatBot />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/faq" element={<FAQPage />} />

        {/* ✅ Pi Camera HLS 스트리밍 테스트 페이지 */}
        <Route
          path="/stream-test"
          element={
            <div style={{ padding: 16 }}>
              <h1>Pi Camera Stream (HLS)</h1>
              <HlsPlayer src={HLS_URL} />
            </div>
          }
        />
      </Routes>

      {/* ✅ 전역 플로팅 채팅 버튼 */}
      <ChatButton
        to="/chatbot"
        hideOnPaths={['/chatbot']}
        bottom={32}
        right={32}
        size={64}
        bgColor="#68D2E8"
      />
      <ScrollTopButton />
      <Footer />
    </Router>
  );
}

export default App;
