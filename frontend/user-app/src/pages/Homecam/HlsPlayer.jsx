// src/components/HlsPlayer.jsx
import React, { useEffect, useRef } from 'react';

// Safari(모바일 포함)는 video가 HLS(m3u8) 직접 재생 가능
// 그 외 브라우저(크롬/엣지/파폭)는 hls.js 필요
export default function HlsPlayer({ src, controls = true, autoPlay = true, muted = true, style = {} }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    const canNative = video.canPlayType('application/vnd.apple.mpegurl');
    let hls;

    if (canNative) {
      // Safari 계열
      video.src = src;
    } else {
      // 기타 브라우저: hls.js 동적 import
      import('hls.js').then(({ default: Hls }) => {
        if (Hls.isSupported()) {
          hls = new Hls({ enableWorker: true, lowLatencyMode: true });
          hls.loadSource(src);
          hls.attachMedia(video);
        } else {
          console.error('HLS not supported');
        }
      });
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [src]);

  return (
    <video
      ref={videoRef}
      className="hc-live-video" 
      controls={controls}
      autoPlay={autoPlay}
      muted={muted}
      playsInline
      style={{ width: '100%', height: '100%', background: '#000', ...style }}
    />
  );
  
}
