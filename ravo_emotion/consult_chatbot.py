# consult_chatbot.py
# 목적: 문의상담 전용 챗봇 (사용법/병원 리스트는 '내용 고정', GPT는 '문체 변환'만)
# 사용: from consult_chatbot import consult_reply
#      reply = consult_reply("사용법 알려줘")  # str 반환

import os
from dotenv import load_dotenv
load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# ── SDK 호환: v1 우선, 실패 시 v0 폴백 ─────────────────────────────
_client_type = None
client = None
try:
    # v1 (openai>=1.x)
    from openai import OpenAI
    if not OPENAI_API_KEY:
        raise RuntimeError("OPENAI_API_KEY 환경변수가 없습니다.")
    client = OpenAI(api_key=OPENAI_API_KEY)
    _client_type = "v1"
except Exception:
    try:
        # v0 (openai==0.x)
        import openai as _legacy_openai
        if not OPENAI_API_KEY:
            raise RuntimeError("OPENAI_API_KEY 환경변수가 없습니다.")
        _legacy_openai.api_key = OPENAI_API_KEY
        client = _legacy_openai
        _client_type = "v0"
    except Exception:
        _client_type = None  # 키 없음 or SDK 미설치

# ── 고정 컨텐츠 (여기만 수정하면 됨) ────────────────────────────────
USAGE_FAQ = """
[서비스 사용 방법 안내 - 고정 텍스트]
1) 홈캠/마이크를 연결한 뒤 [녹화 시작]을 누릅니다.
2) 녹화가 끝나면 [리포트 생성]을 눌러 분석을 실행합니다.
3) [음성 리포트], [영상 리포트] 탭에서 결과를 확인합니다.
4) 위험 징후 감지 시 알림으로 안내됩니다.
5) 생성된 리포트는 [마이페이지 > 리포트]에서 다시 볼 수 있습니다.
(이 안내는 모든 답변에서 내용이 동일해야 합니다)
""".strip()

HOSPITALS = [
    {"name": "국립○○아동청소년정신건강센터", "city": "서울", "phone": "02-123-4567", "note": "발달/행동"},
    {"name": "△△아동정신건강의학과의원", "city": "부산", "phone": "051-111-2222", "note": "불안/틱"},
    {"name": "□□소아청소년클리닉",     "city": "대구", "phone": "053-333-4444", "note": "ADHD/학습"},
    # 👉 실제 확정 리스트로 교체
]
CITY_KEYS = ["서울","부산","대구","인천","대전","광주","울산","세종","경기","강원","충북","충남","전북","전남","경북","경남","제주"]

def _detect_intent(text: str) -> str:
    t = (text or "").lower()
    if any(k in t for k in ["사용법","어떻게","방법","가이드","도움말","help","시작","설명"]):
        return "USAGE"
    if any(k in t for k in ["병원","정신","추천","상담","의원","클리닉","진료","치료"]):
        return "HOSPITAL"
    return "OTHER"

def _extract_city(text: str):
    for c in CITY_KEYS:
        if c in (text or ""):
            return c
    return None

def _style_lock_rewrite(content: str, tone_hint: str = "담백하고 예의 있는 상담 톤") -> str:
    """
    GPT는 '문체 변환기'로만 사용 (사실/항목/전화/지명 변경 금지).
    키 없거나 실패하면 원문 그대로 반환.
    """
    if _client_type is None:
        return content

    sys = (
        "너는 문체 변환기다. 아래 <고정콘텐츠>의 사실 정보(항목/숫자/절차/지명/전화 등)는 "
        "절대 변경/추가/삭제하지 말라. 문장 어투만 다듬어라. 새로운 사실을 만들지 말라."
    )
    user = f"[톤 힌트]: {tone_hint}\n\n<고정콘텐츠>\n{content}\n</고정콘텐츠>"

    try:
        if _client_type == "v1":
            resp = client.chat.completions.create(
                model="gpt-4o-mini",
                temperature=0.3,
                messages=[{"role": "system", "content": sys},
                          {"role": "user", "content": user}],
            )
            return resp.choices[0].message.content.strip()
        else:
            resp = client.ChatCompletion.create(
                model="gpt-3.5-turbo",
                temperature=0.3,
                messages=[{"role": "system", "content": sys},
                          {"role": "user", "content": user}],
            )
            return resp.choices[0].message.content.strip()
    except Exception:
        return content

def consult_reply(user_input: str, tone: str = "담백하고 예의 있는 상담 톤") -> str:
    """
    아이대화 챗봇의 chat_with_gpt()와 유사한 형태.
    - 자유 대화 아님. 특정 질문(사용법/병원)만 대응.
    - 반환: 최종 문자열(문체 변환 적용됨)
    """
    intent = _detect_intent(user_input)
    if intent == "USAGE":
        raw = USAGE_FAQ

    elif intent == "HOSPITAL":
        city = _extract_city(user_input)
        lst = [h for h in HOSPITALS if not city or city in h["city"]]
        head = "[국내 아동·청소년 정신건강 의료기관 추천 - 고정 리스트]"
        region = f"(요청 지역: {city})" if city else "(지역을 알려주시면 더 정확히 추려드려요)"
        block = (
            "\n".join(f"{i+1}. {h['name']} ({h['city']}) | {h['phone']} - {h['note']}" for i, h in enumerate(lst))
            if lst else "(현재 제공 가능한 병원 리스트가 없습니다. 다른 지역을 말씀해 주세요.)"
        )
        raw = f"{head}\n{region}\n{block}"

    else:
        raw = "문의 감사합니다. 사용 방법이나 병원 추천 관련 키워드를 포함해 질문해 주세요."

    # 문체만 변환(키 없으면 원문 그대로)
    return _style_lock_rewrite(raw, tone)
