import React, { useState } from 'react';
import TermsPopup from './Popup/TermsPopup';
import IdCheckPopup from './Popup/IdCheckPopup';
import JoinPopup from './Popup/JoinPopup';
import './SignupPage.css';


const Signup = () => {
    // 팝업들이 열려있는지 상태 확인 코드
    const [popupOpen, setPopupOpen] = useState(false);
    const [idCheckPopupOpen, setIdCheckPopupOpen] = useState(false);
    const [joinPopupOpen, setJoinPopupOpen] = useState(false);
    //const [checked, setChecked] = useState(false);

    // 아이디 중복 관련
    const [userId, setUserId] = useState('');
    const [checking, setChecking] = useState(false);
    const [idMessage, setIdMessage] = useState('');             // 에러 안내 메세지
    const [isAvailable, setIsAvailable] = useState(null);       // null or true or false
    const [idOk, setIdOk] = useState(false);                    // 아이디 입력 여부

    // 이용약관 관련 팝업
    // const openPopup = (e) => {
    //     e.preventDefault();  // 링크 이동 방지
    //     setPopupOpen(true);
    // };

    // 기본 정보
    const [userPw, setUserPw] = useState('');
    const [userPw2, setUserPw2] = useState('');
    const [uName, setUName] = useState('');
    const [gender, setGender] = useState('');             // 'M' | 'F' | ''
    const [uPhone, setUPhone] = useState('');             // 숫자만

    // 이메일 인증 관련
    const [uEmail, setUEmail] = useState('');
    const [emailSending, setEmailSending] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [emailMsg, setEmailMsg] = useState('');

    const [emailCode, setEmailCode] = useState('');
    const [emailVerifying, setEmailVerifying] = useState(false);
    const [emailVerified, setEmailVerified] = useState(false);
    const [emailVerifyMsg, setEmailVerifyMsg] = useState('');

    // 이용약관 체크
    const [agree, setAgree] = useState(false);

    // 1) '아이디 중복 확인' 관련
    const handleIdCheck = async (e) => {
        e.preventDefault();                 // 폼 제출 막기

        const id = userId.trim();
        // 아이디 입력 x인 경우
        if (!id) {
            setIsAvailable(null);
            setIdMessage('아이디를 입력해주세요.');
            return;
        }

        try {
            setChecking(true);
            setIdMessage('');

            // CRA proxy가 있다면 상대경로 OK (package.json: "proxy":"http://localhost:8080")
            const res = await fetch(`/auth/id-check?user_id=${encodeURIComponent(id)}`);        // DB에 같은 아이디가 있는지 확인

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || '중복 확인에 실패했습니다.');
            }

            const data = await res.json();          // { isAvailable: boolean }
            setIsAvailable(data.isAvailable);

            if (data.isAvailable) {
                // 사용 가능 → 팝업 열기
                setIdOk(true);                      // 아이디 입력 + 중복체크 완료
                setIdCheckPopupOpen(true);          // 아이디 중복 관련 팝업
                setIdMessage('');                   // 팝업을 띄우니 메시지는 비움
            } else {
                // 이미 사용 중
                setIdOk(false);
                setIdMessage('이미 사용 중인 아이디입니다.');
            }
        } catch (err) {
            setIsAvailable(null);
            setIdOk(false);
            setIdMessage(err.message);
        } finally {
            setChecking(false);
        }
    };

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

    // 4) 회원가입 완료 관련 팝업
    const openJoinPopup = (e) => {
        e.preventDefault();

        // 휴대폰 간단 검증 (숫자 11자리)
        const phoneOk = /^[0-9]{11}$/.test(uPhone.replace(/\D/g, ''));

        // 비번 일치 여부
        const pwOk = userPw.length >= 6 && userPw === userPw2; // 예시 기준

        // 전체 조건
        if (!idOk)         return alert('아이디를 입력해주세요.');
        if (!pwOk)         return alert('비밀번호를 6자리 이상 입력해주세요.');
        if (!uName.trim()) return alert('이름을 입력해주세요.');
        if (!gender)       return alert('성별을 선택해주세요.');
        if (!phoneOk)      return alert('휴대전화번호를 숫자만(11자리) 입력해주세요.');
        if (!emailVerified)return alert('이메일 인증을 완료해주세요.');

        // 이용약관 체크박스 체크 여부
        const checkbox = document.getElementById('agree');
        if (!checkbox.checked) {
            alert("⚠️ 이용약관에 동의해주세요.");
            return;
        }

        setJoinPopupOpen(true);
    }

    // 아이 정보 입력 페이지 이동 관련
    const handleSignup = async () => {
        try {
            // 1) 회원가입 요청 payload 구성
            const payload = {
                user_id: userId.trim(),
                user_pw: userPw,
                u_name: uName.trim(),
                u_email: uEmail.trim(),
                u_phone: uPhone.trim(),             // 숫자만으로 이미 정규화 중
                u_gender: gender || null,           // 'M' | 'F'
            };

            // 회원가입
            const res = await fetch('/auth/signup', {
                method: 'POST',
                headers: {'Content-Type':'application/json'},
                body: JSON.stringify(payload),
            });

            // 회원가입 데이터 디비에 넣기
            const signData = await res.json().catch(() => ({}));
            if (!res.ok) {
                alert(signData.error || '회원가입 실패'); 
                return;
            }

            // 2) 곧바로 로그인해서 인증정보 확보 (백엔드가 header 토큰을 주는 형태라면 localStorage 저장)
            const loginRes = await fetch('/auth/login', {
                method: 'POST',
                headers: {'Content-Type':'application/json'},
                credentials: 'include',         // 추가함 잠깐
                body: JSON.stringify({ 
                    user_id: payload.user_id,
                    user_pw: payload.user_pw,
                }),
            });

            const loginData = await loginRes.json();
            if (!loginRes.ok) { 
                alert(loginData.error || '자동 로그인 실패'); 
                return; 
            }

            // 3) 기존 로그인 로직 그대로
            localStorage.setItem('token', loginData.token);
            localStorage.setItem('userName', loginData.u_name);

            // 4) 아이 등록 화면으로
            window.location.href = '/auth/signup/child';
        } catch (e) {
            alert(e.message || '회원가입 처리 중 오류가 발생하였습니다.');
        }
    };
  return (
    <div className="signup-container">
        <div className="background-section">
            {/* 회원가입 시 정보 입력창 */}
            <div className="signup-box">
                <h1 className="title-main">라보야 놀자</h1>
                <h1 className="title-sub">회원가입하기</h1>

                <form className="signup-form">
                    {/* 아이디 입력 */}
                    <div className="input-group1">
                        <label>아이디<span className='star-text'>*</span></label>
                        <input 
                            type="text" 
                            placeholder="아이디를 입력해주세요."
                            value={userId}
                            onChange={(e) => {
                                setUserId(e.target.value);
                                setIsAvailable(null);
                                setIdMessage('');
                                setIdOk(false);         // 값 바뀌면 다시 확인 필요
                            }}
                        />
                        {/* <button className="small-btn1" onClick={openIdCheckPopup}>중복 확인</button> */}
                        <button className="small-btn1" onClick={handleIdCheck} disabled={checking} >중복 확인</button>
                    </div>

                    {/* 팝업을 띄우지 않는 경우 = 아이디 입력 x, 중복인 경우 */}
                    {!!idMessage && (
                        <b
                            className="helper-text"
                            style={{ color: isAvailable ? '#1e8e3e' : '#FF8383', paddingLeft: '36px', fontSize: '15px', marginBottom: '-10px' }}
                        >
                            {idMessage}
                        </b>
                    )}

                    {/* 비밀번호 입력 */}
                    <div className="input-group0">
                        <label>비밀번호<span className='star-text'>*</span></label>
                        <input 
                            type="password" 
                            placeholder="비밀번호를 입력해주세요. (영어/숫자/특수문자포함)"
                            value={userPw}
                            onChange={(e) => setUserPw(e.target.value)}
                        />
                    </div>
                    <div className="input-group0">
                        <label>비밀번호 확인<span className='star-text'>*</span></label>
                        <input 
                            type="password" 
                            placeholder="비밀번호를 한번 더 입력해주세요."
                            value={userPw2}
                            onChange={(e) => setUserPw2(e.target.value)}    
                        />
                    </div>
                    {userPw && userPw2 && userPw !== userPw2 && (
                        <b className="helper-text" style={{ color:'#FF8383', paddingLeft:'36px', fontSize:'15px' }}>
                            비밀번호가 일치하지 않습니다.
                        </b>
                    )}

                    {/* 인적사항 입력 */}
                    <div className="input-group0">
                        <label>이름<span className='star-text'>*</span></label>
                        <input 
                            type="text" 
                            placeholder="이름을 입력해주세요."
                            value={uName}
                            onChange={(e) => setUName(e.target.value)}    
                        />
                    </div>
                    <div className="input-group0" data-label="gender">
                        <label>성별</label>
                        <div className="gender-options">
                            <label><input type="radio" name="gender" value="M" checked={gender==='M'} onChange={()=>setGender('M')} /> 남자</label>
                            <label><input type="radio" name="gender" value="F" checked={gender==='F'} onChange={()=>setGender('F')} /> 여자</label>
                        </div>
                    </div>
                    <div className="input-group0">
                        <label>휴대전화번호<span className='star-text'>*</span></label>
                        <input 
                            type="text" 
                            placeholder="휴대전화번호를 입력해주세요. (-없이 숫자만 입력)"
                            value={uPhone}
                            onChange={(e) => setUPhone(e.target.value.replace(/[^\d]/g,''))}
                        />
                    </div>
                    {/* 이메일 입력 */}
                    <div className="input-group0">
                        <label>이메일<span className='star-text'>*</span></label>
                        <input 
                            type="email" 
                            placeholder="이메일을 입력해주세요." 
                            value={uEmail}
                            onChange={(e) => {
                                setUEmail(e.target.value);
                                setEmailMsg('');
                                setEmailSent(false);
                            }}
                            disabled={emailVerified}            // 인증 완료 후 수정 못함
                        />
                        <button className="small-btn" onClick={handleEmailSend} disabled={emailSending || emailVerified}>인증 요청</button>
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
                    <div className="input-group0" data-label="verify">
                        <input 
                            type="text" 
                            placeholder="인증번호를 입력해주세요." 
                            value={emailCode}
                            onChange={(e) => {
                                setEmailCode(e.target.value);
                                setEmailVerifyMsg('');
                            }}
                            disabled={!emailSent || emailVerified}
                        />
                        <button className="small-btn" data-label="verify-complete" onClick={handleEmailVerify} disabled={!emailSent || emailVerifying || emailVerified}>인증 완료</button>
                        {/* <p className="verify-complete">인증이 완료되었습니다.</p> */}
                    </div>

                    {/* 이메일 검증 완료 메세지 */}
                    {!!emailVerifyMsg && (
                    <b
                        className="helper-text"
                        style={{ color: emailVerified ? '#1e8e3e' : '#FF8383', paddingLeft: '36px', fontSize: '15px', marginTop: '-15px' }}
                    >
                        {emailVerifyMsg}
                    </b>
                    )}

                    {/* 이용약관 -> 하드코딩 */}
                    <div className="terms">
                        <input type="checkbox" id="agree" checked={agree} onChange={(e)=>setAgree(e.target.checked)} />
                        <label htmlFor="agree"><b>이용약관 동의 및 개인정보 처리방침</b> <b className='star-text'>(필수)</b></label>
                        {/* <a className="details-link" href="#" onClick={openPopup}><b>자세히</b></a> */}
                        <a className="details-link" href="#" onClick={(e)=>{ e.preventDefault(); setPopupOpen(true); }}><b>자세히</b></a>
                    </div>
                    <button className="signup-btn" onClick={openJoinPopup}>가입하기</button>
                </form>
            </div>
        </div>

        {/* 팝업 관련 내용 */}
        {popupOpen && <TermsPopup onClose={() => setPopupOpen(false)} />}

        {/* 아이디 중복 확인 관련 팝업 */}
        { idCheckPopupOpen && <IdCheckPopup onClose={() => setIdCheckPopupOpen(false)} />}

        {/* 회원가입 완료 팝업 */}
        { joinPopupOpen && 
            <JoinPopup 
                onClose={() => setJoinPopupOpen(false)}
                onConfirm={handleSignup}        // 팝업의 확인 버튼에서 실행됨
            />
        }
    </div>
  );
};

export default Signup;