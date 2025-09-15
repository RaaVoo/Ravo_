# -*- coding: utf-8 -*-
"""
AI 전용: 저장된 영상 -> 행동 타임라인 + 반복 패턴 + 이상행동 필터 -> JSON 리포트
- 행동 분류: TimeSformer/VideoMAE (Kinetics 계열)
- 이상 필터: UCF-Crime 파생(Non-Normal = 이상 의심)
- OpenCV로 프레임 읽어 동일 프레임을 두 모델에 재활용(효율↑)
"""

import os, json, math
from dataclasses import dataclass
from typing import List, Dict, Any, Tuple, Optional

import cv2
import numpy as np
import torch
import torch.nn.functional as F
from tqdm import tqdm

# 🤗
from transformers import (
    AutoImageProcessor,
    VideoMAEImageProcessor,
    TimesformerForVideoClassification,
    VideoMAEForVideoClassification,
)

# -----------------------------
# 설정 (필요에 맞게 바꿔도 됨)
# -----------------------------
# 행동 분류(일상 동작) 모델
ACTION_MODEL_ARCH   = "timesformer"  # "timesformer" | "videomae"
ACTION_MODEL_NAME   = "facebook/timesformer-base-finetuned-k400"   # 또는 "MCG-NJU/videomae-base-finetuned-kinetics"

# 이상행동 필터 모델
ABNORMAL_MODEL_ARCH = "videomae"
ABNORMAL_MODEL_NAME = "mitegvg/videomae-base-finetuned-xd-violence"


# 샘플링/클립 파라미터
SAMPLE_FPS   = 10   # 원본에서 다운샘플링할 FPS
NUM_FRAMES   = 16   # 모델 인퍼런스에 쓸 프레임 수
STRIDE       = 8    # 윈도우 stride (프레임 단위, 50% overlap)

# 행동 타임라인/플래그 기준
ACTION_CONF_THRESH    = 0.35
REPETITION_TARGETS    = {"running", "jumping"}  # 장기 지속 시 플래그할 행동
REPETITION_MIN_SEC    = 10.0
# ABNORMAL_PROB_THRESH  = 0.50  # 이상 필터 모델의 임계 확률

# 상단 설정부에 추가/수정 (ai_behavior_engine.py)
ABNORMAL_PROB_THRESH  = 0.70   # 0.5 → 0.70 권장
ABNORMAL_MARGIN       = 0.15   # 정상보다 0.15 이상 높을 때만 이상
ABNORMAL_MIN_CONSEC   = 10   # 연속 3클립(대략 2~3초) 이상일 때만 이벤트로 인정

# Kinetics 라벨을 간단한 코어 라벨로 매핑(휴리스틱)
COARSE_KEYS = {
    "walking":  ["walk", "walking"],
    "running":  ["run", "running", "jogging"],
    "sitting":  ["sitting", "sit"],
    "lying":    ["lying", "sleep", "sleeping", "laying"],
    "jumping":  ["jump", "jumping", "hopping"],
    "standing": ["standing", "stand"],
    "playing":  [
        "playing", "clapping", "throwing", "catching", "dancing",
        "juggling soccer ball", "kicking soccer ball", "shooting goal (soccer)",
        "dribbling basketball", "robot dancing", "pumping fist", "skipping rope",
        "golf putting", "tossing coin", "exercising arm", "stretching arm", "stretching leg",
        "squat", "lunge", "high kick", "deadlifting", "front raises", "jumpstyle dancing"
    ]

    
}


# -----------------------------
# 데이터 구조
# -----------------------------
@dataclass
class ClipPred:
    t_start: float
    t_end: float
    action_topk: List[Tuple[str, float]]
    action_top1: str
    action_prob: float
    coarse: str
    abnormal_label: str
    abnormal_prob: float
    abnormal_flag: bool

@dataclass
class Event:
    type: str
    t_start: float
    t_end: float
    avg_conf: float

@dataclass
class Report:
    video_path: str
    duration_sec: float
    params: Dict[str, Any]
    clips: List[ClipPred]
    action_events: List[Event]
    repetition_flags: List[Event]
    abnormal_flags: List[Event]
    summary: Dict[str, Any]

