// 아이정보 수정 페이지
import React, { useState, useEffect } from 'react';
import './ChildInfoModify.css';
import ChildModifyPopup from './Popup/ChildModifyPopup';

const ChildInfoModify = () => {
    const [children, setChildren] = useState([]);
    const [submitting, setSubmitting] = useState(false);        // 제출중
    const [popupOpen, setPopupOpen] = useState(false);          // 수정 완료 팝업창 상태

    // "2025-01-01" 또는 "2024-12-31T15:00:00.000Z" → "20250101" (생년월일 형식 지정 코드)
    const formatToYYYYMMDD = (dateStr) => {
        if (!dateStr) {
            return "";
        }
        const d = new Date(dateStr);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}${month}${day}`;
    };

    // 자녀 정보 조회 (250920 추가)
    useEffect(() => {
        const fetchChildren = async () => {
            try {
                // 자녀 정보 조회 (/mypage/children - GET 요청)
                const res = await fetch('/mypage/children', { credentials: 'include' });
                if (!res.ok) throw new Error('자녀 정보를 불러오지 못했습니다.');
                const data = await res.json();
                setChildren(data.map(c => ({
                    child_id: c.child_id,
                    childName: c.c_name,
                    gender: c.c_gender === 'M' ? '남자' : '여자',
                    birthDate: formatToYYYYMMDD(c.c_birth),
                    note: c.c_content || ''
                })));
            } catch (err) {
                console.error(err);
            }
        };
        fetchChildren();
    }, []);

    const handleChange = (index, field, value) => {
        const updatedChildren = [...children];
        updatedChildren[index][field] = value;
        setChildren(updatedChildren);
    };

    // 자녀 삭제
    const handleRemoveChild = async (child_id) => {
        try {
            // DB에서 삭제 요청
            await fetch(`/mypage/children/${child_id}`, {
                method: 'DELETE',
                credentials: 'include',   // 쿠키 인증 유지
            });

            // 프론트 상태에서도 삭제
            setChildren(children.filter((child) => child.child_id !== child_id));
        } catch (err) {
            console.error("자녀 삭제 실패:", err);
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

            // 1) 부모 식별자 가져오기 (쿠키 인증 기반 엔드포인트)
            const meRes = await fetch('/auth/me', { credentials: 'include' });
            if (!meRes.ok) {
                throw new Error('로그인이 필요합니다.');
            }
            const me = await meRes.json();      // { user_no, user_id, u_name, ... }
            const parent_no = me.user_no;
            if (!parent_no) {
                throw new Error('부모 정보를 찾을 수 없습니다.');
            }

            // 2) 한 명씩 등록
            for (const c of children) {
                const gender = c.gender === '남자' ? 'M' : c.gender === '여자' ? 'F' : c.gender;

                const payload = {
                    child_id: c.child_id,       // 수정 시 필요
                    c_name: c.childName.trim(),
                    c_gender: gender,
                    c_birth: c.birthDate.trim(),
                    c_content: c.note?.trim() || null,
                };

                let res;
                if (c.child_id) {
                    // 이미 있는 아이 → 수정 API
                    res = await fetch('/mypage/children/profile', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify(payload),
                    });
                } 

                const data = await res.json().catch(() => ({}));
                if (!res.ok) {
                    throw new Error(data.error || '자녀 수정 실패');
                }
            }

            setPopupOpen(true);         // 아이정보 수정 완료 팝업창 열기
        } catch (err) {
            alert(err.message || '오류가 발생했습니다.');
        } finally {
            setSubmitting(false);
        }
        console.log('자녀 정보:', children);
    };

    return (
        <div className="child-info-form-container"> 
            <div className="child-info-box">
                <h2 className="child-info-title-sub">우리 아이정보<br/>수정하기</h2>

                <form className="child-info-form" onSubmit={handleSubmit}>
                    {children.map((child, index) => (
                        <div className="child-info-form-section" key={index}>
                            {/* 자녀 뒤 숫자에 대한 코드 */}
                            {index > 0 && (
                                <div className="child-info-number-title">자녀 {index + 1}</div>
                            )}

                            {/* 이름 입력 */}
                            <label className="child-info-form-label">이름<span className='star-text'>*</span></label>
                            <input 
                                className="child-info-form-input" 
                                type="text" 
                                placeholder="아이의 이름을 입력해주세요."
                                value={child.childName} 
                                onChange={(e) => handleChange(index, 'childName', e.target.value)}>               
                            </input>

                            {/* 성별 선택 */}
                            <label className="child-info-form-label">성별<span className='star-text'>*</span></label>
                            <div className="child-info-gender-box">
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
                            <label className="child-info-form-label">생년월일<span className='star-text'>*</span></label>
                            <input
                                className="child-info-form-input"
                                type="text"
                                placeholder="예 : 20250402"
                                value={child.birthDate}
                                onChange={(e) => handleChange(index, 'birthDate', e.target.value)}
                            />

                            {/* 특이사항 입력 */}
                            <label className="child-info-form-label">특이사항</label>
                            <textarea
                                className="child-info-form-textarea"
                                placeholder="아이의 특이사항을 입력해주세요."
                                value={child.note}
                                onChange={(e) => handleChange(index, 'note', e.target.value)}
                            ></textarea>
                        </div>
                    ))}

                    {/* 입력 완료 버튼 */}
                    <button type="submit" className="child-info-submit-btn" disabled={submitting}>수정완료</button>

                    {/* 버튼 그룹 코드 (삭제) */}
                    <div className="child-info-btn-groups">
                        {/* 자녀 삭제 버튼 -> 2명 이상일 때만 보이도록 */} 
                        {children.length > 1 && (
                            <div 
                                className="child-info-remove-child-btn" 
                                onClick={(e) => 
                                    handleRemoveChild(children[children.length - 1].child_id)}>
                                <button className="child-info-minus-icon" type='button'>-</button>
                                <span>자녀 삭제하기</span>
                            </div>
                        )}
                    </div>
                </form>
            </div>

            {/* 아이정보 수정 완료 팝업창 띄우기 */}
            {popupOpen && <ChildModifyPopup />}
        </div>
    );
};

export default ChildInfoModify;