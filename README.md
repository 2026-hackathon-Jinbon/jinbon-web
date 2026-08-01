# jinbon-web

영상 파일의 원본 해시, 블록체인 등록 기록, OpenDID 자격증명을 교차 검증하는 웹 서비스입니다. 업로드한 원본 영상은 백엔드에 저장하지 않습니다.

## 실행

Node.js 22 이상이 필요합니다.

```bash
cp .env.example .env.local
npm install
npm run dev
```

- 프론트엔드: `http://localhost:8071`
- 백엔드 기본 주소: `http://localhost:8070`
- 백엔드 주소 변경: `.env.local`의 `NEXT_PUBLIC_API_BASE_URL` 수정

## 주요 구조

```text
app/
  layout.tsx       메타데이터와 공통 레이아웃
  page.tsx         영상 선택, 업로드, 검증 결과 UI
  globals.css      반응형 디자인 시스템
public/            정적 파일
tests/             서버 렌더링 검증
.openai/           호스팅 구성
```

영상 검증 요청은 `multipart/form-data`의 `file` 필드로 백엔드 `POST /api/verify`에 전송합니다.
