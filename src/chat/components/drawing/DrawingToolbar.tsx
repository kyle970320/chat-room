import { useEffect, useMemo, type RefObject } from "react";
import type { CanvasMember, ChatRoomUser } from "../../types/canvas";
import { ToggleSwitch } from "@/widgets/toggleswitch";
import type { Socket } from "socket.io-client";

type ToolKey =
  | "brush"
  | "eraser"
  | "line"
  | "rect"
  | "circle"
  | "text"
  | "hand"
  | "select";

interface Props {
  socket: RefObject<Socket | null>;
  canvasRoomId: string;

  // 내 userId (owner 여부 판단용)
  userId: number | null;

  members: Array<CanvasMember>; // { canvasRoomId, userId, role, canDraw, joinedAt ... } 형태로 가정
  users: Array<ChatRoomUser>; // { userId, name ... } 형태로 가정
  handleMemberPermission: (targetUserId: number, canDraw: number) => void;
}

export default function DrawingToolbar(props: Props) {
  const {
    socket,
    canvasRoomId,
    userId,
    members,
    users,
    handleMemberPermission,
  } = props;

  // ✅ 지금은 UI만: 선택 상태는 그냥 예시로 고정
  const activeTool: ToolKey = "brush";

  const tools = useMemo(
    () =>
      [
        { key: "select", label: "Select" },
        { key: "hand", label: "Hand" },
        { key: "brush", label: "Brush" },
        { key: "eraser", label: "Eraser" },
        { key: "line", label: "Line" },
        { key: "rect", label: "Rect" },
        { key: "circle", label: "Circle" },
        { key: "text", label: "Text" },
      ] as const,
    [],
  );

  // ✅ owner만 토글 가능
  const isOwner = useMemo(() => {
    if (userId == null) return false;
    const me = members.find((m) => m.userId === userId);
    return me?.role === "owner";
  }, [members, userId]);

  const nameByUserId = useMemo(() => {
    const m = new Map<number, string>();
    for (const u of users) {
      m.set(u.userId, u.name ?? `User ${u.userId}`);
    }
    return m;
  }, [users]);

  const handleToggleCanDraw = (targetUserId: number, nextCanDraw: boolean) => {
    const s = socket.current;
    if (!s) return;

    // ✅ owner만 변경 가능
    if (!isOwner) return;

    s.emit("canvas:permission:set", {
      canvasRoomId,
      targetUserId,
      canDraw: nextCanDraw,
    });
  };

  useEffect(() => {
    const s = socket.current;
    if (!s) return;

    const onUpdated = (payload: {
      canvasRoomId: string;
      targetUserId: number;
      canDraw: boolean | number;
    }) => {
      if (payload.canvasRoomId !== canvasRoomId) return;

      handleMemberPermission(payload.targetUserId, payload.canDraw as number);
    };

    s.on("canvas:permission:updated", onUpdated);
    return () => {
      s.off("canvas:permission:updated", onUpdated);
    };
  }, [canvasRoomId]);

  return (
    <div className="fixed top-0 left-0 right-0 z-53">
      <div className="mx-auto max-w-[1200px] px-3 pt-3">
        <div className="rounded-2xl border border-white/10 bg-neutral-900/80 backdrop-blur shadow-lg">
          <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-white/10 grid place-items-center text-white/80 text-sm">
                  ✎
                </div>
                <div className="text-white/90 font-semibold text-sm">
                  Canvas Board
                </div>
              </div>

              <div className="ml-3 hidden md:flex items-center gap-1 text-sm text-white/70">
                {["File", "Edit", "View", "Help"].map((m) => (
                  <button
                    key={m}
                    className="px-2 py-1 rounded-lg hover:bg-white/10 transition"
                    type="button"
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-2 py-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="text-xs text-white/70">Ready</span>
              </div>

              <button
                type="button"
                className="h-9 rounded-xl px-3 text-sm font-medium text-white bg-white/10 hover:bg-white/15 border border-white/10 transition"
              >
                Export
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            {/* Left */}
            <div className="w-[85%] px-3 py-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-1">
                    {tools.map((t) => {
                      const isActive = t.key === activeTool;
                      return (
                        <button
                          key={t.key}
                          type="button"
                          className={[
                            "h-9 px-3 rounded-xl text-sm transition",
                            "border border-transparent",
                            isActive
                              ? "bg-white text-neutral-900"
                              : "bg-transparent text-white/80 hover:bg-white/10",
                          ].join(" ")}
                          aria-pressed={isActive}
                        >
                          {t.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="hidden md:block h-6 w-px bg-white/10 mx-1" />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="h-9 rounded-xl px-3 text-sm text-white/80 bg-white/5 border border-white/10 hover:bg-white/10 transition"
                    >
                      Undo
                    </button>
                    <button
                      type="button"
                      className="h-9 rounded-xl px-3 text-sm text-white/80 bg-white/5 border border-white/10 hover:bg-white/10 transition"
                    >
                      Redo
                    </button>
                    <button
                      type="button"
                      className="h-9 rounded-xl px-3 text-sm text-white/80 bg-white/5 border border-white/10 hover:bg-white/10 transition"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 justify-start md:justify-end">
                  <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                    <div className="text-xs text-white/60 w-12">Stroke</div>
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 rounded-md bg-white border border-white/30" />
                      <div className="text-xs text-white/70">#FFFFFF</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                    <div className="text-xs text-white/60 w-12">Size</div>
                    <div className="flex items-center gap-2">
                      <div className="h-1 w-24 rounded-full bg-white/20 overflow-hidden">
                        <div className="h-full w-2/3 bg-white/70" />
                      </div>
                      <div className="text-xs text-white/70 tabular-nums w-8 text-right">
                        10
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                    <div className="text-xs text-white/60 w-12">Alpha</div>
                    <div className="flex items-center gap-2">
                      <div className="h-1 w-24 rounded-full bg-white/20 overflow-hidden">
                        <div className="h-full w-1/2 bg-white/70" />
                      </div>
                      <div className="text-xs text-white/70 tabular-nums w-8 text-right">
                        50
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                    <div className="text-xs text-white/60 w-12">Blend</div>
                    <div className="text-xs text-white/80 px-2 py-1 rounded-lg bg-white/10 border border-white/10">
                      overlay
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-white/50">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 rounded-lg bg-white/5 border border-white/10">
                    1920×1080
                  </span>
                  <span className="px-2 py-1 rounded-lg bg-white/5 border border-white/10">
                    Snap: Off
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline">
                    Tip: Ctrl+Z / Ctrl+Shift+Z
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Members */}
            <div className="px-3 py-3 w-[15%] text-white">
              <div className="flex items-center justify-between">
                <p className="font-semibold">Members</p>
                {!isOwner && (
                  <span className="text-[11px] text-white/50">Owner only</span>
                )}
              </div>

              <div className="mt-2 flex flex-col gap-2">
                {members.map((m) => {
                  const uid = m.userId;
                  const isTargetOwner = m.role === "owner";
                  const canDraw = !!m.canDraw; // number(0/1) or boolean 둘 다 대응

                  // ✅ owner만 토글 가능 + (선택) owner 본인 토글 비활성화
                  const disabled = !isOwner || isTargetOwner;

                  const label = nameByUserId.get(uid) ?? `User ${uid}`;

                  return (
                    <div
                      key={uid}
                      className="flex justify-between items-center gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <p className="truncate">{label}</p>
                        {m.role === "owner" && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 border border-white/10 text-white/70">
                            owner
                          </span>
                        )}
                      </div>

                      <div className={disabled ? "opacity-60" : ""}>
                        <ToggleSwitch
                          isOn={canDraw}
                          toggleSwitch={() => {
                            if (disabled) return;
                            handleToggleCanDraw(uid, !canDraw);
                          }}
                          offText=""
                          onText=""
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="mt-3 text-[11px] text-white/50">
                * Only owner can change draw permission.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="h-[136px] md:h-[128px]" />
    </div>
  );
}
