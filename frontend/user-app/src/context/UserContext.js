// 이 코드 안에서 사용자(User)의 상태 관리
import React, { createContext, useState, useContext } from "react";

// Context 생성 
const UserContext = createContext();

// Provider -> user의 상태 관리(사용자 이름)
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState({
    userName: localStorage.getItem("userName") || "",
    // 필요하다면 userId, email 같은 것도 넣을 수 있음
  });

  // userName이 바뀔 때 localStorage도 업데이트
  const updateUserName = (newName) => {
    setUser((prev) => ({ ...prev, userName: newName }));
    localStorage.setItem("userName", newName);
  };

  return (
    // user: 현재 사용자 상태, setUser: 사용자 상태를 직접 교체할 때 사용, updateUserName: 이름만 바꾸고 싶을 때 사용
    <UserContext.Provider value={{ user, setUser, updateUserName }}>
      {children}
    </UserContext.Provider>
  );
};

// Context를 쉽게 쓰기 위한 hook
export const useUser = () => useContext(UserContext);