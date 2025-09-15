import json
from ai_behavior_engine import AIBehaviorEngine
from chat_module import chat_with_gpt

class BehaviorReport:
    def __init__(self, video_path):
        self.video_path = video_path
        self.engine = AIBehaviorEngine()
        self.report = None

    def analyze(self):
        """영상 분석 실행"""
        self.report = self.engine.analyze(self.video_path, save_json="behavior_report.json")
        return self.report

    def generate_report_text(self):
        """이상행동 여부에 따른 보고서 텍스트 생성"""
        if not self.report:
            return "❌ 분석이 실행되지 않았습니다."

        summary = self.report.summary
        rep_flags = self.report.repetition_flags
        ab_flags = self.report.abnormal_flags

        # 이상행동 없는 경우
        if not rep_flags and not ab_flags:
            return f"🎥 영상 분석 결과: 이상 행동은 발견되지 않았습니다. (총 길이 {summary['duration_sec']}초)"

        # 이상행동 설명
        abnormal_desc = []
        for ev in rep_flags:
            abnormal_desc.append(f"- 반복행동: {ev.type} {round(ev.t_end-ev.t_start,1)}초 동안 지속")
        for ev in ab_flags:
            abnormal_desc.append(f"- 이상행동 구간: {ev.t_start}~{ev.t_end}초 (평균 확신도 {ev.avg_conf:.2f})")

        # GPT에게 원인/해결책 요청
        prompt = f"""
        당신은 아동 행동 전문가입니다.
        다음은 홈캠에서 감지된 아동의 행동 분석 결과입니다.

        분석 요약: {json.dumps(summary, ensure_ascii=False)}
        이상행동:
        {chr(10).join(abnormal_desc)}

        위 이상행동을 바탕으로,
        1) 이상행동이 정확히 어떤 행동이고, 왜 이런 행동이 나타났을지 가능한 원인을 설명하고,
        2) 부모가 어떤 방식으로 대응하면 좋을지 실용적인 조언을 4~5줄로 써주세요.
        3) 만약 이상행동으로 판단되지 않는다면 이상 행동이 없다고 말해 주세요.

        중복 없이 한 번만 말해 주세요.
        """
        advice = chat_with_gpt(prompt, emotion="neutral")

        return f"🎥 영상 분석 보고서\n" + "\n".join(abnormal_desc) + f"\n\n👩‍👩‍👧 전문가 제안:\n{advice}"
