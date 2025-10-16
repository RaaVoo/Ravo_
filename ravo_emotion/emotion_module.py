# from transformers import pipeline

# # 허깅페이스 모델 이름
# model_name = "searle-j/kote_for_easygoing_people"

# # 감정 분류 파이프라인 생성
# classifier = pipeline("text-classification", model=model_name)

# def classify_emotion(text):
#     result = classifier(text)
#     return result[0]["label"]  # 예: '짜증', '무기력' 등

from transformers import pipeline

# KoTE 기반 모델
model_name = "searle-j/kote_for_easygoing_people"
classifier = pipeline("text-classification", model=model_name)

# 세부 감정 → 대표 감정 5개 매핑
emotion_map = {
    # 기쁨
    "기쁨": "기쁨", "즐거움": "기쁨", "감동": "기쁨", "설렘": "기쁨", "뿌듯함": "기쁨", "행복": "기쁨", "환영/호의": "기쁨", "감동/감탄": "기쁨", "고마움": "기쁨", "존경": "기쁨", "기대감": "기쁨", "뿌듯함": "기쁨", "편안/쾌적": "기쁨", "아껴주는": "기쁨", "즐거움/신남": "기쁨", "흐뭇함": "기쁨", "귀여움/예쁨": "기쁨", "안심/신뢰": "기쁨",
    
    # 슬픔
    "슬픔": "슬픔", "우울": "슬픔", "무기력": "슬픔", "상실감": "슬픔", "실망": "슬픔", "서운함": "슬픔","안타까움/실망": "슬픔", "절망": "슬픔", "패배/자기혐오": "슬픔", "힘듦/지침": "슬픔", "불행함/연민": "슬픔", "죄책감": "슬픔", "서러움": "슬픔",
    
    # 화남
    "화남": "화남", "짜증": "화남", "불쾌": "화남", "열받음": "화남", "짜증남": "화남", "혐오": "화남", "한심함": "화남", "역겨움/징그러움": "화남", "증오/혐오": "화남", "우쭐댐/무시함": "화남",
    
    # 불안
    "불안": "불안", "초조": "불안", "걱정": "불안", "긴장": "불안", "당황": "불안", "두려움": "불안", "의심/불신": "불안", "부끄러움": "불안", "공포/무서움": "불안", "당황/난처": "불안", "경악": "불안", "부담/안_내킴": "불안", "불안/걱정": "불안", "놀람": "불안",
    
    # 중립
    "중립": "중립", "담담": "중립", "평온": "중립", "무감정": "중립", "혼란": "중립", "귀찮음": "중립", "지긋지긋": "중립", "어이없음": "중립", "재미없음": "중립", "신기하다/관심": "중립", "깨달음": "중립", "비장함": "중립", "없음": "중립"
}

def classify_emotion(text):
    result = classifier(text)
    label = result[0]["label"]
    mapped_label = emotion_map.get(label, "중립")  # 혹시 없는 감정이면 중립으로 처리
    return mapped_label