# -----------------------------
# 유틸
# -----------------------------
def _device_dtype():
    if torch.cuda.is_available():
        return torch.device("cuda"), torch.float16
    elif torch.backends.mps.is_available():
        return torch.device("mps"), torch.float32
    return torch.device("cpu"), torch.float32

def _read_meta(path) -> Tuple[float, int]:
    cap = cv2.VideoCapture(path)
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    n   = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
    cap.release()
    return float(fps), n

def _sample_indices(orig_fps: float, frame_count: int, sample_fps: int) -> List[int]:
    if sample_fps >= orig_fps:
        return list(range(frame_count))
    step = max(1, int(round(orig_fps / sample_fps)))
    return list(range(0, frame_count, step))

def _make_windows(idxs: List[int], num_frames: int, stride: int) -> List[List[int]]:
    windows = []
    for s in range(0, max(0, len(idxs) - num_frames + 1), stride):
        win = idxs[s:s+num_frames]
        if len(win) == num_frames:
            windows.append(win)
    return windows

def _coarse(label: str) -> str:
    L = label.lower()
    for k, keys in COARSE_KEYS.items():
        if any(x in L for x in keys):
            return k
    return "other"

def _group_events(labels: List[str], confs: List[float], starts: List[float], ends: List[float]) -> List[Event]:
    if not labels: return []
    res: List[Event] = []
    cur = labels[0]; cur_s = starts[0]; buf=[confs[0]]
    for i in range(1, len(labels)):
        if labels[i] == cur:
            buf.append(confs[i])
        else:
            res.append(Event(cur, cur_s, ends[i-1], float(np.mean(buf))))
            cur = labels[i]; cur_s = starts[i]; buf=[confs[i]]
    res.append(Event(cur, cur_s, ends[-1], float(np.mean(buf))))
    return res

def _summarize(duration: float, action_events: List[Event], rep_flags: List[Event], ab_flags: List[Event]) -> Dict[str, Any]:
    per_sec = {}
    for ev in action_events:
        per_sec.setdefault(ev.type, 0.0)
        per_sec[ev.type] += (ev.t_end - ev.t_start)
    total = sum(per_sec.values()) or 1e-6
    dist = {k: round(v/total, 4) for k, v in per_sec.items()}
    return {
        "duration_sec": round(duration, 2),
        "action_time_sec": {k: round(v,2) for k,v in per_sec.items()},
        "action_time_ratio": dist,
        "top_actions": sorted(dist.items(), key=lambda x:x[1], reverse=True)[:5],
        "repetition_flags_count": len(rep_flags),
        "abnormal_flags_count": len(ab_flags),
    }

