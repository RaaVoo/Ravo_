// src/pages/HomecamList.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./HomecamList.css";

/**
 * 서버 페이지네이션 사용 버전
 * - 목록: GET  /homecam/camlist?page=1&date=YYYY-MM-DD(옵션)
 *   → { page, totalPages, total, videos: [...] }
 * - 삭제: DELETE /homecam/camlist/:record_no
 * - 상세: GET  /homecam/camlist/:record_no
 */

// ★ .env가 비어있어도 안전하게 로컬 백엔드로 떨어지도록
const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8080";

export default function HomecamList() {
  const navigate = useNavigate();

  const [videos, setVideos] = useState([]);         // 현재 페이지 영상 목록
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");           // YYYY-MM-DD 형식 권장
  const [page, setPage] = useState(1);              // 현재 페이지 (서버 기준)
  const [totalPages, setTotalPages] = useState(1);  // 서버에서 내려주는 총 페이지
  const [checked, setChecked] = useState({});       // { [record_no]: true/false }

  // 서버에서 목록 가져오기
  const fetchVideos = async (nextPage = page, date = query.trim()) => {
    try {
      setLoading(true);
      const qp = new URLSearchParams();
      qp.set("page", String(nextPage));
      if (date) qp.set("date", date);

      const res = await fetch(`${API_BASE}/homecam/camlist?${qp.toString()}`);
      if (!res.ok) throw new Error("목록 조회 실패");
      const data = await res.json(); // { page, totalPages, total, videos }

      setVideos(Array.isArray(data.videos) ? data.videos : []);
      setTotalPages(data.totalPages || 1);
      setPage(data.page || nextPage);

      // ★ 디버깅: 어떤 항목이 cam_url/snapshot_url 있는지 한눈에
      console.table(
        (data.videos || []).map(v => ({
          id: v.record_no,
          cam: !!v.cam_url,
          snap: !!v.snapshot_url,
          r_start: v.r_start
        }))
      );
    } catch (err) {
      console.error(err);
      alert("영상 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 최초 로드
  useEffect(() => {
    fetchVideos(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 검색 버튼: 1페이지부터 다시 조회
  const onSearch = () => {
    fetchVideos(1, query.trim());
    setChecked({});
  };

  // 체크박스 토글
  const toggleCheck = (record_no) =>
    setChecked((prev) => ({ ...prev, [record_no]: !prev[record_no] }));

  // 현재 페이지 전체 선택/해제
  const allCheckedOnPage =
    videos.length > 0 && videos.every((v) => checked[v.record_no]);
  const toggleAllOnPage = () => {
    const next = { ...checked };
    videos.forEach((v) => (next[v.record_no] = !allCheckedOnPage));
    setChecked(next);
  };

  // 선택 삭제 (서버 삭제 호출 후 재조회)
  const handleDeleteSelected = async () => {
    const ids = Object.entries(checked)
      .filter(([, val]) => val)
      .map(([k]) => +k);

    if (ids.length === 0) return alert("삭제할 영상을 선택하세요.");

    if (!window.confirm(`${ids.length}개 영상을 삭제할까요?`)) return;

    try {
      setLoading(true);
      await Promise.all(
        ids.map((id) =>
          fetch(`${API_BASE}/homecam/camlist/${id}`, { method: "DELETE" }).then((r) => {
            if (!r.ok) throw new Error(`삭제 실패: ${id}`);
            return r.json();
          })
        )
      );
      alert("삭제 완료");
      setChecked({});
      // 현재 페이지 다시 조회 (빈 페이지가 되면 서버가 알아서 totalPages 계산)
      fetchVideos(page, query.trim());
    } catch (err) {
      console.error(err);
      alert("삭제 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 페이지 이동
  const goPage = (n) => {
    if (n < 1 || n > totalPages) return;
    fetchVideos(n, query.trim());
    // 스크롤 올리기
    const scroller = document.querySelector(".hc-content");
    if (scroller) scroller.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // 상세로 이동 (공통)
  const goDetail = (record_no) => navigate(`/homecam/camlist/${record_no}`);

  return (
    <div className="hc-wrap">
      {/* 상단: 제목 + 검색 + 삭제 */}
      <div className="hc-header-row">
        <h2 className="hc-title">저장된 영상</h2>

        {/* 🔄 F&Q 같은 구조: input + img (돋보기), 휴지통은 바깥 */}
        <div className="hc-search-row">
          <div className="hc-search">
            <input
              placeholder="YYYY-MM-DD 로 검색"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSearch()}
              aria-label="영상 날짜 검색"
            />
            <img
              className="hc-search-icon"
              src="/icons/search.svg"
              alt="검색"
              onClick={onSearch}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSearch()}
            />
          </div>

          <button
            className="hc-trash"
            type="button"
            onClick={handleDeleteSelected}
            title="선택 삭제"
            aria-label="선택 삭제"
          >
            <img src="/icons/trash.svg" alt="delete" />
          </button>
        </div>
      </div>

      {/* 컨텐츠 박스 */}
      <section className="hc-content">
        <div className="hc-toolbar">
          <label className="hc-checkbox">
            <input
              type="checkbox"
              checked={allCheckedOnPage}
              onChange={toggleAllOnPage}
            />
            <span>현재 페이지 전체 선택</span>
          </label>
        </div>

        {loading ? (
          <div className="hc-loading">불러오는 중...</div>
        ) : (
          <>
            <div className="hc-grid">
              {videos.map((v) => (
                <article
                  key={v.record_no}
                  className="hc-card"
                  onClick={() => goDetail(v.record_no)}        // ⬅ 카드 클릭
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) =>
                    (e.key === "Enter" || e.key === " ") && goDetail(v.record_no)
                  }
                >
                  <label
                    className="hc-card-check"
                    onClick={(e) => e.stopPropagation()}        // 체크박스만 예외
                  >
                    <input
                      type="checkbox"
                      checked={!!checked[v.record_no]}
                      onChange={() => toggleCheck(v.record_no)}
                      aria-label={`${v.record_no} 선택`}
                    />
                  </label>

                  <div className="hc-thumb">
                    {v.snapshot_url ? (
                      <img
                        src={v.snapshot_url}
                        alt="thumbnail"
                        onClick={() => goDetail(v.record_no)}   // ⬅ 썸네일 클릭
                      />
                    ) : (
                      <div className="hc-thumb-ph" />
                    )}

                    {/* 상태 배지 (placeholder 통일 중이면 CSS에서 숨김 처리됨) */}
                    <div className="hc-badge">{v.cam_url ? "파일있음" : "파일없음"}</div>
                  </div>

                  <hr className="hc-sep" />
                  <time className="hc-date">
                    {v.r_start ? new Date(v.r_start).toLocaleString() : "-"}
                  </time>
                </article>
              ))}
            </div>

            {/* 서버 페이지네이션 */}
            <div className="hc-paging">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  className={`hc-page-btn ${n === page ? "active" : ""}`}
                  onClick={() => goPage(n)}
                  aria-current={n === page ? "page" : undefined}
                  type="button"
                >
                  {n}
                </button>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
