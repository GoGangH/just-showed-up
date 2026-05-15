"use client";

import { useEffect, useState } from "react";
import { AppModal } from "@/components/AppModal";
import { GroupInvitePanel } from "@/components/GroupInvitePanel";
import { GroupJoinForm } from "@/app/groups/join/GroupJoinForm";
import { GroupCreateForm } from "@/app/groups/new/GroupCreateForm";
import { GroupLeaveForm } from "@/app/groups/leave/GroupLeaveForm";
import { GroupSettingsForm } from "@/app/groups/settings/GroupSettingsForm";
import { LoginForm } from "@/app/login/LoginForm";
import { RescheduleForm } from "@/app/sessions/reschedule/RescheduleForm";
import type { RescheduleOverview } from "@/app/sessions/reschedule/data";
import type { HomeGroup } from "@/app/home-data";
import type { AppModalName } from "@/components/ModalTrigger";

type CurrentUser = {
  avatarUrl: string | null;
  email: string | null;
  id: string;
};

function getValidModal(value: string | null | undefined): AppModalName | null {
  if (
    value === "group-settings" ||
    value === "invite" ||
    value === "join-group" ||
    value === "login" ||
    value === "new-group" ||
    value === "profile" ||
    value === "reschedule"
  ) {
    return value;
  }

  return null;
}

export function ClientHomeModals({
  activeGroup,
  closeHref,
  currentUser,
  defaultInviteCode,
  displayName,
  initialModal,
  inviteUrl,
  loginNextPath,
  rescheduleOverview,
  selectedWeek,
}: {
  activeGroup: HomeGroup | null;
  closeHref: string;
  currentUser: CurrentUser | null;
  defaultInviteCode: string;
  displayName: string;
  initialModal?: string;
  inviteUrl: string | null;
  loginNextPath: string;
  rescheduleOverview: RescheduleOverview;
  selectedWeek: string;
}) {
  const [modal, setModal] = useState<AppModalName | null>(() => getValidModal(initialModal));

  useEffect(() => {
    function onOpen(event: Event) {
      const nextModal = getValidModal((event as CustomEvent<AppModalName>).detail);
      if (nextModal) setModal(nextModal);
    }

    window.addEventListener("app-modal:open", onOpen);
    return () => window.removeEventListener("app-modal:open", onOpen);
  }, []);

  function close() {
    setModal(null);

    const url = new URL(window.location.href);
    if (url.searchParams.has("modal")) {
      window.history.replaceState(null, "", closeHref);
    }
  }

  if (!modal) return null;

  if (modal === "login") {
    return (
      <AppModal
        description="OAuth 계정으로 로그인하고 그룹의 주간 기록과 모임 일정을 관리합니다."
        onClose={close}
        size="sm"
        title="로그인"
      >
        <LoginForm nextPath={loginNextPath} />
      </AppModal>
    );
  }

  if (modal === "new-group") {
    return (
      <AppModal
        description={
          currentUser
            ? "기본 모임 시간과 장소를 설정해두면 매주 같은 기준으로 스터디를 운영할 수 있습니다."
            : "그룹을 만들려면 먼저 OAuth 계정으로 로그인해주세요."
        }
        onClose={close}
        title={currentUser ? "그룹 만들기" : "로그인"}
      >
        {currentUser ? <GroupCreateForm /> : <LoginForm nextPath="/?modal=new-group" />}
      </AppModal>
    );
  }

  if (modal === "join-group") {
    return (
      <AppModal
        description={
          currentUser
            ? "그룹 관리자에게 받은 초대 코드를 입력하면 스터디 그룹에 참여할 수 있습니다."
            : "초대 코드로 참여하려면 먼저 OAuth 계정으로 로그인해주세요."
        }
        onClose={close}
        title={currentUser ? "초대 코드로 참여" : "로그인"}
      >
        {currentUser ? (
          <GroupJoinForm defaultInviteCode={defaultInviteCode} />
        ) : (
          <LoginForm
            nextPath={`/?modal=join-group${
              defaultInviteCode ? `&invite=${encodeURIComponent(defaultInviteCode)}` : ""
            }`}
          />
        )}
      </AppModal>
    );
  }

  if (modal === "invite" && activeGroup && inviteUrl) {
    return (
      <AppModal
        description="초대 코드를 복사하거나 공유 앱으로 보내서 새 멤버를 초대합니다."
        onClose={close}
        size="sm"
        title="그룹 초대"
      >
        <GroupInvitePanel
          groupName={activeGroup.name}
          inviteCode={activeGroup.invite_code}
          inviteUrl={inviteUrl}
        />
      </AppModal>
    );
  }

  if (modal === "group-settings" && activeGroup) {
    return (
      <AppModal
        description="그룹의 고정 모임 요일, 시간, 장소를 수정합니다."
        onClose={close}
        title="그룹 설정"
      >
        {activeGroup.currentUserRole === "owner" && currentUser ? (
          <GroupSettingsForm
            currentUserId={currentUser.id}
            group={activeGroup}
            week={selectedWeek}
          />
        ) : (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            그룹장만 모임 정보를 수정할 수 있습니다.
          </p>
        )}
      </AppModal>
    );
  }

  if (modal === "reschedule") {
    return (
      <AppModal
        description={
          currentUser
            ? "이번 주 가능한 시간을 칠해두면 그룹원이 겹치는 시간을 기준으로 모임을 다시 잡을 수 있습니다."
            : "일정을 재조율하려면 먼저 OAuth 계정으로 로그인해주세요."
        }
        onClose={close}
        size={currentUser && activeGroup ? "lg" : "sm"}
        title={currentUser ? "이번 주 일정 재조율" : "로그인"}
      >
        {currentUser && activeGroup ? (
          <RescheduleForm
            availability={rescheduleOverview.availability}
            defaultMeetingDay={activeGroup.default_meeting_day}
            groupId={activeGroup.id}
          />
        ) : (
          <LoginForm />
        )}
      </AppModal>
    );
  }

  if (modal === "profile" && currentUser) {
    return (
      <AppModal onClose={close} size="sm" title="내 정보">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            {currentUser.avatarUrl ? (
              <img
                alt=""
                className="h-12 w-12 rounded-full object-cover"
                referrerPolicy="no-referrer"
                src={currentUser.avatarUrl}
              />
            ) : (
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-900 text-lg font-semibold text-white">
                {displayName.trim().slice(0, 1).toUpperCase() || "?"}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate font-semibold text-neutral-900">{displayName}</p>
              <p className="truncate text-sm text-neutral-500">
                {currentUser.email ?? "이메일 정보 없음"}
              </p>
            </div>
          </div>
          <a
            className="block rounded-md border border-neutral-200 px-3 py-2 text-center text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
            href="/logout"
          >
            로그아웃
          </a>
          {activeGroup ? (
            <GroupLeaveForm groupId={activeGroup.id} groupName={activeGroup.name} />
          ) : null}
        </div>
      </AppModal>
    );
  }

  return null;
}
