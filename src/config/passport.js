// 구글 계정 연동 로그인 관련 코드 (구글 로그인 전략)
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import dotenv from 'dotenv';
import { findOrCreateUserByGoogleProfile } from '../services/UserService.js';

dotenv.config();

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: '/auth/google/callback',
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const user = await findOrCreateUserByGoogleProfile(profile);        // 사용자를 찾거나 생성
                done(null, user);           // 세션 사용 x
            } catch (err) {
                done(err, null);
            }
        }
    )
);

export default passport;