# main.py
# --------------------------------------------
# 하루(여러 음성 파일)의 대화를 분석해
# 1) 감정 요약(5대), 2) 키워드, 3) 총평/솔루션을 생성하고
# 4) 백엔드 /voice/reports 로 저장 (하루치 = 1건)
# --------------------------------------------

import os
import re
import json
import requests
from collections import Counter
from datetime import datetime
from dotenv import load_dotenv

# 내부 모듈
from stt_module import transcribe_audio
from emotion_module import classify_emotion
from chat_module import chat_with_gpt
from tts_module import speak_text

# ====== 환경 설정 ======
load_dotenv()
BACKEND = os.getenv("BACKEND_BASE_URL", "http://localhost:8080")
USER_NO_DEFAULT = int(os.getenv("USER_NO", "1"))
ENABLE_TTS = os.getenv("ENABLE_TTS", "1") == "1"               # 음성합성 켜고/끄기
EXPECTED_FILE_COUNT = int(os.getenv("EXPECTED_FILE_COUNT", "8"))  # 기대 음성 개수(선택)
CHILD_NAME = os.getenv("CHILD_NAME", "아이")                    # 솔루션 프롬프트에서 호칭에 사용

# ====== 감정 매핑 룰 ======
MAP_TO_FIVE = {
    "기대감": "기쁨",
    "안타까움": "슬픔", "실망": "슬픔", "안타까움/실망": "슬픔",
    "불안/걱정": "불안",
    "당황": "불안", "난처": "불안", "당황/난처": "불안",
    "신기함": "기쁨", "관심": "기쁨", "신기함/관심": "기쁨",  # 또는 중립
    "힘듦": "우울", "지침": "우울", "힘듦/지침": "우울",
}

def to_five_emotions(raw_emotions):
    """
    raw_emotions: ['짜증','행복',...] → {'기쁨':55.0, '분노':15.0, ...}
    """
    cnt = Counter()
    for emo in raw_emotions:
        e = str(emo)
        five = MAP_TO_FIVE.get(e)
        if five is None:
            # 간단 규칙: 키워드 포함 매핑(필요 시 보강)
            if "행복" in e or "희망" in e:
                five = "기쁨"
            elif "짜증" in e or "분노" in e or "화" in e:
                five = "분노"
            elif "슬픔" in e or "울" in e:
                five = "슬픔"
            elif "불안" in e or "걱정" in e or "두려" in e:
                five = "불안"
            else:
                five = "우울"
        cnt[five] += 1

    total = sum(cnt.values()) or 1
    return {k: round(v / total * 100, 1) for k, v in cnt.items()}

# ====== 파일 정렬 헬퍼 (10.wav가 2.wav 뒤로 가게 자연 정렬) ======
def natural_key(name: str):
    return [int(t) if t.isdigit() else t for t in re.split(r'(\d+)', name)]

# ====== 백엔드 연동 ======
def save_report_to_backend_from_final(user_no: int, title: str, date: str, final: dict) -> bool:
    """
    build_final_report_object()의 결과(final)를
    백엔드 스키마에 맞춰 /voice/reports 로 저장
    """
    emotion_str = ", ".join([f"{k}:{v}" for k, v in final["emotion_summary_five"].items()])
    keyword_str = ", ".join(final["keyword_summary"])

    payload = {
        "user_no": user_no,
        "r_title": title,
        "r_content": final["r_content"],
        "r_date": date,                         # 'YYYY-MM-DD'
        "emotion_summary": emotion_str,         # "기쁨:55, 분노:15, ..."
        "keyword_summary": keyword_str,         # "친구, 유치원, ..."
        "action_summary": None,                 # 필요 시 확장
        "r_overall_review": final["r_overall_review"],
        "r_solution": final["r_solution"],
    }

    print("📤 보고서 저장 payload:", json.dumps(payload, ensure_ascii=False))
    try:
        r = requests.post(f"{BACKEND}/voice/reports", json=payload, timeout=15)
        if r.status_code in (200, 201):
            print("✅ 보고서 저장 성공:", r.json())
            return True
        print("❌ 보고서 저장 실패:", r.status_code, r.text)
    except Exception as e:
        print("❌ 보고서 저장 중 예외:", repr(e))
    return False

# ====== (선택) 메시지 저장: 현재 흐름에선 미사용이지만 보관 ======
def save_message_to_api(text, emotion, mode="VOICE", user_no=1, chat_no=1):
    payload = {
        "content": text,
        "mode": mode,
        "summary": emotion,
        "userNo": user_no,
        "chatNo": chat_no
    }
    print("📤 전송 payload:", json.dumps(payload, ensure_ascii=False))
    try:
        r = requests.post(f"{BACKEND}/messages/send", json=payload, timeout=10)
        if r.status_code in (200, 201):
            print("✅ 메시지 저장 성공!")
        else:
            print(f"❌ 메시지 저장 실패: {r.status_code}, {r.text}")
    except Exception as e:
        print("❌ 메시지 저장 중 예외:", repr(e))

