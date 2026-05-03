import { AppModal } from "@/components/AppModal";
import { FeedPreview } from "@/components/FeedPreview";
import { MeetingCard } from "@/components/MeetingCard";
import { PostComposer } from "@/components/PostComposer";
import { Sidebar } from "@/components/Sidebar";
import { GroupJoinForm } from "@/app/groups/join/GroupJoinForm";
import { GroupCreateForm } from "@/app/groups/new/GroupCreateForm";
import { LoginForm } from "@/app/login/LoginForm";
import { CalendarDays, CheckCircle2, LogIn, MessageCircle, UserRound } from "lucide-react";
import Link from "next/link";
import { getHomeData } from "./home-data";

type HomeProps = {
  searchParams: Promise<{
    modal?: string;
  }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const { modal } = await searchParams;
  const homeData = await getHomeData();
  const activeGroup = homeData.groups[0] ?? null;

  return (
    <main className="flex min-h-screen">
      <Sidebar user={homeData.user} />
      <div className="w-full">
        <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl font-bold">일단옴</p>
              <p className="text-xs text-neutral-600">쉬었음청년 스터디</p>
            </div>
            {homeData.user ? (
              <Link className="rounded-md border border-neutral-200 bg-white p-2" href="/logout">
                <UserRound size={18} />
              </Link>
            ) : (
              <Link className="rounded-md border border-neutral-200 bg-white p-2" href="/?modal=login">
                <LogIn size={18} />
              </Link>
            )}
          </div>
        </header>

        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8">
          <div className="space-y-6">
            <section className="rounded-lg border border-neutral-200 bg-white p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-neutral-500">
                    {homeData.user ? "현재 그룹" : "서비스 준비"}
                  </p>
                  <h1 className="mt-2 text-3xl font-semibold tracking-normal">
                    {activeGroup?.name ?? "쉬었음청년 스터디"}
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600">
                    주간 모임 전에 기록과 자료를 공유하고, 모임 후에는 익명으로 피드백을 남깁니다.
                  </p>
                </div>
              </div>
            </section>

            {!homeData.configured ? (
              <section className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
                <p className="font-semibold">Supabase 연결 정보가 필요합니다.</p>
                <p className="mt-1">
                  `.env.local`에 Supabase URL과 publishable key를 설정하면 로그인과 그룹 기능을 사용할 수
                  있습니다.
                </p>
              </section>
            ) : null}

            {homeData.error ? (
              <section className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm leading-6 text-red-700">
                {homeData.error}
              </section>
            ) : null}

            {homeData.configured && !homeData.user ? (
              <section className="rounded-lg border border-neutral-200 bg-white p-5">
                <h2 className="text-xl font-semibold">로그인이 필요합니다</h2>
                <p className="mt-2 text-sm leading-6 text-neutral-600">
                  내비게이션의 로그인 버튼으로 계정에 접속한 뒤 그룹을 만들거나 초대 코드로 참여할 수 있습니다.
                </p>
              </section>
            ) : null}

            {homeData.user && !activeGroup ? (
              <section className="rounded-lg border border-neutral-200 bg-white p-5">
                <h2 className="text-xl font-semibold">아직 참여한 그룹이 없습니다</h2>
                <p className="mt-2 text-sm leading-6 text-neutral-600">
                  새 스터디 그룹을 만들거나 받은 초대 코드로 기존 그룹에 참여하세요.
                </p>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <Link
                    className="rounded-md bg-neutral-900 px-4 py-2 text-center text-sm font-semibold text-white"
                    href="/?modal=new-group"
                  >
                    그룹 만들기
                  </Link>
                  <Link
                    className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-center text-sm font-semibold text-neutral-700"
                    href="/?modal=join-group"
                  >
                    초대 코드 참여
                  </Link>
                </div>
              </section>
            ) : null}

            {activeGroup ? (
              <>
                <MeetingCard group={activeGroup} />
                <PostComposer groupId={activeGroup.id} />
                <FeedPreview posts={homeData.posts} />
              </>
            ) : null}
          </div>

          <aside className="space-y-4">
            <section className="rounded-lg border border-neutral-200 bg-white p-5">
              <p className="text-sm font-semibold text-neutral-500">이번 주 현황</p>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between rounded-md bg-neutral-50 p-3">
                  <span className="inline-flex items-center gap-2 text-sm font-semibold">
                    <CheckCircle2 size={16} />
                    공유글
                  </span>
                  <strong>{activeGroup ? "0" : "-"}</strong>
                </div>
                <div className="flex items-center justify-between rounded-md bg-neutral-50 p-3">
                  <span className="inline-flex items-center gap-2 text-sm font-semibold">
                    <CalendarDays size={16} />
                    일정 응답
                  </span>
                  <strong>{activeGroup ? "0" : "-"}</strong>
                </div>
                <div className="flex items-center justify-between rounded-md bg-neutral-50 p-3">
                  <span className="inline-flex items-center gap-2 text-sm font-semibold">
                    <MessageCircle size={16} />
                    익명 댓글
                  </span>
                  <strong>{activeGroup ? "0" : "-"}</strong>
                </div>
              </div>
            </section>

            {activeGroup ? (
              <section className="rounded-lg border border-neutral-200 bg-white p-5">
                <p className="text-sm font-semibold text-neutral-500">초대 코드</p>
                <p className="mt-3 rounded-md bg-neutral-50 px-3 py-2 font-mono text-sm">
                  {activeGroup.invite_code}
                </p>
              </section>
            ) : null}

            <section className="rounded-lg border border-neutral-200 bg-white p-5">
              <p className="text-sm font-semibold text-neutral-500">익명 피드백</p>
              <p className="mt-3 text-sm leading-6 text-neutral-700">
                댓글과 반응에는 작성자 컬럼을 만들지 않습니다. 서버는 그룹 멤버 여부만 확인하고 DB에는
                본문과 대상 글만 저장합니다.
              </p>
            </section>
          </aside>
        </div>
      </div>

      {modal === "login" ? (
        <AppModal
          description="OAuth 계정으로 로그인하고 그룹의 주간 기록과 모임 일정을 관리합니다."
          title="로그인"
        >
          <LoginForm />
        </AppModal>
      ) : null}

      {modal === "new-group" ? (
        <AppModal
          description="기본 모임 시간과 장소를 설정해두면 매주 같은 기준으로 스터디를 운영할 수 있습니다."
          title="그룹 만들기"
        >
          {homeData.user ? (
            <GroupCreateForm />
          ) : (
            <div className="space-y-4">
              <p className="text-sm leading-6 text-neutral-600">그룹을 만들려면 먼저 로그인해주세요.</p>
              <LoginForm />
            </div>
          )}
        </AppModal>
      ) : null}

      {modal === "join-group" ? (
        <AppModal
          description="그룹 관리자에게 받은 초대 코드를 입력하면 스터디 그룹에 참여할 수 있습니다."
          title="초대 코드로 참여"
        >
          {homeData.user ? (
            <GroupJoinForm />
          ) : (
            <div className="space-y-4">
              <p className="text-sm leading-6 text-neutral-600">그룹에 참여하려면 먼저 로그인해주세요.</p>
              <LoginForm />
            </div>
          )}
        </AppModal>
      ) : null}
    </main>
  );
}
