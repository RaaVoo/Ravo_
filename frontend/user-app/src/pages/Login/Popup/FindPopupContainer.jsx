/* 
FindIdSuccess 페이지에서 아이디 찾기 성공 후 '비밀번호 찾기'를 눌렀을 때
바로 이동할 수 없어서 부모 컴포넌트를 만들어줌
*/
import React, { useState } from "react";
import FindPwPage from "../FindPwPage";
import FindIdSuccess from "./FindIdSuccess";

const FindPopupContainer = () => {
    const [showFindIdSuccess, setShowFindIdSuccess] = useState(false);
    const [showFindPwPage, setShowFindPwPage] = useState(false);

    const closeAllPopups = () => {
        setShowFindIdSuccess(false);
        setShowFindPwPage(false);
    };

    return (
        <>
            {showFindIdSuccess && (
                <FindIdSuccess onClose={closeAllPopups} 
                    onOpenPwPage={() => {
                        closeAllPopups();
                        // setShowFindIdSuccess(false);
                        setShowFindPwPage(true);
                    }}
                />
            )}

            {showFindPwPage && (
                <FindPwPage onClose={() => setShowFindPwPage(false)} />
            )}
        </>
    );
};

export default FindPopupContainer;