import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import "./HomecamDetail.css";
import HlsPlayer from "./HlsPlayer";

const API_BASE = process.env.REACT_APP_API_BASE || "";

/** 예: 2025년 10월 1일 AM 4:06 */
function formatAMPMK(dateLike) {
  if (!dateLike) return "-";
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return "-";
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  let hh = d.getHours();
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ampm = hh >= 12 ? "PM" : "AM";
  hh = hh % 12 || 12; // 0시는 12로 표기
  return `${y}년 ${m}월 ${day}일 ${ampm} ${hh}:${mm}`;
}

export default function HomecamDetail() {
  const { record_no } = useParams();
  const navigate = useNavigate();
  const { search } = useLocation();

  const qs = useMemo(() => new URLSearchParams(search), [search]);
  const useMock = qs.get("mock") === "1";

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // UI 확인용 목업
  const mockItem = useMemo(
    () => ({
      record_no: Number(record_no) || 1,
      cam_url: "",
      snapshot_url: "/images/mock_snapshot.jpg",
      r_start: new Date().toISOString(),
      createdDate: new Date().toISOString(),
      __mock: true,
    }),
    [record_no]
  );

  // 상세 조회
  const fetchDetail = async () => {
    if (useMock) {
      setItem(mockItem);
      return;
    }
    try {
      setLoading(true);
      setErrorMsg("");

      const res = await fetch(`${API_BASE}/homecam/camlist/${record_no}`);
      if (!res.ok) {
        setErrorMsg("서버에서 상세 데이터를 찾지 못했어요.");
        setItem(null);
        return;
      }
      const data = await res.json();

      const row = Array.isArray(data) ? data[0] : data;
      if (!row) {
        setErrorMsg("해당 레코드를 찾지 못했어요.");
        setItem(null);
        return;
      }
      setItem(row);

      console.table([
        { id: row.record_no, cam: !!row.cam_url, snap: !!row.snapshot_url },
      ]);
    } catch (e) {
      console.error(e);
      setErrorMsg("네트워크 오류로 상세 정보를 불러오지 못했어요.");
      setItem(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [record_no, useMock]);

  // 저장 시각 표시 (예: 2025년 10월 1일 AM 4:06)
  const savedDate = item?.r_start
    ? formatAMPMK(item.r_start)
    : item?.createdDate
    ? formatAMPMK(item.createdDate)
    : "-";

  const isHls = !!item?.cam_url && /\.m3u8($|\?)/i.test(item.cam_url);

  const playableUrl = useMemo(() => {
    const raw = item?.cam_url || "";
    if (!raw) return "";
    if (isHls) return raw;
    return raw.replace("/media/", "/media/stream/");
  }, [item?.cam_url, isHls]);

  return (
    <div className="hc-detail-wrap">
      <h2 className="hc-detail-title">{useMock ? "홈캠 보기" : savedDate}</h2>

      {errorMsg && (
        <div className="hc-alert">
          {errorMsg} {useMock ? null : "주소 끝에 ?mock=1 을 붙이면 데모로 볼 수 있어요."}
        </div>
      )}

      {loading ? (
        <div className="hc-loading">불러오는 중...</div>
      ) : (
        <>
          <div className="hc-detail-player">
            {item?.cam_url ? (
              isHls ? (
                <HlsPlayer src={playableUrl} />
              ) : (
                <video
                  key={playableUrl}
                  className="hc-video"
                  src={playableUrl}
                  controls
                  poster={item?.snapshot_url || undefined}
                  preload="metadata"
                  playsInline
                />
              )
            ) : item?.snapshot_url ? (
              <img className="hc-image" src={item.snapshot_url} alt="snapshot" />
            ) : (
              <div className="hc-placeholder">영상이 여기에 표시됩니다</div>
            )}
          </div>

          {/* ✅ 파일 URL만 표시 */}
          {item?.cam_url && (
            <div className="hc-file-hint">
              파일 URL: <code>{playableUrl}</code>
            </div>
          )}
        </>
      )}

      <div className="hc-detail-footer">
        <button
          onClick={() => navigate(-1)}
          className="hc-back-btn confirm"
          type="button"
        >
          뒤로가기
        </button>
      </div>
    </div>
  );
}
