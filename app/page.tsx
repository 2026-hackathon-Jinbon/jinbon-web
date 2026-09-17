"use client";

import Image from "next/image";
import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";

type VerificationResult = {
  displayStatus: "AUTHENTICATED" | "CONTENT_SIMILAR" | "PARTIAL_SIMILAR" | "NOT_AUTHENTICATED" | "UNAVAILABLE";
  verdict?: string;
  registrantName?: string | null;
  videoId?: number | null;
  blockchainVerified?: boolean;
  vcVerified?: boolean;
  vcClaimsBound?: boolean;
  registeredAt: string | null;
  message: string;
  notice: string | null;
};

type ApiResponse = { message: string; data?: VerificationResult };
type VerifyMode = "file" | "url";
type IconName = "shield" | "upload" | "arrow" | "lock" | "file" | "fingerprint" | "link" | "check" | "close" | "globe";

function Icon({ name, className = "" }: { name: IconName; className?: string }) {
  const paths: Record<IconName, React.ReactNode> = {
    shield: <><path d="M12 3 4 6v6c0 4 4 7 8 9 4-2 8-5 8-9V6l-8-3Z" /><path d="m8.5 12 2.3 2.3 4.7-4.8" /></>,
    upload: <><path d="M12 16V3m-5 5 5-5 5 5M4 15v5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5" /></>,
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
    lock: <><rect x="5" y="10" width="14" height="11" rx="3" /><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2" /></>,
    file: <><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Zm0 0v6h6" /><path d="m10 12 5 3-5 3v-6Z" /></>,
    fingerprint: <><path d="M5 9a7 7 0 0 1 14 0v4m-17 0V9a10 10 0 0 1 20 0M5 13v2c0 2-1 4-2 5m5-4v-6a4 4 0 0 1 8 0v5c0 3 1 5 2 6m-6-11v7c0 2-1 4-2 5m5 0-1-3" /></>,
    link: <><path d="m10 13 4-4m-6 6-2 2a4 4 0 0 1-5-6l5-5a4 4 0 0 1 6 0m0 12a4 4 0 0 0 6 0l5-5a4 4 0 0 0-6-5l-2 2" transform="translate(1 0) scale(.92)" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    globe: <><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></>,
    close: <path d="m6 6 12 12M6 18 18 6" />,
  };
  return <svg className={`icon ${className}`} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://3.34.244.155.sslip.io";
const MAX_FILE_SIZE = 100 * 1024 * 1024;
const MAX_URL_LENGTH = 2048;
const SUPPORTED_PLATFORMS = ["YouTube", "Instagram", "TikTok", "X(Twitter)", "Vimeo"];
const steps = ["영상 선택", "기록 대조", "결과 확인"];
const methods: { icon: IconName; title: string; label: string; description: string }[] = [
  { icon: "fingerprint", title: "영상의 고유한 흔적을 찾고", label: "DIGITAL FINGERPRINT", description: "파일과 프레임의 고유한 해시를 분석해 등록된 원본과 비교합니다." },
  { icon: "link", title: "기록으로 한 번 더 확인하고", label: "BLOCKCHAIN RECORD", description: "블록체인에 남겨진 등록 기록을 대조해 영상의 무결성을 확인합니다." },
  { icon: "shield", title: "자격증명까지 교차 검증해요", label: "VERIFIABLE CREDENTIAL", description: "OpenDID 디지털 자격증명의 유효성을 확인해 검증의 근거를 더합니다." },
];
const faqs = [
  { question: "공인 등록자는 누구인가요?", answer: "모바일 신분증으로 본인확인을 완료한 진본 등록자입니다. 기관 소속이나 공식 발행 권한을 별도로 인증했다는 뜻은 아닙니다." },
  { question: "진본은 무엇을 확인하는 서비스인가요?", answer: "선택한 영상이 진본에 등록된 원본과 일치하는지 확인하는 서비스입니다. 파일·프레임 해시, 블록체인 등록 기록, OpenDID 디지털 자격증명을 교차 검증합니다. 영상에 담긴 사건이나 주장 자체가 사실인지를 판단하는 서비스는 아닙니다." },
  { question: "‘미인증’이면 가짜 영상인가요?", answer: "아니요. 아직 등록되지 않았거나, 자격증명을 확인할 수 없는 경우에도 미인증으로 표시될 수 있습니다. 미인증이 곧 위조나 딥페이크를 의미하지는 않습니다. 결과와 함께 제공되는 설명을 확인해 주세요." },
  { question: "업로드한 영상은 어떻게 처리되나요?", answer: "선택한 영상은 검증을 위해 서버로 전송됩니다. 영상 원본은 서버에 저장하지 않으며, 파일과 프레임을 분석해 기존 등록 기록과 대조합니다." },
  { question: "어떤 영상을 확인할 수 있나요?", answer: "MP4, MOV, AVI 등의 영상 파일을 최대 100MB까지 직접 업로드하거나, YouTube·Instagram·TikTok·X(Twitter)·Vimeo URL을 입력해 확인할 수 있습니다. URL 검증은 서버에서 전체 영상을 다운로드해 분석하므로 더 정밀한 프레임 비교가 가능합니다." },
];

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "long", timeStyle: "short" }).format(new Date(value));
}

