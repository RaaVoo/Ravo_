from transformers import pipeline

# 허깅페이스 모델 이름
model_name = "searle-j/kote_for_easygoing_people"

# 감정 분류 파이프라인 생성
classifier = pipeline("text-classification", model=model_name)

def classify_emotion(text):
    result = classifier(text)
    return result[0]["label"]  # 예: '짜증', '무기력' 등