# ====== 보고서 객체/도우미 ======
class EmotionReport:
    """
    하루치(여러 음성) 대화를 누적해 감정/키워드/총평을 계산하는 클래스
    """
    def __init__(self):
        self.emotion_log = []   # 모델이 반환한 원시 감정 라벨 목록
        self.text_log = []      # 인식된 텍스트 누적
        self.turns = []         # (filename, text, emotion) 누적

    def add_turn(self, text: str, *, filename: str = None):
        text = (text or "").strip()
        if not text:
            return None  # 빈 텍스트 스킵
        self.text_log.append(text)
        emotion = classify_emotion(text)
        self.emotion_log.append(emotion)
        self.turns.append((filename or "?", text, emotion))
        return emotion

    def get_emotion_summary(self):
        """원시 감정 라벨 분포(%) — 참고용"""
        total = len(self.emotion_log) or 1
        counts = Counter(self.emotion_log)
        return {emo: round((cnt / total) * 100, 1) for emo, cnt in counts.items()}

    def get_emotion_summary_five(self):
        """5대 감정(기쁨/분노/슬픔/불안/우울) 분포(%) — 프론트 차트용"""
        return to_five_emotions(self.emotion_log)

    def get_top_keywords(self, top_n=12):
        """
        간단 키워드 빈도 상위 top_n (불용어/한글·영문 2자 이상)
        """
        all_text = " ".join(self.text_log).lower()
        words = re.findall(r'[가-힣a-zA-Z]{2,}', all_text)
        stopwords = {"그리고", "그래서", "하지만", "그냥", "나는", "너는", "이건", "저건", "뭐지", "이게", "저게", "것"}
        filtered = [w for w in words if w not in stopwords]
        return [word for word, _ in Counter(filtered).most_common(top_n)]

    def generate_parenting_tip(self):
        """
        LLM을 통해 총평/권고 문구 생성 (한 문단 서술형)
        """
        emotion_summary = self.get_emotion_summary_five()
        top_keywords = self.get_top_keywords(8)
        prompt = (
            "아동 심리·부모 교육 전문가 관점에서 아래 분석을 요약하고, "
            "부모가 실천할 3~5줄 팁을 제안해줘.\n"
            f"감정 요약(5대): {json.dumps(emotion_summary, ensure_ascii=False)}\n"
            f"키워드: {', '.join(top_keywords)}\n"
            "지나치게 단정하거나 병리적 진단은 피하고, 구체적 행동을 제시해줘."
        )
        return (chat_with_gpt(prompt, emotion="neutral") or "").strip()

    def generate_parenting_solution(self, child_name: str = "아이"):
        """
        LLM을 통해 '부모 코칭' 솔루션을 생성.
        프론트 파서(solutionTextToTips)가 처리하기 쉽도록
        '부모 코칭: 항목1 → 항목2 → 항목3(→ 항목4)' 또는 줄바꿈 리스트를 유도.
        """
        emotion_summary = self.get_emotion_summary_five()
        top_keywords = self.get_top_keywords(8)
        prompt = (
            "아래 데이터를 바탕으로 부모가 오늘 바로 실천할 3~5단계 코칭을 간결하게 제시하세요.\n"
            "- 형식(둘 중 하나만):\n"
            "  1) '부모 코칭: 항목1 → 항목2 → 항목3(→ 항목4)'\n"
            "  2) 항목1\\n항목2\\n항목3(\\n항목4)\n"
            "- 각 항목은 명령형, 구체적 행동 중심, 과도한 단정·진단 금지, 마침표 생략.\n"
            f"- 감정 요약(5대): {json.dumps(emotion_summary, ensure_ascii=False)}\n"
            f"- 주요 키워드: {', '.join(top_keywords)}\n"
            f"- 아동 호칭: {child_name}\n"
        )
        try:
            text = (chat_with_gpt(prompt, emotion="neutral") or "").strip()
            if not text:
                raise ValueError("empty solution from LLM")

            # 형식 보정: '→' 구분자로 통일하고, 접두어 붙이기
            if "부모 코칭" not in text:
                lines = [s.strip("-•▶︎ ").strip() for s in text.splitlines() if s.strip()]
                if len(lines) >= 2:
                    text = "부모 코칭: " + " → ".join(lines)
                else:
                    text = "부모 코칭: " + re.sub(r"\s*[-=>~]+\s*", " → ", text)
            else:
                head, tail = text.split(":", 1)
                text = "부모 코칭:" + re.sub(r"\s*[-=>~]+\s*", " → ", tail)
                text = text.replace("부모 코칭:", "부모 코칭: ").strip()

            # 공백 정리 + 최대 길이 제한(안전)
            text = re.sub(r"\s+", " ", text)
            return text[:180]
        except Exception:
            return "부모 코칭: 아이 감정 반영(공감) → 구체적 계획 → 칭찬 피드백 반복"

    def merged_content(self) -> str:
        """
        파일별 구간 헤더 + 텍스트 + 감정을 한 문서로 합치기
        """
        lines = []
        for fname, txt, emo in self.turns:
            lines.append(f"### {fname} | 감정: {emo}\n{txt}\n")
        return "\n".join(lines).strip()

