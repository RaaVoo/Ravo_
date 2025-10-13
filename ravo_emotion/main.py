import os
import re
from collections import Counter
from stt_module import transcribe_audio
from emotion_module import classify_emotion
from chat_module import chat_with_gpt
from tts_module import speak_text
from consult_chatbot import consult_reply
import requests  # 상단 import에 추가
import json
import time


# 영상 전용 서버 설정
VIDEO_SERVER_BASE = "http://localhost:3000"   # 백엔드 주소/포트
VIDEO_API_PREFIX  = "/api"                    # 백엔드가 /api 프리픽스 쓰면 유지, 아니면 "" 로

def video_api(path: str) -> str:
    """영상 전용 API 풀 URL 생성"""
    return f"{VIDEO_SERVER_BASE}{VIDEO_API_PREFIX}{path}"


#아이대화 백연결
def save_message_to_api(text, emotion, mode="VOICE", user_no=1, chat_no=1):
    payload = {
        "content": text,
        "mode": mode,
        "summary": emotion,
        "userNo": user_no,
        "chatNo": chat_no
    }
    headers = {"Content-Type": "application/json"}

    print("📤 전송 payload:", json.dumps(payload, ensure_ascii=False))

    
    response = requests.post(
        "http://localhost:3000/messages/send",
        json=payload,
        headers=headers
    )
    
    if response.status_code in [200, 201]:
        print("✅ 메시지 저장 성공!")
    else:
        print(f"❌ 메시지 저장 실패: {response.status_code}, {response.text}")


#상담챗봇 백연결
def save_consult_message_to_api(text, mode="CONSULT", user_no=1, summary=None, server="http://localhost:3000"):
    payload = {"content": text, "mode": mode, "userNo": user_no, "summary": summary}
    headers = {"Content-Type": "application/json"}

    print("📤 상담 payload:", json.dumps(payload, ensure_ascii=False))

    try:
        r = requests.post(f"{server}/chatbot/send", json=payload, headers=headers, timeout=10)
        print("🔎 status:", r.status_code, "body:", r.text)  # ← 추가!
        if r.status_code in (200, 201):
            print("✅ 상담 메시지 저장 성공!")
        else:
            print(f"❌ 상담 메시지 저장 실패: {r.status_code}, {r.text}")
    except Exception as e:
        print("⚠️ 네트워크 예외:", e)



#상담 챗봇 클래스
def run_consult_chat(tone="담백하고 예의 있는 상담 톤", save=True, user_no=1):
    """
    문의 상담 챗봇: 특정 질문(사용법/병원)만 대응.
    - tone: 답변 말투 힌트
    - save: True면 /messages/send 로 로그 저장(옵션)
    """
    print("🔸 문의상담 챗봇 (종료: exit/quit/q)")
    print(f"🔹 tone = {tone} | save_to_db = {save}")

    while True:
        try:
            user_text = input("\n👤 You: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\n👋 bye"); break

        if user_text.lower() in {"exit", "quit", "q"}:
            print("👋 bye"); break
        if not user_text:
            continue

        # 답변 생성 (내용은 고정, 문체만 변환)
        reply = consult_reply(user_text, tone=tone)

        print(f"🤖 Bot: {reply}")

        # 원하면 메시지 로그 저장(선택)
        if save:
            try:
                save_consult_message_to_api(user_text, mode="CONSULT", user_no=user_no)

                time.sleep(1)

                save_consult_message_to_api(reply, mode="BOT", user_no=2)
            except Exception as e:
                print("⚠️ 저장 실패:", e)


