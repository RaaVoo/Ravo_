import os
import re
from collections import Counter
from stt_module import transcribe_audio
from emotion_module import classify_emotion
from chat_module import chat_with_gpt
from tts_module import speak_text
import requests  # 상단 import에 추가
import json


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



# ✅ 영상 보고서 실행 함수
def run_behavior_report(video_path="./recorded_video.mp4"):
    from behavior_report import BehaviorReport
    b_report = BehaviorReport(video_path)
    b_report.analyze()
    print("\n🎥 행동 분석 보고서:")
    print(b_report.generate_report_text())


# ✅ CLI 진입점 추가
def cli():
    import argparse, os
    ap = argparse.ArgumentParser()
    ap.add_argument("--mode", choices=["voice", "video"], required=True)
    ap.add_argument("--video", help="분석할 mp4 경로 (video 모드 필수)")
    args = ap.parse_args()

    if args.mode == "voice":
        run_emotion_report()
    else:
        if not args.video:
            raise SystemExit("--video 경로가 필요합니다. (예: --video ./uploads/xxx.mp4)")
        # 상대경로 보정
        if not os.path.isabs(args.video):
            base = os.path.dirname(os.path.abspath(__file__))
            args.video = os.path.normpath(os.path.join(base, args.video))
        run_behavior_report(args.video)

if __name__ == "__main__":
    # 자동 실행 없음 (프론트/백에서 필요할 때만 cli()로 호출)
    # 예) python ravo_emotion/main.py --mode video --video ./uploads/xxx.mp4
    pass



# # ✅ 실행
# if __name__ == "__main__":
# #    main()
#     # 음성 페이지 → run_emotion_report()
#     run_behavior_report("./ravo_emotion/test.mp4")
#     pass