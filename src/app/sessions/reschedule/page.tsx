import Link from "next/link";
import { RescheduleForm } from "./RescheduleForm";

type ReschedulePageProps = {
  searchParams: Promise<{
    group?: string;
  }>;
};

export default async function ReschedulePage({ searchParams }: ReschedulePageProps) {
  const { group } = await searchParams;

  return (
    <main className="min-h-screen px-4 py-8">
      <section className="mx-auto max-w-3xl rounded-lg border border-neutral-200 bg-white p-6">
        <Link className="text-sm font-semibold text-neutral-500" href="/">
          일단옴
        </Link>
        <h1 className="mt-3 text-2xl font-semibold">이번 주 일정 재조율</h1>
        <p className="mt-2 text-sm leading-6 text-neutral-600">
          기본 모임 시간이 어려울 때 후보 시간을 등록하고 그룹원이 가능한 시간을 선택할 수 있게 합니다.
        </p>

        {!group ? (
          <div className="mt-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            그룹 정보가 없습니다. 홈에서 그룹을 선택한 뒤 다시 시도해주세요.
          </div>
        ) : (
          <div className="mt-6">
            <RescheduleForm groupId={group} />
          </div>
        )}
      </section>
    </main>
  );
}
