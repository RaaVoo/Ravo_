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
from datetime import datetime, timezone, timedelta
import threading
POLL_INTERVAL = 0.6 

#음성 대화 모드 변경
API_BASE = "http://localhost:3000"  # 백엔드 주소

def get_manual_mode(key="global") -> bool:
    """백엔드에서 현재 수동모드 여부 조회 (프론트 버튼으로 토글한 값)"""
    try:
        r = requests.get(f"{API_BASE}/chatbot/mode", params={"key": key}, timeout=3)
        return bool(r.json().get("manual"))
    except Exception:
        return False  # 실패 시 자동모드로 간주(원하면 True로 바꿔도 됨)


def parse_dt(s: str) -> datetime:
    s = (s or "").replace("Z", "+00:00")
    try:
        return datetime.fromisoformat(s)
    except Exception:
        try:
            return datetime.strptime(s, "%Y-%m-%d %H:%M:%S").replace(tzinfo=timezone.utc)
        except Exception:
            return datetime.now(timezone.utc)


def wait_for_parent_reply(since, last_child_text):
    while True:
        row = fetch_parent_reply_since(since, last_child_text)
        if row:
            return row
        time.sleep(POLL_INTERVAL)


def fetch_parent_reply_since(since, last_child_text):
    """기준 시각 이후의 부모(PARENTS) 메시지를 찾는 함수"""
    try:
        r = requests.get(f"{API_BASE}/messages", timeout=3)
        data = r.json()
    except Exception:
        return None

    rows = data.get("data", []) if isinstance(data, dict) else []
    rows_sorted = sorted(rows, key=lambda x: parse_dt(x.get("createdDate", "")))

    for row in rows_sorted:
        chat_flag = (row.get("chatFlag") or "").upper().strip()
        ts = parse_dt(row.get("createdDate", ""))
        mc = (row.get("m_content") or "").strip()

        # ✅ 부모 메시지 판정: chat_flag == 'PARENTS' 이고, 직전 아이 메시지와 다르고, 기준 시각 이후
        if chat_flag == "PARENTS" and mc != (last_child_text or "").strip() and ts >= since:
            return row

    return None




# 영상 전용 서버 설정
VIDEO_SERVER_BASE = "http://localhost:3000"   # 백엔드 주소/포트
VIDEO_API_PREFIX  = "/api"                    # 백엔드가 /api 프리픽스 쓰면 유지, 아니면 "" 로

def video_api(path: str) -> str:
    """영상 전용 API 풀 URL 생성"""
    return f"{VIDEO_SERVER_BASE}{VIDEO_API_PREFIX}{path}"


#아이대화 백연결
def save_message_to_api(text, emotion, mode="VOICE", user_no=1, chat_no=1, chat_flag="CHILD"):
    """
    백엔드에 메시지를 저장하는 함수
    chat_flag: 'CHILD' | 'PARENTS' | 'AI'
    """
    payload = {
        "content": text,
        "mode": mode,
        "summary": emotion,
        "userNo": user_no,      # 항상 1 (고정)
        "chatNo": chat_no,
        "chatFlag": chat_flag   # ✅ 추가 — 메시지별 역할 스냅샷
    }

    headers = {"Content-Type": "application/json"}
    print("📤 전송 payload:", json.dumps(payload, ensure_ascii=False))

    try:
        response = requests.post(
            "http://localhost:3000/messages/send",
            json=payload,
            headers=headers,
            timeout=5
        )

        if response.status_code in [200, 201]:
            print("✅ 메시지 저장 성공!")
        else:
            print(f"❌ 메시지 저장 실패: {response.status_code}, {response.text}")

    except Exception as e:
        print(f"⚠️ 서버 전송 중 오류 발생: {e}")




import json, requests, time, threading  # 필요한 모듈 임포트 확인

# 상담챗봇 백연결
def save_consult_message_to_api(
    text,
    mode="CONSULT",
    user_no=1,
    summary=None,
    chat_flag=None,                    # ✅ 추가
    server="http://localhost:3000",
):
    payload = {
        "content": text,
        "mode": mode,                  # 네 설계상 항상 "CONSULT"
        "userNo": user_no,
        "summary": summary,
    }
    if chat_flag is not None:          # ✅ 넘겨준 경우에만 포함
        payload["chat_flag"] = chat_flag

    headers = {"Content-Type": "application/json"}
    print("📤 상담 payload:", json.dumps(payload, ensure_ascii=False))
    try:
        r = requests.post(f"{server}/chatbot/send", json=payload, headers=headers, timeout=10)
        print("🔎 status:", r.status_code, "body:", r.text)
        if r.status_code in (200, 201):
            print("✅ 상담 메시지 저장 성공!")
        else:
            print(f"❌ 상담 메시지 저장 실패: {r.status_code}, {r.text}")
    except Exception as e:
        print("⚠️ 네트워크 예외:", e)