def build_final_report_object(report: "EmotionReport") -> dict:
    """
    콘솔 출력 대신 프론트/백엔드가 쓰기 쉬운 구조로 정리
    """
    return {
        "emotion_summary_five": report.get_emotion_summary_five(),   # dict {"기쁨":55.0,...}
        "emotion_summary_all":  report.get_emotion_summary(),        # dict (참고용)
        "keyword_summary":      report.get_top_keywords(12),         # list[str]
        "r_overall_review":     report.generate_parenting_tip(),     # str (서술형 총평)
        "r_solution":           report.generate_parenting_solution(CHILD_NAME),  # str (코칭 플로우)
        "r_content":            report.merged_content(),             # str (파일별 원문 합본)
    }

# ====== 메인 플로우 ======
def main():
    report = EmotionReport()

    # 오디오 폴더
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    audio_dir = os.path.join(BASE_DIR, "audio_inputs")
    if not os.path.exists(audio_dir):
        print(f"❌ 디렉토리 {audio_dir} 가 존재하지 않습니다.")
        return

    # 자연 정렬 (1.wav, 2.wav, ... 10.wav)
    audio_files = sorted(
        [f for f in os.listdir(audio_dir) if f.lower().endswith(".wav")],
        key=natural_key
    )

    # 예상 개수 체크(선택)
    if EXPECTED_FILE_COUNT > 0 and len(audio_files) != EXPECTED_FILE_COUNT:
        print(f"⚠️ 예상 파일 수({EXPECTED_FILE_COUNT})와 다릅니다. 실제: {len(audio_files)}개")

    if not audio_files:
        print("❌ 처리할 음성 파일이 없습니다.")
        return

    # 각 음성 처리(텍스트화 → 감정 → 응답/tts → 누적)
    for filename in audio_files:
        audio_path = os.path.join(audio_dir, filename)
        print(f"\n🎤 파일 [{filename}] 음성 인식 중...")

        try:
            # 1) STT
            user_text = transcribe_audio(audio_path)
            print("👶 인식된 텍스트:", user_text)

            # 2) 감정 분석(누적)
            emotion = report.add_turn(user_text, filename=filename)
            print(f"🧠 감정 분석 결과: {emotion}")

            # 3) GPT 응답 (TTS는 옵션) — 실제 아이와의 대화 피드백용
            reply = chat_with_gpt(user_text, emotion)
            print(f"🤖 GPT 응답: {reply}")

            if ENABLE_TTS:
                speak_text(reply)

        except Exception as e:
            # 파일 하나 실패해도 전체 흐름은 계속
            print(f"⚠️  [{filename}] 처리 중 예외 발생:", repr(e))
            continue

    # === 모든 파일 처리 끝난 후: 하루 보고서 생성/저장 ===
    final = build_final_report_object(report)

    # (선택) 콘솔 요약 — 하루치 누적이 맞는지 한눈에 확인
    print("\n--- 하루 보고서 콘솔 요약 ---")
    print("파일 수:", len(audio_files))
    print("전체 감정 요약(5대):", ", ".join([f"{k}:{v}" for k, v in final["emotion_summary_five"].items()]))
    print("주요 키워드:", ", ".join(final["keyword_summary"]))
    print("총평(앞 160자):", (final["r_overall_review"] or "")[:160])
    print("원문 길이:", len(final["r_content"] or ""))

    # 백엔드 저장
    today = datetime.now().strftime("%Y-%m-%d")
    title = f"{today} 음성 보고서"
    ok = save_report_to_backend_from_final(
        user_no=USER_NO_DEFAULT,
        title=title,
        date=today,
        final=final
    )
    print("✅ 보고서가 백엔드에 저장되었습니다!" if ok else "❌ 보고서 저장에 실패했습니다.")

# ====== 진입점 ======
if __name__ == "__main__":
    main()
