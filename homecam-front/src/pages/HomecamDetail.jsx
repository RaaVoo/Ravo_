import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import "./HomecamDetail.css";
import HlsPlayer from "./HlsPlayer";

const API_BASE = process.env.REACT_APP_API_BASE || "";

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

  // 저장 시각 표시 (한국어 스타일, 분까지만)
  const savedDate = item?.r_start
    ? new Date(item.r_start).toLocaleString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
      })
    : item?.createdDate
    ? new Date(item.createdDate).toLocaleString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
      })
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