# #상담 챗봇 클래스
def run_consult_chat(mode="both", tone="담백하고 예의 있는 상담 톤", server="http://localhost:3000",
                poll_sec=2, save=True, user_no=1):
    # run_consult_chat 내부
    def watch_front_messages():
        print("🟢 프론트 메시지 감시 시작(auto)")
        last_seen_ts = ""  # ← 마지막으로 본 createdDate 문자열

        while True:
            try:
                resp = requests.get(f"{server}/chatbot/messages", timeout=10)
                data = resp.json()
                rows = data.get("data", []) if isinstance(data, dict) else []
            # createdDate 오름차순 정렬
                rows = sorted(rows, key=lambda r: (r.get("createdDate","")))

            # 새 부모 메시지: createdDate 가 last_seen_ts 보다 큰 것만
                new_parent_msgs = [
                    r for r in rows
                    if (r.get("createdDate","") > last_seen_ts)
                    and ((r.get("chat_flag") or r.get("chatFlag")) in ("PARENTS","USER"))
                    and ((r.get("m_mode") or r.get("mode")) == "CONSULT")
                ]

                for msg in new_parent_msgs:
                    user_text = msg.get("m_content") or msg.get("content") or ""
                    if not user_text: 
                        continue

                    print(f"\n👤 새 부모 메시지: {user_text}")
                    reply = consult_reply(user_text, tone=tone)
                    print(f"🤖 Bot: {reply}")

                # 봇 답변 저장: CONSULT + AI
                    save_consult_message_to_api(
                        reply, mode="CONSULT", user_no=2, chat_flag="AI", server=server
                    )

            # 배치 끝에서 마지막 createdDate 갱신
                if rows:
                    last_seen_ts = rows[-1].get("createdDate","")

                time.sleep(poll_sec)
            except Exception as e:
                print("⚠️ 자동모드 오류:", e)
                time.sleep(5)


    def console_loop():
        print("🔸 문의상담 챗봇 (종료: exit/quit/q)")
        print(f"🔹 tone = {tone} | save_to_db = {save}")
        while True:
            try:
                user_text = input("\n👤 You: ").strip()
            except (EOFError, KeyboardInterrupt):
                print("\n👋 bye"); break

            if user_text.lower() in {"exit", "quit", "q"}: print("👋 bye"); break
            if not user_text: continue

            reply = consult_reply(user_text, tone=tone)
            print(f"🤖 Bot: {reply}")

            if save:
                try:
                    # 사용자 입력 저장: CONSULT + PARENTS
                    save_consult_message_to_api(
                        user_text, mode="CONSULT", user_no=user_no, chat_flag="PARENTS", server=server
                    )
                    time.sleep(1)
                    # ✅ 봇 답변 저장: CONSULT + AI (mode 고정)
                    save_consult_message_to_api(
                        reply, mode="CONSULT", user_no=2, chat_flag="AI", server=server
                    )
                except Exception as e:
                    print("⚠️ 저장 실패:", e)

    if mode in ("auto", "both"):
        t = threading.Thread(target=watch_front_messages, daemon=True)
        t.start()
    if mode in ("console", "both"):
        console_loop()




