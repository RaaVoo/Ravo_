import React from 'react';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="footer">
        <div className="footer-container">
            <div className="footer-top">
            <div className="project-name">© 2025 라보야 놀자</div>
            <div className="team-name">덕성여자대학교 컴퓨터공학과 졸업프로젝트</div>
            <div className="team-info">Team BitByBit | GitHub</div>
            </div>
            <div className="footer-bottom">
            아이의 감정을 이해하는 첫걸음, <strong>라보야 놀자</strong>
            </div>
        </div>
        </footer>
    );
};

export default Footer;
