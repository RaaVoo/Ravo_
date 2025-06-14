from stt_module import transcribe_audio
from emotion_module import classify_emotion
from chat_module import chat_with_gpt
from tts_module import speak_text

def main():
    print("🎤 음성 인식 시작 중...")
    user_text = transcribe_audio("audio.wav")
    print("👶 인식된 텍스트:", user_text)

    emotion = classify_emotion(user_text)
    print("🧠 감정 분류 결과:", emotion)

    reply = chat_with_gpt(user_text, emotion)
    print("🤖 GPT 응답:", reply)

    speak_text(reply)

if __name__ == "__main__":
    main()
