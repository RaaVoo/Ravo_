// src/pages/HomecamList.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./HomecamList.css";

// .env가 비어있어도 로컬로 동작
const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8080";
const PAGE_SIZE = 8;

// 날짜 포맷: 2025년 10월 1일 AM 03:27
function formatAMPM(dateLike) {
  if (!dateLike) return "-";
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return "-";
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  let hh = d.getHours();
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ampm = hh >= 12 ? "PM" : "AM";
  hh = hh % 12 || 12;
  return `${y}년 ${m}월 ${day}일 ${ampm} ${String(hh).padStart(2, "0")}:${mm}`;
}

export default function HomecamList() {
  const navigate = useNavigate();

  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");     // YYYY-MM-DD 권장
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [checked, setChecked] = useState({}); // { [record_no]: true }

  // 목록 조회
  const fetchVideos = async (nextPage = page, date = query.trim()) => {
    try {
      setLoading(true);
      const qp = new URLSearchParams();
      qp.set("page", String(nextPage));
      qp.set("size", String(PAGE_SIZE));
      if (date) qp.set("date", date);

      const res = await fetch(`${API_BASE}/homecam/camlist?${qp.toString()}`);
      if (!res.ok) throw new Error("목록 조회 실패");
      const data = await res.json(); // { page, totalPages, total, videos }

      setVideos(Array.isArray(data.videos) ? data.videos : []);
      const tp = Number.isFinite(data.totalPages)
        ? data.totalPages
        : Math.max(1, Math.ceil((data.total || 0) / PAGE_SIZE));
      setTotalPages(tp);
      setPage(Number.isFinite(data.page) ? data.page : nextPage);
    } catch (err) {
      console.error(err);
      alert("영상 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 검색
  const onSearch = () => {
    fetchVideos(1, query.trim());
    setChecked({});
  };

  // 체크박스
  const toggleCheck = (record_no) =>
    setChecked((prev) => ({ ...prev, [record_no]: !prev[record_no] }));

  const allCheckedOnPage =
    videos.length > 0 && videos.every((v) => checked[v.record_no]);

  const toggleAllOnPage = () => {
    const next = { ...checked };
    videos.forEach((v) => (next[v.record_no] = !allCheckedOnPage));
    setChecked(next);
  };

  // 선택 삭제
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
          fetch(`${API_BASE}/homecam/camlist/${id}`, { method: "DELETE" }).then(
            (r) => {
              if (!r.ok) throw new Error(`삭제 실패: ${id}`);
              return r.json();
            }
          )
        )
      );
      alert("삭제 완료");
      setChecked({});
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
    const scroller = document.querySelector(".hc-content");
    if (scroller) scroller.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // 상세
  const goDetail = (record_no) => navigate(`/homecam/camlist/${record_no}`);

  return (
    <div className="hc-wrap">
      {/* 상단: 제목 + 검색 + 삭제 */}
      <div className="hc-header-row">
        <h2 className="hc-title">저장된 영상</h2>

        <div className="hc-search-row">
          <div className="hc-search">
            <input
              placeholder="Search"
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

      {/* 컨텐츠 */}
      <section className="hc-content">
        <div className="hc-toolbar">
          <label className="hc-checkbox" onClick={(e) => e.stopPropagation()}>
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
                  onClick={() => goDetail(v.record_no)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) =>
                    (e.key === "Enter" || e.key === " ") && goDetail(v.record_no)
                  }
                >
                  <label
                    className="hc-card-check"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={!!checked[v.record_no]}
                      onChange={() => toggleCheck(v.record_no)}
                      aria-label={`${v.record_no} 선택`}
                    />
                  </label>

                  {/* 썸네일: 항상 플레이 아이콘만 */}
                  <div className="hc-thumb hc-thumb--mock" onClick={() => goDetail(v.record_no)}>
  <div className="hc-thumb-face">
    <svg viewBox="0 0 48 48" className="hc-thumb-play" aria-hidden="true">
      {/* 둥근 테두리 */}
      <path
        d="M18 14 L34 24 L18 34 Z"
        fill="none"
        stroke="#d9d9d9"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      {/* 채움 */}
      <path
        d="M18 14 L34 24 L18 34 Z"
        fill="#d9d9d9"
      />
    </svg>
  </div>
</div>



                  <time className="hc-date">{formatAMPM(v.r_start)}</time>
                </article>
              ))}
            </div>

            {/* 페이지네이션 */}
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
