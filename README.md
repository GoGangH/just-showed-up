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
- 그룹장 위임 및 그룹 탈퇴
- 글, 댓글, 일정 재조율 알림

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

자주 쓰는 검증 명령입니다.

```bash
bun run typecheck
bun run build:verify
```

`build:verify`는 개발 서버의 `.next` 캐시와 섞이지 않도록 `.next-build`에 검증 빌드를 만듭니다.

## Supabase Setup

Supabase SQL Editor에서 `supabase/migrations`의 SQL을 번호 순서대로 실행합니다.

```text
0001_initial_schema.sql
0002_notifications.sql
0003_post_attachment_storage.sql
0004_allow_pdf_attachments.sql
0005_leave_group.sql
0006_performance_indexes.sql
0007_transfer_group_ownership.sql
0008_reschedule_responses.sql
```

Authentication URL 설정에 로컬/프로덕션 콜백 URL을 추가합니다.

```text
http://127.0.0.1:3000/auth/callback
http://localhost:3000/auth/callback
https://just-showed-up.vercel.app/auth/callback
```

Authentication > Providers에서 사용할 OAuth provider를 활성화합니다.

초기 UI는 Kakao, Google, GitHub 로그인을 제공합니다. 각 provider의 callback URL은 Supabase
대시보드 안내에 맞춰 설정해야 합니다.

## Storage

첨부 파일은 `post-attachments` 버킷을 사용합니다. `0003_post_attachment_storage.sql`에서 버킷과
RLS policy를 생성하고, `0004_allow_pdf_attachments.sql`에서 PDF 업로드를 허용합니다.

현재 제한값은 앱 코드 기준입니다.

- 이미지: `image/gif`, `image/jpeg`, `image/png`, `image/webp`, 파일당 5MB
- PDF: `application/pdf`, 파일당 20MB
- 글 하나당 첨부 최대 5개

## Privacy Notes

`anonymous_comments`와 `anonymous_reactions` 테이블에는 의도적으로 `author_id` 또는 `user_id`가 없습니다.
댓글/반응 작성 가능 여부는 작성 시점의 그룹 멤버십으로만 검사하고, 저장된 row에는 작성자 추적 정보가
남지 않아야 합니다.