# ✅ 감정 리포트 클래스
class EmotionReport:
    def __init__(self):
        self.emotion_log = []
        self.text_log = []

    def add_turn(self, text):
        self.text_log.append(text)
        emotion = classify_emotion(text)
        self.emotion_log.append(emotion)
        return emotion

    def get_emotion_summary(self):
        total = len(self.emotion_log)
        counts = Counter(self.emotion_log)
        return {
            emotion: round((count / total) * 100, 1)
            for emotion, count in counts.items()
        }

    def get_top_keywords(self, top_n=5):
        all_text = ' '.join(self.text_log).lower()
        words = re.findall(r'\b[가-힣a-zA-Z]+\b', all_text)
        stopwords = set(['그리고', '그래서', '하지만', '그냥', '나는', '너는', '이건', '저건', '뭐지', '이게', '저게', '것'])
        filtered = [w for w in words if w not in stopwords]
        return [word for word, _ in Counter(filtered).most_common(top_n)]

    def generate_parenting_tip(self):
        emotion_summary = self.get_emotion_summary()
        top_keywords = self.get_top_keywords()

        prompt = f"""
        당신은 아동 심리 전문가이자 부모 교육 전문가입니다.
        다음은 아이와의 대화에서 분석된 감정 요약과 주요 키워드입니다.

        감정 요약: {emotion_summary}
        주요 키워드: {', '.join(top_keywords)}

        위 내용을 바탕으로 아이의 감정 상태를 이해하고,
        부모가 어떤 방식으로 접근하면 좋을지 한국어로 따뜻하고 실용적인 육아 팁을 3~5줄로 알려주세요.
        """
        return chat_with_gpt(prompt, emotion="neutral")
    
    
# ✅ 음성 보고서 실행 함수
def run_emotion_report():
    report = EmotionReport()
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    audio_dir = os.path.join(BASE_DIR, "audio_inputs")

    if not os.path.exists(audio_dir):
        print(f"❌ 디렉토리 {audio_dir} 가 존재하지 않습니다.")
        return

    audio_files = sorted([f for f in os.listdir(audio_dir) if f.endswith(".wav")],
                         key=lambda x: int(os.path.splitext(x)[0]))

    for filename in audio_files:
        audio_path = os.path.join(audio_dir, filename)
        print(f"\n🎤 파일 [{filename}] 음성 인식 중...")
        user_text = transcribe_audio(audio_path)
        print("👶 인식된 텍스트:", user_text)
        emotion = report.add_turn(user_text)
        print(f"🧠 감정 분석 결과: {emotion}")
        reply = chat_with_gpt(user_text, emotion)
        print(f"🤖 GPT 응답: {reply}")
        speak_text(reply)
        save_message_to_api(user_text, emotion, user_no=1)
        save_message_to_api(reply, "neutral", user_no=2)

    print("\n📊 전체 감정 요약:")
    for emo, perc in report.get_emotion_summary().items():
        print(f"- {emo}: {perc}%")
    print("\n🔑 주요 키워드:")
    for i, kw in enumerate(report.get_top_keywords(), 1):
        print(f"{i}. {kw}")
    print("\n👨‍👩‍👧 육아 솔루션 제안:")
    print(report.generate_parenting_tip())

    report = EmotionReport()

    # 📌 audio_inputs 폴더 경로를 main.py 기준으로 절대 경로로 설정
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    audio_dir = os.path.join(BASE_DIR, "audio_inputs")

    if not os.path.exists(audio_dir):
        print(f"❌ 디렉토리 {audio_dir} 가 존재하지 않습니다.")
        return

    # 숫자 순으로 .wav 파일 정렬
    audio_files = sorted(
        [f for f in os.listdir(audio_dir) if f.endswith(".wav")],
        key=lambda x: int(os.path.splitext(x)[0])
    )

    for filename in audio_files:
        audio_path = os.path.join(audio_dir, filename)
        print(f"\n🎤 파일 [{filename}] 음성 인식 중...")

        # 1. 음성 인식
        user_text = transcribe_audio(audio_path)
        print("👶 인식된 텍스트:", user_text)

        # 2. 감정 분석
        emotion = report.add_turn(user_text)
        print(f"🧠 감정 분석 결과: {emotion}")

        # 3. GPT 응답
        reply = chat_with_gpt(user_text, emotion)
        print(f"🤖 GPT 응답: {reply}")

        # 4. TTS 응답 출력
        speak_text(reply)

        # ✅ 메시지 저장
        save_message_to_api(user_text, emotion, user_no=1)  # 사용자의 메시지
        save_message_to_api(reply, "neutral", user_no=2)   # GPT의 응답 (중립 감정으로 저장)

    # ✅ 전체 통계 및 육아 솔루션
    print("\n📊 전체 감정 요약:")
    for emo, perc in report.get_emotion_summary().items():
        print(f"- {emo}: {perc}%")

    print("\n🔑 주요 키워드:")
    for i, kw in enumerate(report.get_top_keywords(), 1):
        print(f"{i}. {kw}")

    print("\n👨‍👩‍👧 육아 솔루션 제안:")
    print(report.generate_parenting_tip())


