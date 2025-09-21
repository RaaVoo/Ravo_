// 구글 계정 로그인 관련 라우트
import express from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { saveRefreshToken } from '../repositories/UserRepository.js';

const router = express.Router();

// 구글 로그인 진입 (프로필과 이메일 정보를 받음 + scope는 구글에서 받아올 정보)
router.get('/google', passport.authenticate('google', { 
    scope: ['profile', 'email'], 
    prompt: 'select_account',
    accessType: 'offline'
}));

// 구글 콜백 처리
router.get(
    '/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/auth/login?google=fail' }),            // 원래 login이었음
    async (req, res) => {
        const user = req.user;

        const { code } = req.query;
        console.log(`code: ${code}`);

        // u_name 뽑아내기
        const uName = 
            user?.u_name ??
            user?.user_name ??
            user?.u_email?.split('@')[0] ??
            user?.user_id ?? 'GoogleUser';

        const accessToken = jwt.sign(
            { user_no: user.user_no, user_id: user.user_id, u_name:uName },
            process.env.JWT_SECRETKEY,
            { expiresIn: '1h' }
        );

        const refreshToken = jwt.sign(
            { user_no: user.user_no, user_id: user.user_id },
            process.env.JWT_REFRESH_SECRETKEY,
            { expiresIn: '7d' }
        );

        // refreshToken을 DB에 저장
        await saveRefreshToken(user.user_no, refreshToken);

        res.cookie('accessToken', accessToken, { httpOnly: true, sameSite: 'Lax' });
        res.cookie('refreshToken', refreshToken, { httpOnly: true, sameSite: 'Lax' });

        res.redirect('http://localhost:3000/login/success');

        // const token = jwt.sign({ user_no: user.user_no, user_id: user.user_id }, process.env.JWT_SECRETKEY, {
        //     expiresIn: '1h',
        // });

        // // 프론트로 리다이렉트 하면서 token을 URL에 붙여 전달
        // res.redirect(`http://localhost:3000/login/sucess?token=${token}`);
    }
);

// 로그인 성공 처리 -> 쿠키의 accessToken 검증 후 프론트로 리다이렉트
router.get('/login/success', (req, res) => {
    try {
        const token = req.cookies?.accessToken;
        if (!token) {
            return res.redirect('http://localhost:3000/auth/login?google=fail');
        }

        // 토큰 검증
        jwt.verify(token, process.env.JWT_SECRETKEY);
        // 검증 성공 -> 메인
        return res.redirect('http://localhost:3000/');
    } catch (err) {
        return res.redirect('http://localhost:3000/auth/login?google=fail');
    }
});

export default router;