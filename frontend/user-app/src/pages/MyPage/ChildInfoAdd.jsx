// 자녀 정보 추가하기 프론트 코드
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ChildInfoAdd.css';

const ChildInfoAdd = () => {
    const navigate = useNavigate();

    const [children, setChildren] = useState([
        { childName: '', gender: '', birthDate: '', note: '' }
    ]);
    const [submitting, setSubmitting] = useState(false);        // 제출중

    const handleChange = (index, field, value) => {
        const updatedChildren = [...children];
        updatedChildren[index][field] = value;
        setChildren(updatedChildren);
    };

    // 자녀 추가
    const handleAddChild = () => {
        setChildren([
            ...children,
            { childName: '', gender: '', birthDate: '', note: '' }
        ]);
    };

    // 자녀 삭제
    const handleRemoveChild = () => {
        if (children.length > 1) {
            setChildren(children.slice(0, -1));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // 1) 필수 입력 검사
        const missing = children.some(
            (c) => !c.childName?.trim() || !c.gender || !c.birthDate?.trim()
        );
        if (missing) {
            alert("이름, 성별, 생년월일은 필수 입력입니다.");
            return;
        }

        try {
            setSubmitting(true);

            // 2) 부모 식별자 가져오기 (쿠키 인증 기반 엔드포인트)
            const meRes = await fetch('/auth/me', { 
                credentials: 'include',
                headers: (() => {
                    const t = localStorage.getItem('token');
                    return t ? { Authorization: `Bearer ${t}` } : {};
                })(),
            });
            if (!meRes.ok) {
                throw new Error('로그인이 필요합니다.');
            }
            const me = await meRes.json();      // { user_no, user_id, u_name, ... }
            const parent_no = me.user_no;
            if (!parent_no) {
                throw new Error('부모 정보를 찾을 수 없습니다.');
            }

            // 3) 한 명씩 등록
            for (const c of children) {
                // 성별 표준화: 화면은 '남자'/'여자', DB는 'M'/'F' 라면 변환
                const gender = c.gender === '남자' ? 'M' : c.gender === '여자' ? 'F' : c.gender;

                const payload = {
                    parent_no,
                    c_name: c.childName.trim(),
                    c_gender: gender,
                    c_birth: c.birthDate.trim(),            // 예: 20250402
                    c_content: c.note?.trim() || null,
                };

                // 마이페이지에서 '자녀 추가하기'도 회원가입 할 때 자녀 정보 입력받는 로직과 똑같음
                const res = await fetch('/auth/signup/child', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',                 // (인증이 필요 없다면 제거해도 무방)
                    body: JSON.stringify(payload),
                });

                const data = await res.json().catch(() => ({}));
                if (!res.ok) {
                    throw new Error(data.error || '자녀 등록에 실패했습니다.');
                }
            }

            alert('자녀 등록이 완료되었습니다.');
            navigate('/mypage');          // 마이페이지로 이동
        } catch (err) {
            alert(err.message || '오류가 발생했습니다.');
        } finally {
            setSubmitting(false);
        }
        console.log('자녀 정보:', children);
    };

    return (
        <div className="child-add-form-container"> 
            {/* <Header/> */}
            <div className="child-add-box">
                <h2 className="child-add-title-sub">우리 아이정보<br/>추가하기</h2>

                <form className="child-add-form" onSubmit={handleSubmit}>
                    {children.map((child, index) => (
                        <div className="child-add-form-section" key={index}>
                            {/* 자녀 뒤 숫자에 대한 코드 */}
                            {index > 0 && (
                                <div className="child-add-number-title">자녀 {index + 1}</div>
                            )}

                            {/* 이름 입력 */}
                            <label className="add-form-label">이름<span className='star-text'>*</span></label>
                            <input 
                                className="add-form-input" 
                                type="text" 
                                placeholder="아이의 이름을 입력해주세요."
                                value={child.childName} 
                                onChange={(e) => handleChange(index, 'childName', e.target.value)}>               
                            </input>

                            {/* 성별 선택 */}
                            <label className="add-form-label">성별<span className='star-text'>*</span></label>
                            <div className="add-gender-box">
                                <label>
                                    <input 
                                        type="radio" 
                                        name={`gender-${index}`} 
                                        value="남자" 
                                        checked={child.gender === '남자'} 
                                        onChange={(e) => handleChange(index, 'gender', e.target.value)}/>남자
                                </label>
                                <label>
                                    <input 
                                        type="radio" 
                                        name={`gender-${index}`} 
                                        value="여자" 
                                        checked={child.gender === '여자'} 
                                        onChange={(e) => handleChange(index, 'gender', e.target.value)}/>여자
                                </label>
                            </div>

                            {/* 생년월일 입력 */}
                            <label className="add-form-label">생년월일<span className='star-text'>*</span></label>
                            <input
                                className="add-form-input"
                                type="text"
                                placeholder="예 : 20250402"
                                value={child.birthDate}
                                onChange={(e) => handleChange(index, 'birthDate', e.target.value)}
                            />

                            {/* 특이사항 입력 */}
                            <label className="add-form-label">특이사항</label>
                            <textarea
                                className="add-form-textarea"
                                placeholder="아이의 특이사항을 입력해주세요."
                                value={child.note}
                                onChange={(e) => handleChange(index, 'note', e.target.value)}
                            ></textarea>
                        </div>
                    ))}

                    {/* 입력 완료 버튼 */}
                    <button type="submit" className="add-submit-btn" disabled={submitting}>입력 완료</button>

                    {/* 버튼 그룹 코드 (추가, 삭제) */}
                    <div className="add-btn-groups">
                        <div className="child-add-child-btn" onClick={handleAddChild}>
                            <button className="add-plus-icon">+</button>
                            <span>자녀 추가하기</span>
                        </div>

                        {/* 자녀 삭제 버튼 -> 2명 이상일 때만 보이도록 */}
                        {children.length > 1 && (
                            <div className="child-remove-child-btn" onClick={handleRemoveChild}>
                                <button className="add-minus-icon">-</button>
                                <span>자녀 삭제하기</span>
                            </div>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChildInfoAdd;