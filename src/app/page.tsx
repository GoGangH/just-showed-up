import { FeedPreview } from "@/components/FeedPreview";
import { MeetingCard } from "@/components/MeetingCard";
import { PostComposer } from "@/components/PostComposer";
import { Sidebar } from "@/components/Sidebar";
import { Bell, CalendarDays, CheckCircle2 } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen">
      <Sidebar />
      <div className="w-full">
        <header className="sticky top-0 z-10 border-b border-line bg-paper/90 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl font-black">일단옴</p>
              <p className="text-xs text-neutral-600">모임 전 기록 남기기</p>
            </div>
            <button className="rounded-md border border-line bg-white p-2">
              <Bell size={18} />
            </button>
          </div>
        </header>

        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8">
          <div className="space-y-6">
            <section className="rounded-lg border border-line bg-ink p-6 text-white shadow-soft">
              <p className="text-sm font-semibold text-sun">쉬었음 스터디</p>
              <h1 className="mt-3 text-3xl font-black tracking-normal sm:text-4xl">
                이번 주도 일단 왔고,
                <br />
                기록은 남겨봄
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/75">
                주간 모임 전에 Markdown 기록, Notion 링크, PDF 자료를 공유하고 모임 뒤에는 작성자
                정보가 남지 않는 익명 피드백을 받습니다.
              </p>
            </section>

            <MeetingCard />
            <PostComposer />
            <FeedPreview />
          </div>

          <aside className="space-y-4">
            <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
              <p className="text-sm font-semibold text-berry">이번 주 현황</p>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between rounded-md bg-paper p-3">
                  <span className="inline-flex items-center gap-2 text-sm font-semibold">
                    <CheckCircle2 size={16} />
                    공유글
                  </span>
                  <strong>5/7</strong>
                </div>
                <div className="flex items-center justify-between rounded-md bg-paper p-3">
                  <span className="inline-flex items-center gap-2 text-sm font-semibold">
                    <CalendarDays size={16} />
                    일정 응답
                  </span>
                  <strong>6/7</strong>
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
              <p className="text-sm font-semibold text-berry">익명 피드백 원칙</p>
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
