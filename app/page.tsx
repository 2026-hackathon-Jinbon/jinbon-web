"use client";

import { ChangeEvent, DragEvent, useEffect, useMemo, useRef, useState } from "react";

type DisplayStatus = "AUTHENTICATED" | "NOT_AUTHENTICATED" | "UNAVAILABLE";

type VerificationResult = {
  verdict: string;
  displayStatus: DisplayStatus;
  similarityDistance: number | null;
  authentic: boolean;
  videoId: number | null;
  issuerDid: string | null;
  registeredAt: string | null;
  blockchainVerified: boolean;
  vcVerified: boolean;
  active: boolean;
  message: string;
  notice: string | null;
};

type ApiResponse = {
  status: number;
  code?: string;
  message: string;
  data?: VerificationResult;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8070";
const MAX_FILE_SIZE = 100 * 1024 * 1024;

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(value: string | null) {
  if (!value) return "확인되지 않음";
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function Home() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VerificationResult | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const resultTone = useMemo(() => {
    if (!result) return "neutral";
    const status = result.displayStatus;
    if (status === "AUTHENTICATED") return "authentic";
    if (status === "UNAVAILABLE") return "warning";
    return "unknown";
  }, [result]);

  function selectFile(nextFile?: File) {
    setError(null);
    setResult(null);
    if (!nextFile) return;
    if (!nextFile.type.startsWith("video/")) {
      setError("영상 파일만 선택할 수 있습니다.");
      return;
    }
    if (nextFile.size > MAX_FILE_SIZE) {
      setError("파일 크기는 최대 100MB까지 가능합니다.");
      return;
    }
    setFile(nextFile);
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    selectFile(event.target.files?.[0]);
    event.target.value = "";
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    selectFile(event.dataTransfer.files?.[0]);
  }

  async function verifyVideo() {
    if (!file || isVerifying) return;
    setIsVerifying(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(`${API_BASE_URL}/api/verify`, {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json().catch(() => null)) as ApiResponse | null;
      if (!response.ok || !payload?.data) {
        throw new Error(payload?.message || "검증 서버가 요청을 처리하지 못했습니다.");
      }
      setResult(payload.data);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "알 수 없는 오류가 발생했습니다.";
      setError(
        message === "Failed to fetch"
          ? "검증 서버에 연결할 수 없습니다. 백엔드가 8070 포트에서 실행 중인지 확인해 주세요."
          : message,
      );
    } finally {
      setIsVerifying(false);
    }
  }

  function reset() {
    setFile(null);
    setResult(null);
    setError(null);
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="진본 홈">
          <span className="brand-mark">眞</span>
          <span>진본</span>
        </a>
        <div className="header-status"><span /> 블록체인 검증 네트워크 연결됨</div>
      </header>

      <section className="hero" id="top">
        <div className="eyebrow">ORIGINALITY, VERIFIED</div>
        <h1>이 영상은<br /><em>진짜일까요?</em></h1>
        <p className="hero-copy">
          영상을 올리면 원본 해시와 블록체인 기록, 디지털 자격증명을 교차 검증해
          등록된 진본 여부를 확인합니다.
        </p>

        <div className="verifier-shell">
          <div className="step-rail" aria-label="검증 단계">
            <div className={!result ? "active" : "done"}><span>01</span><strong>영상 선택</strong></div>
            <div className={isVerifying ? "active" : result ? "done" : ""}><span>02</span><strong>무결성 분석</strong></div>
            <div className={result ? "active" : ""}><span>03</span><strong>결과 확인</strong></div>
          </div>

          {!result ? (
            <div className="workspace">
              <div
                className={`drop-zone ${isDragging ? "dragging" : ""} ${file ? "has-file" : ""}`}
                onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }}
                onDragOver={(event) => event.preventDefault()}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
              >
                {file && previewUrl ? (
                  <div className="file-preview">
                    <video src={previewUrl} controls preload="metadata" />
                    <div className="file-meta">
                      <div><span className="file-icon">▶</span><div><strong>{file.name}</strong><small>{formatBytes(file.size)} · {file.type || "video"}</small></div></div>
                      <button type="button" onClick={reset} aria-label="선택한 영상 제거">×</button>
                    </div>
                  </div>
                ) : (
                  <button className="drop-prompt" type="button" onClick={() => inputRef.current?.click()}>
                    <span className="upload-symbol">↑</span>
                    <strong>확인할 영상을 올려주세요</strong>
                    <small>여기로 끌어다 놓거나 눌러서 파일 선택</small>
                    <span className="file-rule">MP4 · MOV · AVI · 최대 100MB</span>
                  </button>
                )}
                <input ref={inputRef} type="file" accept="video/*" onChange={onFileChange} hidden />
              </div>

              {error && <div className="error-message" role="alert">{error}</div>}

              <div className="action-row">
                <div className="privacy-note"><span>✓</span> 영상 원본은 서버에 저장되지 않습니다.</div>
                <button className="verify-button" type="button" disabled={!file || isVerifying} onClick={verifyVideo}>
                  {isVerifying ? <><span className="spinner" /> 진본 기록 대조 중</> : <>진본 여부 확인하기 <span>→</span></>}
                </button>
              </div>
            </div>
          ) : (
            <div className={`result-panel ${resultTone}`}>
              <div className="result-summary">
                <div className="result-seal">{resultTone === "authentic" ? "✓" : resultTone === "unknown" ? "?" : "!"}</div>
                <div>
                  <span className="result-kicker">VERIFICATION COMPLETE</span>
                  <h2>{resultTone === "authentic" ? "진본 인증" : resultTone === "unknown" ? "미인증" : "확인 중"}</h2>
                  <p>{result.message}</p>
                </div>
              </div>

              {result.registeredAt && (
                <div className="evidence-grid">
                  <div><span>등록일</span><strong>{formatDate(result.registeredAt)}</strong></div>
                </div>
              )}

              {result.notice && <p className="result-notice">※ {result.notice}</p>}
              <button className="again-button" type="button" onClick={reset}>다른 영상 확인하기</button>
            </div>
          )}
        </div>
      </section>

      <section className="trust-strip" aria-label="검증 방식">
        <div><span>01</span><strong>파일 지문 생성</strong><p>원본 파일과 프레임의 고유한 해시를 계산합니다.</p></div>
        <div><span>02</span><strong>분산 원장 대조</strong><p>변경 불가능한 블록체인 등록 기록을 조회합니다.</p></div>
        <div><span>03</span><strong>VC 교차 검증</strong><p>발급자의 OpenDID 자격증명 유효성을 확인합니다.</p></div>
      </section>

      <footer><span>© 2026 JINBON</span><p>기술로 증명하는 콘텐츠의 진실</p></footer>
    </main>
  );
}