#영상 끌어오기
def fetch_next_video_meta():
    """분석 대기 영상 하나의 메타데이터 요청: GET /api/videos/next
       기대 응답: { success: true, data: { id, signed_url(or url), mime, ... } }"""
    try:
        r = requests.get(video_api("/videos/next"), timeout=10)
        r.raise_for_status()
        j = r.json()
        if j.get("success") and j.get("data"):
            return j["data"]
        print("❌ 대기 영상 없음 또는 실패:", r.status_code, r.text)
    except Exception as e:
        print("⚠️ 영상 메타 요청 예외:", e)
    return None

def download_video(file_url: str, save_path: str):
    """서명 URL 또는 공개 URL로 동영상 다운로드"""
    with requests.get(file_url, stream=True, timeout=60) as resp:
        resp.raise_for_status()
        with open(save_path, "wb") as f:
            for chunk in resp.iter_content(1024 * 1024):
                if chunk:
                    f.write(chunk)
    return save_path


# ✅ 영상 보고서 실행 함수
def run_behavior_report(video_path="./recorded_video.mp4"):
    from behavior_report import BehaviorReport

    # (1) 경로 직접 안 주었거나 파일이 없으면 → 백엔드에서 대기 영상 하나 받아서 다운로드
    if not video_path or not os.path.exists(video_path):
        meta = fetch_next_video_meta()
        if not meta:
            print("⏳ 대기 중인 영상이 없습니다.")
            return
        file_url = meta.get("signed_url") or meta.get("url")
        vid_id   = meta.get("id", "next")
        tmp_name = f"video_{vid_id}.mp4"
        tmp_path = os.path.join(os.getcwd(), tmp_name)
        print(f"⬇️ 다운로드: {file_url} -> {tmp_path}")
        video_path = download_video(file_url, tmp_path)

    # (2) 분석 실행
    b_report = BehaviorReport(video_path)
    b_report.analyze()
    print("\n🎥 행동 분석 보고서:")
    print(b_report.generate_report_text())

    # (선택) 분석 결과를 백엔드로 저장하고 싶으면 여기서 POST 호출 추가 가능
    # requests.post(video_api("/reports"), json={ ... })

#def run_behavior_report(video_path="./recorded_video.mp4"):
#    from behavior_report import BehaviorReport
#    b_report = BehaviorReport(video_path)
#    b_report.analyze()
#    print("\n🎥 행동 분석 보고서:")
#    print(b_report.generate_report_text())


# ✅ CLI 진입점 추가
def cli():
    import argparse, os
    ap = argparse.ArgumentParser()
    ap.add_argument("--mode", choices=["voice", "video", "consult"], required=True)
    ap.add_argument("--video", help="분석할 mp4 경로 (video 모드 필수)")
    # 상담 챗봇용 옵션
    ap.add_argument("--tone", default="담백하고 예의 있는 상담 톤",
                    help="문의 챗봇 답변 톤 힌트 (예: '친근하고 간결', '공식적이고 간결')")
    ap.add_argument("--no-save", action="store_true",
                    help="문의 챗봇 대화를 /messages/send 로 저장(옵션)")
    ap.add_argument("--user-no", type=int, default=1,
                    help="(save 사용 시) 사용자 user_no")
    args = ap.parse_args()

    if args.mode == "voice":
        run_emotion_report()

    elif args.mode == "video":
        if not args.video:
            raise SystemExit("--video 경로가 필요합니다. (예: --video ./uploads/xxx.mp4)")
        if not os.path.isabs(args.video):
            base = os.path.dirname(os.path.abspath(__file__))
            args.video = os.path.normpath(os.path.join(base, args.video))
        run_behavior_report(args.video)

    else:  # consult
        run_consult_chat(tone=args.tone, save=not args.no_save, user_no=args.user_no)


if __name__ == "__main__":
    cli()


# # ✅ 실행
# if __name__ == "__main__":
# #    main()
#     # 음성 페이지 → run_emotion_report()
#     run_behavior_report("./ravo_emotion/test.mp4")
#     pass