export default function Home() {
  const inputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLHeadingElement>(null);
  const [mode, setMode] = useState<VerifyMode>("file");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [url, setUrl] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VerificationResult | null>(null);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  useEffect(() => { if (result) resultRef.current?.focus(); }, [result]);

  function switchMode(next: VerifyMode) {
    if (isVerifying || next === mode) return;
    setMode(next);
    setError(null);
    setResult(null);
    setFile(null);
    setPreviewUrl(null);
    setUrl("");
  }

  function selectFile(nextFile?: File) {
    if (isVerifying || !nextFile) return;
    setError(null);
    if (!nextFile.type.startsWith("video/")) { setError("영상 파일만 선택할 수 있습니다."); return; }
    if (nextFile.size > MAX_FILE_SIZE) { setError("파일 크기는 최대 100MB까지 가능합니다."); return; }
    setResult(null);
    setFile(nextFile);
    setPreviewUrl(URL.createObjectURL(nextFile));
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

  function validateUrl(): string | null {
    const trimmed = url.trim();
    if (!trimmed) return "URL을 입력해 주세요.";
    if (trimmed.length > MAX_URL_LENGTH) return "URL은 최대 2,048자까지 가능합니다.";
    try { const parsed = new URL(trimmed); if (parsed.protocol !== "https:") return "HTTPS URL만 지원합니다."; } catch { return "올바른 URL 형식이 아닙니다."; }
    return null;
  }

  async function verifyVideo() {
    if (mode === "file" && !file) return;
    if (mode === "url") {
      const urlError = validateUrl();
      if (urlError) { setError(urlError); return; }
    }
    if (isVerifying) return;
    setIsVerifying(true);
    setError(null);
    setResult(null);
    try {
      let response: Response;
      if (mode === "file") {
        const formData = new FormData();
        formData.append("file", file!);
        response = await fetch(`${API_BASE_URL}/api/verify`, { method: "POST", body: formData });
      } else {
        response = await fetch(`${API_BASE_URL}/api/verify/url`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: url.trim() }) });
      }
      const payload = (await response.json().catch(() => null)) as ApiResponse | null;
      if (!response.ok || !payload?.data) throw new Error(payload?.message || "검증 서버가 요청을 처리하지 못했습니다.");
      setResult(payload.data);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "알 수 없는 오류가 발생했습니다.";
      setError(message === "Failed to fetch" ? "검증 서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요." : message);
    } finally { setIsVerifying(false); }
  }

  function reset() { setFile(null); setPreviewUrl(null); setUrl(""); setResult(null); setError(null); }

  const hasInput = mode === "file" ? !!file : !!url.trim();
  const currentStep = result ? 2 : isVerifying ? 1 : 0;
  const resultTone = result?.displayStatus === "AUTHENTICATED" ? "authentic" : result?.displayStatus === "UNAVAILABLE" ? "unavailable" : "unknown";

  const comparisonPending = result?.displayStatus === "CONTENT_SIMILAR" || result?.displayStatus === "PARTIAL_SIMILAR";
  const verificationMethod = result?.verdict === "EXACT_MATCH" ? "원본 파일 정확 일치"
    : result?.verdict === "SIMILAR_MATCH" || result?.verdict === "SAME_CONTENT" ? "영상·음성 비교" : null;

  return (
    <>
      <a className="skip-link" href="#verify">영상 확인으로 바로가기</a>
      <header className="site-header">
        <div className="header-inner">
          <a className="brand" href="#top" aria-label="진본 홈"><Image className="brand-mark" src="/jinbon-logo.png" alt="" width={44} height={44} unoptimized /><span>진본<span className="brand-english">JINBON</span></span></a>
          <nav aria-label="주 메뉴"><a href="#how-it-works">검증 원리</a><a href="#faq">자주 묻는 질문</a></nav>
          <a className="header-cta" href="#verify">영상 확인하기 <Icon name="arrow" /></a>
        </div>
      </header>

      <main id="top">
        <section className="hero section-width" aria-labelledby="hero-title">
          <div className="hero-story">
            <div className="eyebrow"><span /> 신뢰할 수 있는 콘텐츠의 시작</div>
            <h1 id="hero-title">이 영상은<br />진짜일까요?<br /><em>기록으로 확인하세요.</em></h1>
            <p className="hero-copy">영상을 믿고 공유하기 전, 출처와 원본을 확인하세요.<br />모바일 신분증 기반 공인 영상 진본 증명 플랫폼.<br className="desktop-break" /> 등록자의 영상 기록과 영상·음성을 함께 확인합니다.</p>
            <a className="text-link" href="#how-it-works">진본은 어떻게 확인하나요? <Icon name="arrow" /></a>
          </div>

          <section className="verifier-shell" id="verify" aria-labelledby="verify-title">
            <div className="verifier-heading"><div><span className="section-label">VERIFY YOUR VIDEO</span><h2 id="verify-title">영상 진본 확인</h2></div><span className="secure-badge"><Icon name="lock" /> 원본 미보관</span></div>
            <ol className="step-rail" aria-label="검증 단계">{steps.map((step, index) => <li key={step} className={index === currentStep ? "active" : index < currentStep ? "done" : ""} aria-current={index === currentStep ? "step" : undefined}><span>{index < currentStep ? <Icon name="check" /> : `0${index + 1}`}</span>{step}</li>)}</ol>
            <input ref={inputRef} type="file" accept="video/*" onChange={onFileChange} disabled={isVerifying} aria-label="확인할 영상 선택" hidden />

            {!result ? (
              <div className="workspace" aria-busy={isVerifying}>
                <div className="mode-tabs" role="tablist" aria-label="검증 방식 선택">
                  <button role="tab" aria-selected={mode === "file"} className={mode === "file" ? "active" : ""} onClick={() => switchMode("file")} disabled={isVerifying}><Icon name="upload" /> 파일 업로드</button>
                  <button role="tab" aria-selected={mode === "url"} className={mode === "url" ? "active" : ""} onClick={() => switchMode("url")} disabled={isVerifying}><Icon name="globe" /> URL 검증</button>
                </div>

                {mode === "file" ? (
                  <div className={`drop-zone ${isDragging && !isVerifying ? "dragging" : ""} ${file ? "has-file" : ""}`} onDragEnter={(event) => { event.preventDefault(); if (!isVerifying) setIsDragging(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsDragging(false); }} onDrop={onDrop}>
                    {file ? <div className="file-preview">
                      {previewUrl && <video src={previewUrl} controls preload="metadata" aria-label="선택한 영상 미리보기" />}
                      <div className="file-meta"><Icon name="file" /><div><strong title={file.name}>{file.name}</strong><small>{formatBytes(file.size)} · 검증할 영상</small></div><button type="button" onClick={reset} disabled={isVerifying} aria-label="선택한 영상 제거"><Icon name="close" /></button></div>
                    </div> : <button className="drop-prompt" type="button" onClick={() => inputRef.current?.click()} aria-describedby="file-rule">
                      <span className="upload-art"><span className="upload-sheet sheet-back" /><span className="upload-sheet"><Icon name="file" /></span><span className="upload-symbol"><Icon name="upload" /></span></span>
                      <strong>확인하고 싶은 영상을 놓아주세요</strong><span className="drop-description">파일을 끌어다 놓거나 아래를 눌러 선택하세요</span><span className="choose-file">영상 파일 선택 <Icon name="upload" /></span><span className="file-rule" id="file-rule">MP4, MOV, AVI 등 · 최대 100MB</span>
                    </button>}
                  </div>
                ) : (
                  <div className="url-input-zone">
                    <div className="url-input-wrap">
                      <Icon name="globe" />
                      <input type="url" className="url-input" placeholder="https://youtube.com/watch?v=..." value={url} onChange={(e) => { setUrl(e.target.value); setError(null); }} onKeyDown={(e) => { if (e.key === "Enter" && !isVerifying) verifyVideo(); }} disabled={isVerifying} aria-label="검증할 영상 URL" />
                      {url && <button type="button" className="url-clear" onClick={() => { setUrl(""); setError(null); }} disabled={isVerifying} aria-label="URL 지우기"><Icon name="close" /></button>}
                    </div>
                    <p className="url-platforms"><Icon name="check" /> 지원 플랫폼: {SUPPORTED_PLATFORMS.join(", ")}</p>
                  </div>
                )}

                {error && <div className="error-message" role="alert">{error}</div>}
                <div className="verification-status" role="status">{isVerifying ? <><span className="spinner" /> {mode === "url" ? "영상을 다운로드하고 기록을 대조하고 있어요. 잠시만 기다려 주세요." : "영상과 등록 기록을 대조하고 있어요. 잠시만 기다려 주세요."}</> : hasInput ? <><Icon name="check" /> {mode === "url" ? "URL이 준비됐어요. 아래 버튼으로 검증을 시작하세요." : "영상이 준비됐어요. 아래 버튼으로 검증을 시작하세요."}</> : mode === "url" ? "영상 URL을 입력하면 진본 여부를 확인할 수 있어요." : "영상을 선택하면 진본 여부를 확인할 수 있어요."}</div>
                <button className="verify-button" type="button" disabled={!hasInput || isVerifying} onClick={verifyVideo}>{isVerifying ? <>진본 기록 대조 중 <span className="spinner" /></> : <>진본 여부 확인하기 <Icon name="arrow" /></>}</button>
              </div>
            ) : (
              <div className={`result-panel ${resultTone}`}>
                <span className="result-seal">{resultTone === "authentic" ? <Icon name="shield" /> : resultTone === "unavailable" ? "!" : "?"}</span>
                <span className="section-label">{resultTone === "unavailable" ? "VERIFICATION UNAVAILABLE" : "VERIFICATION RESULT"}</span>
                <h3 ref={resultRef} tabIndex={-1}>{resultTone === "authentic" ? "진본 확인 완료" : comparisonPending ? "진본 확인 보류" : result?.verdict === "NOT_REGISTERED" ? "등록 기록 없음" : resultTone === "unknown" ? "진본 인증이 확인되지 않았어요" : "지금은 확인할 수 없어요"}</h3>
                <p className="result-message">{result.message}</p>
                <dl className="result-details"><div><dt>확인한 영상</dt><dd title={mode === "url" ? url : file?.name}>{mode === "url" ? url : file?.name}</dd></div>{result.registeredAt && <div><dt>등록 시점</dt><dd>{formatDate(result.registeredAt)}</dd></div>}
                  {result.registrantName && <div><dt>등록자 표시명</dt><dd>{result.registrantName}</dd></div>}
                  {verificationMethod && <div><dt>확인 방식</dt><dd>{verificationMethod}</dd></div>}
                  {result.videoId != null && <div><dt>등록 증거</dt><dd>{result.blockchainVerified && result.vcVerified && result.vcClaimsBound ? "블록체인·등록 보증서 확인됨" : "검증 미완료"}</dd></div>}
                </dl>
                {result.registrantName && <p className="result-notice">등록자 표시명은 기관 소속·직함의 인증을 뜻하지 않습니다.</p>}
                {result.notice && <p className="result-notice">{result.notice}</p>}
                {resultTone === "unknown" && <p className="result-notice">미인증은 위조나 딥페이크 판정을 의미하지 않습니다.</p>}
                {resultTone === "unavailable" && <button className="verify-button" type="button" onClick={verifyVideo}>다시 확인하기 <Icon name="arrow" /></button>}
                <button className={resultTone === "unavailable" ? "again-button" : "verify-button"} type="button" onClick={reset}>다른 영상 확인하기 <Icon name="arrow" /></button>
              </div>
            )}
            <div className="privacy-note"><Icon name="lock" /><span>검증을 위해 전송된 영상 원본은 서버에 저장하지 않습니다.</span></div>
          </section>
        </section>

        <div className="principles section-width" aria-label="서비스 특징"><span>의심에서 확인으로,<br /><strong>진본이 만드는 신뢰</strong></span><div><Icon name="fingerprint" /><span>영상 고유 해시 분석</span></div><div><Icon name="link" /><span>블록체인 기록 대조</span></div><div><Icon name="shield" /><span>OpenDID 자격증명 검증</span></div></div>

        <section className="how-section section-width" id="how-it-works" aria-labelledby="how-title">
          <div className="section-heading"><div><span className="section-label">THE SCIENCE OF TRUST</span><h2 id="how-title">하나의 영상, 세 겹의 확인.</h2></div><p>막연한 추측이 아닌, 서로 다른 근거를 모아<br />등록된 원본과의 연결을 확인합니다.</p></div>
          <div className="method-grid">{methods.map((method, index) => <article className="method-card" key={method.label}><div className="method-top"><span className="method-icon"><Icon name={method.icon} /></span><span className="method-number">0{index + 1}</span></div><span className="method-label">{method.label}</span><h3>{method.title}</h3><p>{method.description}</p></article>)}</div>
          <div className="context-note"><Icon name="shield" /><p><strong>등록 기록을 확인하는 것과, 사실을 판단하는 것은 달라요.</strong><span>진본은 등록된 원본과의 관계를 검증합니다. 영상 속 내용의 사실 여부나 모든 AI 생성·편집 여부를 판정하지는 않습니다.</span></p></div>
        </section>

        <section className="faq-section section-width" id="faq" aria-labelledby="faq-title"><div><span className="section-label">GOOD TO KNOW</span><h2 id="faq-title">궁금한 점이<br /> 있으신가요?</h2><p>확인하기 전에 알아두면 좋은 이야기.</p></div><div className="faq-list">{faqs.map((faq) => <details key={faq.question}><summary>{faq.question}<span className="faq-plus" aria-hidden="true" /></summary><p>{faq.answer}</p></details>)}</div></section>
      </main>

      <footer className="site-footer"><div className="footer-inner section-width"><a className="brand" href="#top" aria-label="진본 홈"><Image className="brand-mark" src="/jinbon-logo.png" alt="" width={44} height={44} unoptimized /><span>진본<span className="brand-english">JINBON</span></span></a><p>콘텐츠에 근거를, 신뢰에 기준을.</p><span className="copyright">© 2026 JINBON</span><a href="#top" className="back-top">맨 위로 ↑</a></div></footer>
    </>
  );
}