# ✅ 감정 리포트 클래스
class EmotionReport:
    def __init__(self):
        self.emotion_log = []
        self.text_log = []
        self.turn_count = 0  # 👉 대화 개수 카운트용

    def add_turn(self, text):
        self.text_log.append(text)
        emotion = classify_emotion(text)
        self.emotion_log.append(emotion)
        self.turn_count += 1

        # ✅ 대화가 5개 쌓일 때마다 자동으로 요약 생성 + DB 저장
        if self.turn_count % 5 == 0:
            print(f"\n🪄 대화 {self.turn_count}개 도달 — 자동 요약 생성 중...")
            time.sleep(1.2)
            self.save_summary_to_db(chat_no=1)
            

        return emotion

    def get_emotion_summary(self):
        total = len(self.emotion_log)
        # if total == 0:
        #     return {}
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
    
    # 🆕 텍스트(대화 내용) 기반 요약
    def generate_summary_for_db(self, recent_turns: int = 5) -> str:
        """
        최근 recent_turns개의 실제 대화 문장을 기반으로
        30자 이내의 따뜻한 한 문장 요약을 생성한다.
        """
        if not self.text_log:
            return ""

        # 최근 N턴만 사용(너무 길어지는 것 방지)
        convo = "\n".join(self.text_log[-recent_turns:])

        prompt = f"""
        아래는 아이와 부모의 실제 대화 내용입니다.
        이  대화의 핵심을 따뜻하게 한 문장(30자 이내)으로 요약하세요.
        문장 끝은 '~한 내용.' 또는 '~에 대한 이야기.' 형태로.

        [대화]
        {convo}
        """

        summary = chat_with_gpt(prompt, emotion="neutral")
        # 따옴표/공백 정리
        return (summary or "").strip().strip('"').strip("'")

    

    # 🆕 Node 백엔드로 요약 저장
    def save_summary_to_db(self, chat_no=1):
        summary = self.generate_summary_for_db()

        payload = {
            "chatNo": chat_no,
            "mode": "SUMMARY",   # ✅ 구분용
            "content": summary,  # 요약 내용
            "userNo": 1,         # AI 봇으로 설정
            "chatFlag": "AI", 
        }

        try:
            res = requests.post(
                "http://localhost:3000/messages/send",  # ✅ Node 메시지 API
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            if res.status_code == 201:
                print(f"✅ ({self.turn_count}턴 시점) 요약 저장 완료 → {summary}")
            else:
                print(f"⚠️ 요약 저장 실패: {res.status_code} / {res.text}")
        except Exception as e:
            print(f"❌ 요약 저장 중 오류 발생: {e}")


    
    
# ✅ 음성 보고서 실행 함수
# def run_emotion_report():
#     report = EmotionReport()
#     BASE_DIR = os.path.dirname(os.path.abspath(__file__))
#     audio_dir = os.path.join(BASE_DIR, "audio_inputs")

#     if not os.path.exists(audio_dir):
#         print(f"❌ 디렉토리 {audio_dir} 가 존재하지 않습니다.")
#         return

#     audio_files = sorted([f for f in os.listdir(audio_dir) if f.endswith(".wav")],
#                          key=lambda x: int(os.path.splitext(x)[0]))

#     for filename in audio_files:
#         audio_path = os.path.join(audio_dir, filename)
#         print(f"\n🎤 파일 [{filename}] 음성 인식 중...")
#         user_text = transcribe_audio(audio_path)
#         print("👶 인식된 텍스트:", user_text)
#         emotion = report.add_turn(user_text)
#         print(f"🧠 감정 분석 결과: {emotion}")
#         time.sleep(1.4) #1초 딜레이
#         save_message_to_api(user_text, emotion, user_no=1)

#         manual = get_manual_mode(key="global")
#         if manual:
#             # 기준시각: 저장 직후 + 200ms (레이스 방지)
#             since = datetime.now(timezone.utc) + timedelta(milliseconds=200)
#             last_child_text = user_text

#             parent_msg = wait_for_parent_reply(since, last_child_text)
#             if parent_msg and parent_msg.get("m_content"):
#                 speak_text(parent_msg["m_content"])
#             time.sleep(1.2)
#             continue
        
#         reply = chat_with_gpt(user_text, emotion)
#         print(f"🤖 GPT 응답: {reply}")
#         speak_text(reply)
#         time.sleep(1) #1초 딜레이
#         save_message_to_api(reply, "neutral", user_no=2)

#     print("\n📊 전체 감정 요약:")
#     for emo, perc in report.get_emotion_summary().items():
#         print(f"- {emo}: {perc}%")
#     print("\n🔑 주요 키워드:")
#     for i, kw in enumerate(report.get_top_keywords(), 1):
#         print(f"{i}. {kw}")
#     print("\n👨‍👩‍👧 육아 솔루션 제안:")
#     print(report.generate_parenting_tip())

#         # ✅ 마지막 대화까지 처리 후 전체 요약 저장 한 번 더 실행
#     print("\n💾 전체 대화 요약 저장 중...")
#     report.save_summary_to_db(chat_no=1)

#     report = EmotionReport()
# ✅ 음성 보고서 실행 함수 (chat_flag 기반으로 수정)
def run_emotion_report():
    report = EmotionReport()
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    audio_dir = os.path.join(BASE_DIR, "audio_inputs")

    if not os.path.exists(audio_dir):
        print(f"❌ 디렉토리 {audio_dir} 가 존재하지 않습니다.")
        return

    audio_files = sorted(
        [f for f in os.listdir(audio_dir) if f.endswith(".wav")],
        key=lambda x: int(os.path.splitext(x)[0])
    )

    for filename in audio_files:
        audio_path = os.path.join(audio_dir, filename)
        print(f"\n🎤 파일 [{filename}] 음성 인식 중...")
        user_text = transcribe_audio(audio_path)
        print("👶 인식된 텍스트:", user_text)

        emotion = report.add_turn(user_text)
        print(f"🧠 감정 분석 결과: {emotion}")

        time.sleep(1.4)  # 1초 딜레이

        # ✅ 아이 메시지 저장 (항상 chat_flag='CHILD')
        save_message_to_api(user_text, emotion, chat_flag="CHILD")

        # ✅ 수동모드(부모가 직접 답함) 여부 확인
        manual = get_manual_mode(key="global")

        if manual:
            print("⏸️ 수동모드: 부모 발화를 대기 중...")
            since = datetime.now(timezone.utc) + timedelta(milliseconds=200)
            last_child_text = user_text

            parent_msg = wait_for_parent_reply(since, last_child_text)
            if parent_msg and parent_msg.get("m_content"):
                speak_text(parent_msg["m_content"])

                report.add_turn(parent_msg["m_content"])

                # ✅ 부모 메시지도 저장 (chat_flag='PARENTS')
                # save_message_to_api(parent_msg["m_content"], "neutral", chat_flag="PARENTS")

            time.sleep(1.2)
            continue  # 자동모드 GPT 응답은 생략하고 다음 턴으로

        # ✅ 자동모드: AI 응답
        reply = chat_with_gpt(user_text, emotion)
        print(f"🤖 GPT 응답: {reply}")
        speak_text(reply)
        time.sleep(1)

        report.add_turn(reply)

        # ✅ AI 응답 저장 (chat_flag='AI')
        save_message_to_api(reply, "neutral", chat_flag="AI")

    # ✅ 전체 요약 및 솔루션 출력
    print("\n📊 전체 감정 요약:")
    for emo, perc in report.get_emotion_summary().items():
        print(f"- {emo}: {perc}%")

    print("\n🔑 주요 키워드:")
    for i, kw in enumerate(report.get_top_keywords(), 1):
        print(f"{i}. {kw}")

    print("\n👨‍👩‍👧 육아 솔루션 제안:")
    print(report.generate_parenting_tip())

    # ✅ 대화 요약 저장
    print("\n💾 전체 대화 요약 저장 중...")
    report.save_summary_to_db(chat_no=1)

    report = EmotionReport()



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
# def cli():
#      import argparse, os
#      ap = argparse.ArgumentParser()
#      ap.add_argument("--mode", choices=["voice", "video", "consult"], required=True)
#      ap.add_argument("--video", help="분석할 mp4 경로 (video 모드 필수)")
#      # 상담 챗봇용 옵션
#      ap.add_argument("--tone", default="담백하고 예의 있는 상담 톤",
#                      help="문의 챗봇 답변 톤 힌트 (예: '친근하고 간결', '공식적이고 간결')")
#      ap.add_argument("--no-save", action="store_true",
#                      help="문의 챗봇 대화를 /messages/send 로 저장(옵션)")
#      ap.add_argument("--user-no", type=int, default=1,
#                      help="(save 사용 시) 사용자 user_no")
#      args = ap.parse_args()

#      if args.mode == "voice":
#          run_emotion_report()

#      elif args.mode == "video":
#          if not args.video:
#              raise SystemExit("--video 경로가 필요합니다. (예: --video ./uploads/xxx.mp4)")
#          if not os.path.isabs(args.video):
#              base = os.path.dirname(os.path.abspath(__file__))
#              args.video = os.path.normpath(os.path.join(base, args.video))
#          run_behavior_report(args.video)

#      else:  # consult
#          run_consult_chat(tone=args.tone, save=not args.no_save, user_no=args.user_no)


# if __name__ == "__main__":
#      cli()


# # # ✅ 실행
if __name__ == "__main__":
     #main()
     run_emotion_report()
     #run_consult_chat(mode="both")
# #     run_behavior_report("./ravo_emotion/test.mp4")
# #     pass