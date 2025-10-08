// 이 코드 안에서 사용자(User)의 상태 관리
import React, { createContext, useState, useContext } from "react";

// Context 생성 
const UserContext = createContext();

// Provider -> user의 상태 관리(사용자 이름)
export const UserProvider = ({ children }) => {
  // 잠깐 1 주석
  // const [user, setUser] = useState({
  //   userName: localStorage.getItem("userName") || "",
  //   userNo: localStorage.getItem("userNo") || "",     // 잠깐 추가 (251006)
  //   // 필요하다면 userId, email 같은 것도 넣을 수 있음
  // });

  // 잠깐 추가
  const initUserNoRaw = localStorage.getItem('userNo');
  const initUserNo = initUserNoRaw && initUserNoRaw !== 'undefined' ? initUserNoRaw : '';
  if (initUserNoRaw === 'undefined') localStorage.removeItem('userNo'); // 쓰레기값 정리

  const [user, setUser] = useState({
    userName: localStorage.getItem('userName') || '',
    userNo: initUserNo,   // 문자열로 보관(숫자 변환은 실제 사용하는 쪽에서)
  });
  // 여기까지

  // userName이 바뀔 때 localStorage도 업데이트
  const updateUserName = (newName) => {
    setUser((prev) => ({ ...prev, userName: newName }));
    localStorage.setItem("userName", newName);
  };

  // user_no 업데이트 함수 추가 잠깐 추가 (251006) -> 1주석
  // const updateUserNo = (newNo) => {
  //   setUser((prev) => ({ ...prev, userNo: newNo }));
  //   localStorage.setItem("userNo", newNo);
  // };

  // 잠깐 추가
  const updateUserNo = (newNo) => {
    // null/undefined 들어오면 제거
    if (newNo == null || newNo === 'undefined') {
      localStorage.removeItem('userNo');
      setUser((prev) => ({ ...prev, userNo: '' }));
      return;
    }
    setUser((prev) => ({ ...prev, userNo: String(newNo) }));
    localStorage.setItem("userNo", String(newNo));
  };    // 여기까지

  return (
    // user: 현재 사용자 상태, setUser: 사용자 상태를 직접 교체할 때 사용, updateUserName: 이름만 바꾸고 싶을 때 사용
    <UserContext.Provider value={{ user, setUser, updateUserName, updateUserNo }}>
      {children}
    </UserContext.Provider>
  );
};

// Context를 쉽게 쓰기 위한 hook
export const useUser = () => useContext(UserContext);