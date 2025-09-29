# chat_module.py
import os
from dotenv import load_dotenv

load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# ── SDK 버전 호환: 신버전(openai>=1.x) 우선, 실패 시 구버전(0.x) 폴백 ──
_client_type = None
client = None

try:
    # 신버전 (openai>=1.x)
    from openai import OpenAI
    if not OPENAI_API_KEY:
        raise RuntimeError("OPENAI_API_KEY 환경변수가 없습니다.")
    client = OpenAI(api_key=OPENAI_API_KEY)
    _client_type = "v1"  # chat.completions.create 사용
except Exception:
    try:
        # 구버전 (openai==0.x)
        import openai as _legacy_openai
        if not OPENAI_API_KEY:
            raise RuntimeError("OPENAI_API_KEY 환경변수가 없습니다.")
        _legacy_openai.api_key = OPENAI_API_KEY
        client = _legacy_openai
        _client_type = "v0"  # ChatCompletion.create 사용
    except Exception:
        _client_type = None  # 키 없음 or SDK 미설치 등


def chat_with_gpt(user_input: str, emotion: str = "neutral", model: str | None = None) -> str:
    """
    user_input: 사용자 프롬프트 텍스트
    emotion: 감정 태그(예: 'neutral', 'joy', ...)
    model: 기본 미지정 시 신버전은 'gpt-4o-mini', 구버전은 'gpt-3.5-turbo'
    """
    prompt = f"(감정: {emotion}) {user_input}"

    # 환경/설정 문제 시 안전 폴백
    if _client_type is None:
        return "(참고: OPENAI_API_KEY 또는 OpenAI SDK 설정이 없어 GPT 응답을 생략합니다.)"

    try:
        if _client_type == "v1":
            # 신버전 SDK
            use_model = model or "gpt-4o-mini"
            resp = client.chat.completions.create(
                model=use_model,
                messages=[
                    {"role": "system", "content": "넌 감정을 고려해서 아이에게 따뜻하게 응답하는 챗봇이야."},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.7,
            )
            return resp.choices[0].message.content.strip()

        else:
            # 구버전 SDK
            use_model = model or "gpt-3.5-turbo"
            resp = client.ChatCompletion.create(
                model=use_model,
                messages=[
                    {"role": "system", "content": "넌 감정을 고려해서 아이에게 따뜻하게 응답하는 챗봇이야."},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.7,
            )
            return resp.choices[0].message.content.strip()

    except Exception as e:
        # 호출 실패 시에도 파이프라인이 끊기지 않도록 폴백
        return f"(GPT 응답 생성 실패: {e})"