# -----------------------------
# 분류기 래퍼
# -----------------------------
class VideoClassifier:
    def __init__(self, arch: str, model_name: str, device: torch.device, dtype: torch.dtype):
        self.arch = arch
        self.model_name = model_name
        self.device = device
        self.dtype = dtype

        if arch == "timesformer":
            # ▶▶ 수정 시작: 프로세서 로딩에 베이스 모델 폴백 추가
            try:
                # 1차 시도: 대상 레포에서 프로세서 로드 (있으면 사용)
                self.processor = AutoImageProcessor.from_pretrained(model_name)
            except Exception as e:
                print(f"[WARN] Processor not found for {model_name}: {e}")
                print("[INFO] Fallback to base processor: facebook/timesformer-base-finetuned-k400")
                # 2차 시도: 베이스 모델 프로세서 사용
                self.processor = AutoImageProcessor.from_pretrained(
                    "facebook/timesformer-base-finetuned-k400"
                )
            # ▶▶ 수정 끝

            self.model = TimesformerForVideoClassification.from_pretrained(
                model_name,
                torch_dtype=(dtype if dtype in (torch.float16, torch.bfloat16) else None)
            ).to(device).eval()
            self.id2label = self.model.config.id2label

        elif arch == "videomae":
            self.processor = VideoMAEImageProcessor.from_pretrained(model_name)
            self.model = VideoMAEForVideoClassification.from_pretrained(
                model_name, torch_dtype=(dtype if dtype in (torch.float16, torch.bfloat16) else None)
            ).to(device).eval()
            self.id2label = self.model.config.id2label
        else:
            raise ValueError("arch must be 'timesformer' or 'videomae'")
        
    @torch.inference_mode()
    def predict(self, frames: List[np.ndarray]) -> List[Tuple[str, float]]:
        """
        frames: RGB 이미지 리스트 (길이 = NUM_FRAMES), 각 원소 shape = HxWxC
        반환: [(label, prob), ...] top-5
        """
        # 모델/프로세서별 입력 키워드 다름 → 분기
        try:
            if self.arch == "videomae":
                # VideoMAE 계열은 videos= 를 기대
                inputs = self.processor(videos=frames, return_tensors="pt")
            else:
                # TimeSformer 계열은 images= (또는 위치 인자) 를 기대
                inputs = self.processor(images=frames, return_tensors="pt")
        except TypeError:
            # 일부 버전 호환(위치 인자)
            inputs = self.processor(frames, return_tensors="pt")

        inputs = {k: v.to(self.device) for k, v in inputs.items()}
        logits = self.model(**inputs).logits
        probs = F.softmax(logits, dim=-1)[0].float().cpu().numpy()
        top_idx = probs.argsort()[-5:][::-1]
        return [(self.id2label[int(i)], float(probs[int(i)])) for i in top_idx]
    

    # ai_behavior_engine.py 내 VideoClassifier에 추가
    @torch.inference_mode()
    def predict_proba(self, frames: List[np.ndarray]) -> Tuple[np.ndarray, Dict[int, str]]:
        # frames -> 전체 클래스 확률 벡터 반환
        try:
            if self.arch == "videomae":
                inputs = self.processor(videos=frames, return_tensors="pt")
            else:
                inputs = self.processor(images=frames, return_tensors="pt")
        except TypeError:
            inputs = self.processor(frames, return_tensors="pt")
        inputs = {k: v.to(self.device) for k, v in inputs.items()}
        logits = self.model(**inputs).logits
        probs = F.softmax(logits, dim=-1)[0].float().cpu().numpy()  # shape: [num_cls]
        return probs, self.id2label




