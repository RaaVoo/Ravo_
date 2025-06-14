import openai
import os
from dotenv import load_dotenv

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def chat_with_gpt(user_input, emotion):
    prompt = f"(감정: {emotion}) {user_input}"
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": "넌 감정을 고려해서 아이에게 따뜻하게 응답하는 챗봇이야."},
            {"role": "user", "content": prompt}
        ]
    )
    return response.choices[0].message.content

