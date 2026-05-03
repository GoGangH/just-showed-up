import { CalendarClock, MapPin, RotateCcw, UsersRound } from "lucide-react";

const slots = [
  { label: "월 20:00", count: 3 },
  { label: "화 21:00", count: 5 },
  { label: "수 21:00", count: 4 },
  { label: "목 20:00", count: 2 },
];

export function MeetingCard() {
  return (
    <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-berry">이번 주 모임</p>
          <h2 className="mt-2 text-2xl font-bold tracking-normal">수요일 오후 9:00</h2>
          <div className="mt-3 flex flex-wrap gap-2 text-sm text-neutral-600">
            <span className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1">
              <CalendarClock size={15} />
              5월 둘째 주
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1">
              <MapPin size={15} />
              온라인 · Discord 또는 모임 링크
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white">
            참석 가능
          </button>
          <button className="rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold">
            이번 주 어려워요
          </button>
        </div>
      </div>

      <div className="mt-5 rounded-md border border-dashed border-line bg-paper p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-2 text-sm font-semibold">
              <RotateCcw size={16} />
              재조율 예시
            </p>
            <p className="mt-1 text-sm text-neutral-600">가능 시간이 겹치는 슬롯을 자동으로 추천합니다.</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-mint/10 px-3 py-1 text-sm font-semibold text-mint">
            <UsersRound size={15} /> 5명 가능
          </span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {slots.map((slot) => (
            <button
              className={`rounded-md border px-3 py-2 text-left text-sm ${
                slot.count === 5
                  ? "border-mint bg-mint/10 text-mint"
                  : "border-line bg-white text-neutral-700"
              }`}
              key={slot.label}
            >
              <span className="block font-semibold">{slot.label}</span>
              <span className="text-xs">{slot.count}명 가능</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
