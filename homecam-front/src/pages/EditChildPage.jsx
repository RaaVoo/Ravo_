import React, { useState } from 'react';
import './EditChildPage.css';

const EditChildPage = () => {
  const [form, setForm] = useState({
    name: '',
    gender: '',
    birth: '',
    note: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = () => {
    const formattedBirth = form.birth.replaceAll("-", "");
    const dataToSend = { ...form, birth: formattedBirth };
    console.log('전송할 데이터:', dataToSend);
    // TODO: 백엔드 연동 예정
  };

  return (
    <div className="edit-child-container">
      <div className="edit-child-card">
        <h2 className="edit-child-title">
          우리 아이정보<br />수정하기
        </h2>

        <div className="edit-child-form">
          <label className="edit-child-label">이름</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="홍아이"
            className="edit-child-input"
          />

          <label className="edit-child-label">성별</label>
          <div className="edit-child-gender">
            <label>
              <input
                type="radio"
                name="gender"
                value="남자"
                checked={form.gender === '남자'}
                onChange={handleChange}
              />
              남자
            </label>
            <label>
              <input
                type="radio"
                name="gender"
                value="여자"
                checked={form.gender === '여자'}
                onChange={handleChange}
              />
              여자
            </label>
          </div>

          <label className="edit-child-label">생년월일</label>
          <input
            type="date"
            name="birth"
            value={form.birth}
            onChange={handleChange}
            className="edit-child-input"
          />

          <label className="edit-child-label">특이사항</label>
          <textarea
            name="note"
            value={form.note}
            onChange={handleChange}
            placeholder="손을 물어뜯는 버릇이있어요"
            className="edit-child-textarea"
          />

          <button className="edit-child-button" onClick={handleSubmit}>
            입력완료
          </button>

          <button className="add-child-btn">
  <div className="add-child-circle">＋</div>
  <div className="add-child-text">자녀 추가하기</div>
</button>
        </div>
      </div>
    </div>
  );
};

export default EditChildPage;
