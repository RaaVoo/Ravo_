from gtts import gTTS
import os
import time

def speak_text(text):
    filename = f"response_{int(time.time())}.mp3"
    
    tts = gTTS(text=text, lang="ko")
    tts.save(filename)
    os.system(f"start {filename}")
