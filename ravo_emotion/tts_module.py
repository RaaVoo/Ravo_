from gtts import gTTS
import os

def speak_text(text, filename="response.mp3"):
    tts = gTTS(text=text, lang="ko")
    tts.save(filename)
    os.system(f"start {filename}")