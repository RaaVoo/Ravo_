// 개인정보 수정 페이지
import React, { useState, useEffect } from 'react';
import TermsPopup from '../Signup/Popup/TermsPopup';
import './UserInfoModify.css';
import ModifyPopup from './Popup/ModifyPopup';
import { useUser } from '../../context/UserContext';        // 사용자 이름 가져옴 (250919)

const UserInfoModify = () => {
    // 팝업들이 열려있는지 상태 확인 코드
    const [popupOpen, setPopupOpen] = useState(false);
    const [modifyPopupOpen, setModifyPopupOpen] = useState(false);

    // 아이디 중복 관련
    const [userId, setUserId] = useState('');

    // 기본 정보
    const [newPw, setNewPw] = useState('');          // 새 비밀번호
    const [newPw2, setNewPw2] = useState('');        // 새 비밀번호 확인
    const [uName, setUName] = useState('');
    const [gender, setGender] = useState('');             // 'M' | 'F' | ''
    const [uPhone, setUPhone] = useState('');             // 숫자만

    // 이메일 인증 관련
    const [originalEmail, setOriginalEmail] = useState('');     // 변경 전 원래 이메일
    const [uEmail, setUEmail] = useState('');
    const [emailSending, setEmailSending] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [emailMsg, setEmailMsg] = useState('');

    const [emailCode, setEmailCode] = useState('');
    const [emailVerifying, setEmailVerifying] = useState(false);
    const [emailVerified, setEmailVerified] = useState(false);
    const [emailVerifyMsg, setEmailVerifyMsg] = useState('');

    // 사용자 이름 가져옴 (250919)
    const { updateUserName } = useUser();

    // 1) 디비에 저장된 값 불러오기
    useEffect(() => {
        const fetchMyInfo = async () => {
            try {
                const res = await fetch('/mypage/me', { credentials: 'include' });
                if (!res.ok) throw new Error('사용자 정보를 불러오지 못했습니다.');
                const data = await res.json();

                setUserId(data.user?.user_id || '');     // 아이디는 읽기 전용
                setUName(data.user?.u_name || '');
                setGender(data.user?.u_gender || '');
                setUPhone(data.user?.u_phone || '');
                setUEmail(data.user?.u_email || '');
                setOriginalEmail(data.user?.u_email || '');     // 변경 전 원래 이메일 저장
            } catch (err) {
                console.error(err);
                alert(err.message);
            }
        };

        fetchMyInfo();
    }, []);

    // 2) '이메일 인증 코드 전송' 관련
    const handleEmailSend = async (e) => {
        e.preventDefault();

        const email = uEmail.trim();
        if (!email) {
            setEmailSent(false);
            setEmailMsg('이메일을 입력해주세요.');
            return;
        }

        try {
            setEmailSending(true);
            setEmailMsg('');
            const res = await fetch('/auth/email-auth/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ u_email: email }),
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.error || '메일 전송 실패');
            }
            setEmailSent(true);
            setEmailMsg('인증 번호가 전송되었습니다. 메일을 확인해주세요.');
        } catch (err) {
            setEmailSent(false);
            setEmailMsg(err.message);
        } finally {
            setEmailSending(false);
        }
    };

    // 3) '이메일 인증 코드 검증' 관련
    const handleEmailVerify = async (e) => {
        e.preventDefault();

        const email = uEmail.trim();
        const code = emailCode.trim();

        if (!email) { 
            setEmailVerifyMsg('이메일을 입력해주세요.'); 
            return; 
        }
        if (!code) { 
            setEmailVerifyMsg('인증번호를 입력해주세요.'); 
            return; 
        }

        try {
            setEmailVerifying(true);
            setEmailVerifyMsg('');
            const res = await fetch('/auth/email-auth/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ u_email: email, code }),
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.error || '인증에 실패했습니다.');
            }

            setEmailVerified(true);             // 이메일 인증 성공 + 이메일 입력 완료
            setEmailVerifyMsg('이메일 인증이 완료되었습니다.');
        } catch (err) {
            setEmailVerified(false);
            setEmailVerifyMsg(err.message);
        } finally {
            setEmailVerifying(false);
        }
    };

    // 4) 개인정보 수정 완료
    const handleModify = async (e) => {
        e.preventDefault();

        // 비밀번호 일치 여부
        if (newPw && newPw !== newPw2) return alert('새 비밀번호가 일치하지 않습니다.');
        if (!uName.trim()) return alert('이름을 입력해주세요.');
        if (!uPhone.trim()) return alert('휴대전화번호를 입력해주세요.');

        // 이메일이 변경된 경우 (originalEmail과 입력창에 입력된 이메일이 다른경우) -> 이 경우 인증 필요
        const emailChanged = uEmail.trim() !== originalEmail.trim();
        if (emailChanged && !emailVerified) {
            return alert("이메일 인증을 완료해주세요.");
        }

        try {
            // 이메일이 변경되었을 경우 -> 인증번호 필요 / 변경 안된경우 필요x
            const payload = {
                ...(newPw ? { new_pw: newPw } : {}),   // << 새 비번 있으면 보냄, 없으면 아예 제외
                u_name: uName.trim(),
                u_gender: gender || null,
                u_phone: uPhone.trim(),
                u_email: uEmail.trim(),
                ...(uEmail !== originalEmail ? { emailVerificationCode: emailCode } : {})
            };
            const res = await fetch('/mypage/me/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || '수정 실패');

            // 개인정보(이름) 수정 후 바로 반영 (250919) -> 상태 업데이트
            updateUserName(uName.trim());

            setModifyPopupOpen(true);
        } catch (err) {
            alert(err.message);
        }
    };
  return (
    <div className="user-info-container">
        <div className="user-info-background-section">
            {/* 회원가입 시 정보 입력창 */}
            <div className="user-info-box">
                <h1 className="user-info-title-sub">개인정보 수정하기</h1>

                <form className="user-info-form">
                    {/* 아이디 입력 */}
                    <div className="user-info-input-group1">
                        <label>아이디<span className='star-text'>*</span></label>
                        <input type="text" value={userId} disabled/>
                        <button className="user-info-small-btn1" disabled >중복 확인</button>
                    </div>

                    {/* 새 비밀번호 입력 */}
                    <div className="user-info-input-group0">
                        <label>새 비밀번호<span className='star-text'>*</span></label>
                        <input 
                            type="password" 
                            value={newPw}
                            placeholder='변경할 비밀번호를 입력해주세요. (6자리 이상)'
                            onChange={(e) => setNewPw(e.target.value)}
                        />
                    </div>
                    <div className="user-info-input-group0">
                        <label>새 비밀번호 확인<span className='star-text'>*</span></label>
                        <input 
                            type="password" 
                            placeholder="비밀번호를 한번 더 입력해주세요."
                            value={newPw2}
                            onChange={(e) => setNewPw2(e.target.value)}    
                        />
                    </div>
                    {newPw && newPw2 && newPw !== newPw2 && (
                        <b className="helper-text" style={{ color:'#FF8383', paddingLeft:'36px', fontSize:'15px' }}>
                            비밀번호가 일치하지 않습니다.
                        </b>
                    )}

                    {/* 인적사항 입력 */}
                    <div className="user-info-input-group0">
                        <label>이름<span className='star-text'>*</span></label>
                        <input 
                            type="text" 
                            value={uName}
                            onChange={(e) => setUName(e.target.value)}    
                        />
                    </div>
                    <div className="user-info-input-group0" data-label="gender">
                        <label>성별</label>
                        <div className="user-info-gender-options">
                            <label><input type="radio" name="gender" value="M" checked={gender==='M'} onChange={()=>setGender('M')} /> 남자</label>
                            <label><input type="radio" name="gender" value="F" checked={gender==='F'} onChange={()=>setGender('F')} /> 여자</label>
                        </div>
                    </div>
                    <div className="user-info-input-group0">
                        <label>휴대전화번호<span className='star-text'>*</span></label>
                        <input 
                            type="text" 
                            value={uPhone}
                            onChange={(e) => setUPhone(e.target.value.replace(/[^\d]/g,''))}
                        />
                    </div>
                    {/* 이메일 입력 */}
                    <div className="user-info-input-group0">
                        <label>이메일<span className='star-text'>*</span></label>
                        <input 
                            type="email" 
                            value={uEmail}
                            onChange={(e) => {
                                setUEmail(e.target.value);
                                setEmailVerified(false);        // 변경 시 인증 해제
                            }}
                            disabled={emailVerified && uEmail === originalEmail}            // 인증 완료 후 수정 못함 + 이메일 변경 x면 수정 못함
                        />
                        <button className="user-info-small-btn" onClick={handleEmailSend} disabled={emailSending || (uEmail === originalEmail)}>인증 요청</button>
                    </div>

                    {/* 이메일 전송 결과 메세지 */}
                    {!!emailMsg && (
                        <b
                            className='helper-text'
                            style={{ color: emailSent ? '#1e8e3e' : '#FF8383', paddingLeft: '36px', fontSize: '15px', marginTop: '-15px' }}
                        >
                            {emailMsg}
                        </b>
                    )}

                    {/* 이메일 인증 코드 입력 */}
                    {uEmail !== originalEmail && (
                        <div className="user-info-input-group0" data-label="verify">
                            <input 
                                type="text" 
                                placeholder="인증번호를 입력해주세요." 
                                value={emailCode}
                                onChange={(e) => {
                                    setEmailCode(e.target.value);
                                }}
                                disabled={!emailSent || emailVerified}
                            />
                            <button className="user-info-small-btn" data-label="verify-complete" onClick={handleEmailVerify} disabled={emailVerifying || emailVerified}>인증 완료</button>
                            {/* <p className="verify-complete">인증이 완료되었습니다.</p> */}
                        </div>
                    )}

                    {/* 이메일 검증 완료 메세지 */}
                    {!!emailVerifyMsg && (
                    <b
                        className="helper-text"
                        style={{ color: emailVerified ? '#1e8e3e' : '#FF8383', paddingLeft: '36px', fontSize: '15px', marginTop: '-15px' }}
                    >
                        {emailVerifyMsg}
                    </b>
                    )}

                    <button className="user-info-btn" onClick={handleModify}>수정완료</button>
                </form>
            </div>
        </div>

        {/* 팝업 관련 내용 */}
        {popupOpen && <TermsPopup onClose={() => setPopupOpen(false)} />}

        {/* 회원가입 완료 팝업 */}
        {modifyPopupOpen && <ModifyPopup onClose={() => setModifyPopupOpen(false)} />}
    </div>
  );
};

export default UserInfoModify;