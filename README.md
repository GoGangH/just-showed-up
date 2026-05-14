# 일단옴

모임 전에 각자의 주간 기록을 남기고, 모임 뒤에는 작성자 정보가 DB에 남지 않는 익명 피드백을 받는 반응형 웹 서비스입니다.

Project slug: `just-showed-up`

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth, Postgres, RLS, Storage

## Core Loops

- 그룹 생성 및 초대 코드 참여
- 그룹별 기본 모임 시간과 장소 설정
- 이번 주만 일정 재조율
- Markdown 주간 기록 작성
- Notion, 블로그, 문서 링크 미리보기
- PDF/이미지 첨부
- 익명 댓글과 익명 반응

## Local Setup

```bash
bun install
cp .env.example .env.local
bun run dev
```

Supabase 프로젝트를 만든 뒤 `.env.local`에 값을 채우고 `supabase/migrations`의 SQL을 적용합니다.
배포 환경에서는 `NEXT_PUBLIC_SITE_URL`을 실제 서비스 주소로 설정합니다. 이 값이 없으면 Vercel의
`VERCEL_PROJECT_PRODUCTION_URL` 또는 `VERCEL_URL`을 fallback으로 사용합니다.

```text
NEXT_PUBLIC_SITE_URL=https://just-showed-up.vercel.app
```

## Supabase Setup

1. Supabase SQL Editor에서 `supabase/migrations/0001_initial_schema.sql` 내용을 실행합니다.
2. Authentication URL 설정에 로컬/프로덕션 콜백 URL을 추가합니다.

```text
http://127.0.0.1:3000/auth/callback
https://just-showed-up.vercel.app/auth/callback
```

3. Authentication > Providers에서 사용할 OAuth provider를 활성화합니다.

초기 UI는 Kakao, Google, GitHub 로그인을 제공합니다. 각 provider의 callback URL은 Supabase
대시보드 안내에 맞춰 설정해야 합니다.