# -----------------------------
# 메인 엔진
# -----------------------------
class AIBehaviorEngine:
    def __init__(self,
                 action_arch: str = ACTION_MODEL_ARCH,
                 action_model: str = ACTION_MODEL_NAME,
                 abnormal_arch: str = ABNORMAL_MODEL_ARCH,
                 abnormal_model: str = ABNORMAL_MODEL_NAME,
                 sample_fps: int = SAMPLE_FPS,
                 num_frames: int = NUM_FRAMES,
                 stride: int = STRIDE,
                 action_conf_thresh: float = ACTION_CONF_THRESH,
                 repetition_targets: Optional[set] = None,
                 repetition_min_sec: float = REPETITION_MIN_SEC,
                 abnormal_prob_thresh: float = ABNORMAL_PROB_THRESH,
                 abnormal_margin: float = ABNORMAL_MARGIN,
                 abnormal_min_consec: int = ABNORMAL_MIN_CONSEC):
        self.device, self.dtype = _device_dtype()
        self.action = VideoClassifier(action_arch, action_model, self.device, self.dtype)
        self.abnorm = VideoClassifier(abnormal_arch, abnormal_model, self.device, self.dtype)
        self.sample_fps = sample_fps
        self.num_frames = num_frames
        self.stride = stride
        self.action_conf_thresh = action_conf_thresh
        self.rep_targets = repetition_targets or set(REPETITION_TARGETS)
        self.rep_min_sec = repetition_min_sec
        self.ab_thresh = abnormal_prob_thresh
        self.ab_margin = abnormal_margin
        self.ab_min_consec = abnormal_min_consec

    @torch.inference_mode()
    def analyze(self, video_path: str, save_json: Optional[str] = None) -> Report:
        assert os.path.exists(video_path), f"영상 없음: {video_path}"
        cap = cv2.VideoCapture(video_path)
        orig_fps, frame_count = _read_meta(video_path)
        duration = frame_count / (orig_fps or 1.0)

        # 샘플링 인덱스 & 윈도우
        samp_idxs = _sample_indices(orig_fps, frame_count, self.sample_fps)
        windows = _make_windows(samp_idxs, self.num_frames, self.stride)

        # 프레임 캐시
        cache: Dict[int, np.ndarray] = {}
        read_ptr = 0

        clips: List[ClipPred] = []

        for win in tqdm(windows, desc="클립 추론"):
            frames=[]
            for idx in win:
                if idx in cache:
                    frames.append(cache[idx]); continue
                if idx < read_ptr:
                    cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
                    read_ptr = idx
                while read_ptr <= idx:
                    ok, bgr = cap.read()
                    if not ok: break
                    if read_ptr == idx:
                        rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
                        cache[idx] = rgb; frames.append(rgb)
                    read_ptr += 1
            if len(frames) != self.num_frames:
                continue

            t0 = win[0] / (orig_fps or 1.0)
            t1 = win[-1] / (orig_fps or 1.0)

            # 행동 예측
            a_topk = self.action.predict(frames)
            a_label, a_prob = a_topk[0]
            coarse = _coarse(a_label)
            if a_prob < self.action_conf_thresh:
                coarse = "other"

            # 이상 필터
            # 교체:
            # # analyze()의 이상 판정 부분 교체
            b_probs, id2label = self.abnorm.predict_proba(frames)
            labels = [id2label[i].lower() for i in range(len(id2label))]

            violence_idx = None; normal_idx = None
            for i, L in enumerate(labels):
                if any(k in L for k in ["violence","abnormal","fight","assault","aggression"]):
                    violence_idx = i
                if any(k in L for k in ["non","normal","benign"]):
                    normal_idx = i
            if violence_idx is None and len(labels) == 2: violence_idx = 1
            if normal_idx  is None and len(labels) == 2: normal_idx  = 0

            p_ab = float(b_probs[violence_idx]) if violence_idx is not None else float(b_probs.max())
            p_nm = float(b_probs[normal_idx])  if normal_idx  is not None else 1.0 - p_ab

            ab_flag = (p_ab >= self.ab_thresh) and ((p_ab - p_nm) >= self.ab_margin)

            b_label = id2label[int(np.argmax(b_probs))]
            b_prob  = p_ab  # 보고/평균 계산은 "이상 확률"로






            # b_probs, id2label = self.abnorm.predict_proba(frames)
            # labels = [id2label[i].lower() for i in range(len(id2label))]

            # # violence/abnormal 쪽 인덱스 추정
            # violence_idx = None
            # normal_idx = None
            # for i, L in enumerate(labels):
            #     if any(k in L for k in ["violence", "abnormal", "fight", "assault", "aggression"]):
            #         violence_idx = i
            #     if any(k in L for k in ["non", "normal", "benign"]):
            #         normal_idx = i

            # # 이진모델 대응: 라벨명이 애매하면 관례적으로 idx=1을 폭력으로 가정(많은 이진모델 관례)
            # if violence_idx is None and len(labels) == 2:
            #     violence_idx = 1
            # if normal_idx is None and len(labels) == 2:
            #     normal_idx = 0

            # p_ab = float(b_probs[violence_idx]) if violence_idx is not None else float(b_probs.max())
            # p_nm = float(b_probs[normal_idx]) if normal_idx is not None else 1.0 - p_ab

            # ab_flag = (p_ab >= self.ab_thresh) and (p_ab > p_nm)
            # b_label = id2label[int(np.argmax(b_probs))]
            # b_prob  = p_ab  # 보고용으로는 "비정상 확률"을 기록

            # b_topk = self.abnorm.predict(frames)
            # b_label, b_prob = b_topk[0]
            # Normal 판단 규칙(모델별 라벨 편차 대응)
            # lower = b_label.lower()
            # is_normal = ("normal" == lower) or ("normal videos" in lower)
            # ab_flag = (not is_normal) and (b_prob >= self.ab_thresh)
            # def _is_normal_label(lbl: str) -> bool:
            #     l = lbl.lower()
            #     normal_keys = [
            #       "normal", "normal videos",   # UCF-Crime 류
            #       "non-violence", "nonviolence", "no violence",  # XD-Violence 류
            #       "benign"
            #     ]
            #     return any(k in l for k in normal_keys)

            # is_normal = _is_normal_label(b_label)
            # ab_flag = (not is_normal) and (b_prob >= self.ab_thresh)

            

            clips.append(ClipPred(
                t_start=round(t0,2), t_end=round(t1,2),
                action_topk=[(l, round(p,4)) for l,p in a_topk],
                action_top1=a_label, action_prob=float(round(a_prob,4)),
                coarse=coarse,
                abnormal_label=b_label, abnormal_prob=float(round(b_prob,4)),
                abnormal_flag=bool(ab_flag)
            ))

        cap.release()



        # 행동 이벤트 병합
        act_labels = [c.coarse for c in clips]
        act_confs  = [c.action_prob for c in clips]
        starts     = [c.t_start for c in clips]
        ends       = [c.t_end for c in clips]
        action_events = _group_events(act_labels, act_confs, starts, ends)

        # 반복행동 플래그(장기 지속)
        repetition_flags = [ev for ev in action_events
                            if ev.type in self.rep_targets and (ev.t_end - ev.t_start) >= self.rep_min_sec]

        # 이상행동 플래그(클립→병합)
        # ab_labels = []; ab_confs=[]; ab_starts=[]; ab_ends=[]
        # for c in clips:
        #     if c.abnormal_flag:
        #         ab_labels.append("abnormal"); ab_confs.append(c.abnormal_prob)
        #         ab_starts.append(c.t_start);  ab_ends.append(c.t_end)
        # abnormal_flags = _group_events(ab_labels, ab_confs, ab_starts, ab_ends)

        # === (기존) 반복행동 플래그 계산 바로 아래에 넣기 ===
        # 이상행동 플래그(연속 길이 필터 적용: run-length encoding)
        flags  = [c.abnormal_flag for c in clips]
        starts = [c.t_start for c in clips]
        ends   = [c.t_end   for c in clips]

        abnormal_flags = []
        i = 0
        while i < len(flags):
            if not flags[i]:
                i += 1
                continue
        j = i
        buf_conf = []
        while j < len(flags) and flags[j]:
            buf_conf.append(clips[j].abnormal_prob)
        j += 1
        # 연속 길이 조건 충족 시에만 이벤트로 등록
        if (j - i) >= self.ab_min_consec:
            abnormal_flags.append(
                Event("abnormal", starts[i], ends[j-1], float(np.mean(buf_conf)))
            )
        i = j


        summary = _summarize(duration, action_events, repetition_flags, abnormal_flags)

        report = Report(
            video_path=os.path.abspath(video_path),
            duration_sec=round(duration,2),
            params={
                "action_model": f"{self.action.model_name} ({self.action.arch})",
                "abnormal_model": f"{self.abnorm.model_name} ({self.abnorm.arch})",
                "sample_fps": self.sample_fps,
                "num_frames": self.num_frames,
                "stride": self.stride,
                "action_conf_thresh": self.action_conf_thresh,
                "repetition_targets": list(self.rep_targets),
                "repetition_min_sec": self.rep_min_sec,
                "abnormal_prob_thresh": self.ab_thresh
            },
            clips=clips,
            action_events=action_events,
            repetition_flags=repetition_flags,
            abnormal_flags=abnormal_flags,
            summary=summary
        )

        if save_json:
            os.makedirs(os.path.dirname(os.path.abspath(save_json)) or ".", exist_ok=True)
            def ev2d(e: Event): return {"type":e.type,"t_start":round(e.t_start,2),"t_end":round(e.t_end,2),"avg_conf":round(e.avg_conf,4)}
            payload = {
                "video_path": report.video_path,
                "duration_sec": report.duration_sec,
                "params": report.params,
                "clips": [c.__dict__ for c in report.clips],
                "action_events": [ev2d(e) for e in report.action_events],
                "repetition_flags": [ev2d(e) for e in report.repetition_flags],
                "abnormal_flags": [ev2d(e) for e in report.abnormal_flags],
                "summary": report.summary
            }
            with open(save_json, "w", encoding="utf-8") as f:
                json.dump(payload, f, ensure_ascii=False, indent=2)

        return report

# 간단 실행 예시(직접 실행 시)
if __name__ == "__main__":
    import argparse, pprint
    ap = argparse.ArgumentParser()
    ap.add_argument("--video", required=True, help="분석할 MP4 경로")
    ap.add_argument("--out", default="report.json", help="JSON 저장 경로")
    args = ap.parse_args()
    eng = AIBehaviorEngine()
    rep = eng.analyze(args.video, save_json=args.out)
    pprint.pp(rep.summary)
    print(f"[OK] JSON 저장 → {os.path.abspath(args.out)}")
