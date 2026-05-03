import { FeedPreview } from "@/components/FeedPreview";
import { MeetingCard } from "@/components/MeetingCard";
import { PostComposer } from "@/components/PostComposer";
import { Sidebar } from "@/components/Sidebar";
import { Bell, CalendarDays, CheckCircle2, MessageCircle } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen">
      <Sidebar />
      <div className="w-full">
        <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl font-bold">일단옴</p>
              <p className="text-xs text-neutral-600">쉬었음청년 스터디</p>
            </div>
            <button className="rounded-md border border-neutral-200 bg-white p-2">
              <Bell size={18} />
            </button>
          </div>
        </header>

        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8">
          <div className="space-y-6">
            <section className="rounded-lg border border-neutral-200 bg-white p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-neutral-500">현재 그룹</p>
                  <h1 className="mt-2 text-3xl font-semibold tracking-normal">쉬었음청년 스터디</h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600">
                    주간 모임 전에 기록과 자료를 공유하고, 모임 후에는 익명으로 피드백을 남깁니다.
                  </p>
                </div>
                <Link
                  className="rounded-md bg-neutral-900 px-4 py-2 text-center text-sm font-semibold text-white"
                  href="/groups/new"
                >
                  그룹 만들기
                </Link>
              </div>
            </section>

            <MeetingCard />
            <PostComposer />
            <FeedPreview />
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
                  <strong>5/7</strong>
                </div>
                <div className="flex items-center justify-between rounded-md bg-neutral-50 p-3">
                  <span className="inline-flex items-center gap-2 text-sm font-semibold">
                    <CalendarDays size={16} />
                    일정 응답
                  </span>
                  <strong>6/7</strong>
                </div>
                <div className="flex items-center justify-between rounded-md bg-neutral-50 p-3">
                  <span className="inline-flex items-center gap-2 text-sm font-semibold">
                    <MessageCircle size={16} />
                    익명 댓글
                  </span>
                  <strong>12</strong>
                </div>
              </div>
            </section>

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
    </main>
  );
}
