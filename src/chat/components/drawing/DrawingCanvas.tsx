import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import DrawingToolbar from "./DrawingToolbar";
import type { Socket } from "socket.io-client";
import type {
  JoinResponse,
  StrokeEndPayload,
  StrokeMovePayload,
  StrokeStartPayload,
  Point,
  CanvasMember,
  ChatRoomUser,
} from "../../types/canvas";

interface Props {
  socket: RefObject<Socket | null>;
  userId: number | null;
  canvasRoomId: string;
  handleCloseDrawing: () => void;
  users: Array<ChatRoomUser>;
}
function clamp01(v: number) {
  if (Number.isNaN(v)) return 0;
  return Math.max(0, Math.min(1, v));
}

function safeParsePoints(pointsJson: string): Point[] {
  try {
    const parsed = JSON.parse(pointsJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
export default function DrawingCanvas(props: Props) {
  const { socket, userId, users, canvasRoomId, handleCloseDrawing } = props;
  const [members, setMembers] = useState<Array<CanvasMember>>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  const handleMemberPermission = (targetUserId: number, canDraw: number) => {
    setMembers((prev) =>
      prev.map((m) => (m.userId === targetUserId ? { ...m, canDraw } : m)),
    );
  };
  const isCanDraw = () => {
    if (members.length < 1) {
      return;
    }
    if (!userId) {
      return;
    }
    return (members.find((el) => el.userId === userId)?.canDraw || 0) > 0;
  };
  // 내 그리기 상태
  const isDrawing = useRef(false);
  const myStrokeIdRef = useRef<string | null>(null);
  const lastPos = useRef({ x: 0, y: 0 });

  // 내 전송 버퍼(묶어서 move emit)
  const sendBuf = useRef<Point[]>([]);
  const flushTimer = useRef<number | null>(null);

  // 상대 스트로크 상태(StrokeId별 lastPoint)
  const remoteState = useRef<
    Map<
      string,
      {
        lastX: number;
        lastY: number;
        color: string;
        width: number;
        composite: string;
      }
    >
  >(new Map());

  // (로컬) Undo/Redo 스택 — ※ 공유 Undo/Redo가 아님 (서버 이벤트로 확장 가능)
  const undoStack = useRef<ImageData[]>([]);
  const redoStack = useRef<ImageData[]>([]);

  const dpr = useMemo(() => window.devicePixelRatio || 1, []);

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;

    const cssW = window.innerWidth;
    const cssH = window.innerHeight;

    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;

    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);

    // 좌표계를 CSS 픽셀 기준으로 맞추기
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 기본 스타일(필요하면 Toolbar로 연결)
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.lineWidth = 10;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
  };

  const saveSnapshot = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;

    const imageData = ctx.getImageData(
      0,
      0,
      Math.floor(canvas.width / dpr),
      Math.floor(canvas.height / dpr),
    );
    undoStack.current.push(imageData);
    if (undoStack.current.length > 30) undoStack.current.shift();
    redoStack.current = [];
  };

  const applyStrokeStyle = (
    ctx: CanvasRenderingContext2D,
    style: { color: string; width: number; composite: string },
  ) => {
    ctx.strokeStyle = style.color;
    ctx.lineWidth = style.width;
    ctx.globalCompositeOperation = style.composite as GlobalCompositeOperation;
  };

  const drawSegment = (
    from: { x: number; y: number },
    to: { x: number; y: number },
    style?: { color: string; width: number; composite: string },
  ) => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    ctx.save();
    if (style) applyStrokeStyle(ctx, style);

    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();

    ctx.restore();
  };

  const toNormalized = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { nx: 0, ny: 0 };
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    return { nx: clamp01(x / w), ny: clamp01(y / h) };
  };

  const fromNormalized = (nx: number, ny: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    return { x: nx * w, y: ny * h };
  };

  const flushMove = () => {
    const s = socket.current;
    const strokeId = myStrokeIdRef.current;
    if (!s || !strokeId) return;
    if (sendBuf.current.length === 0) return;

    const points = sendBuf.current.splice(0, sendBuf.current.length);

    s.emit("canvas:stroke:move", {
      canvasRoomId,
      strokeId,
      points,
    });
  };

  const scheduleFlush = () => {
    if (flushTimer.current != null) return;
    // 16ms 정도로 묶어서 전송 (과도한 emit 방지)
    flushTimer.current = window.setTimeout(() => {
      flushTimer.current = null;
      flushMove();
    }, 16);
  };

  // -----------------------------
  // 초기 세팅 + 리사이즈
  // -----------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctxRef.current = ctx;

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -----------------------------
  // 서버 join + 초기 sync + 실시간 리스너
  // -----------------------------
  useEffect(() => {
    const s = socket.current;
    if (!s) return;

    // 1) join + 초기 sync
    s.emit("canvas:join", { canvasRoomId }, (res: JoinResponse) => {
      if (!res?.ok) {
        console.error("[canvas:join] failed", res?.error);
        return;
      }

      clearCanvas();

      // server strokes 렌더
      const ctx = ctxRef.current;
      if (!ctx) return;

      // strokes는 저장된 순서(시간)대로 오는 게 보통이지만, 혹시 몰라 startedAt/endedAt 정렬
      const sorted = Array.isArray(res.strokes)
        ? [...res.strokes].sort(
            (a, b) => (a.startedAt ?? 0) - (b.startedAt ?? 0),
          )
        : [];

      for (const st of sorted) {
        const pts = safeParsePoints(st.pointsJson);
        if (pts.length < 2) continue;

        for (let i = 1; i < pts.length; i++) {
          const p0 = fromNormalized(
            Number(pts[i - 1].nx),
            Number(pts[i - 1].ny),
          );
          const p1 = fromNormalized(Number(pts[i].nx), Number(pts[i].ny));

          drawSegment(
            { x: p0.x, y: p0.y },
            { x: p1.x, y: p1.y },
            {
              color: st.color || "rgba(255,255,255,0.8)",
              width: Number(st.width || 10),
              composite: st.composite || "source-over",
            },
          );
        }
      }
    });

    // 2) 실시간 수신
    const onStart = (p: StrokeStartPayload) => {
      if (!p || p.canvasRoomId !== canvasRoomId) return;

      if (p.strokeId && p.strokeId === myStrokeIdRef.current) return;

      const first = p.point
        ? fromNormalized(Number(p.point.nx), Number(p.point.ny))
        : null;

      remoteState.current.set(p.strokeId, {
        lastX: first?.x ?? 0,
        lastY: first?.y ?? 0,
        color: p.color || "rgba(255,255,255,0.8)",
        width: Number(p.width || 10),
        composite: p.composite || "source-over",
      });
    };

    const onMove = (p: StrokeMovePayload) => {
      if (!p || p.canvasRoomId !== canvasRoomId) return;
      if (!p.strokeId) return;
      if (p.strokeId === myStrokeIdRef.current) return;

      const state = remoteState.current.get(p.strokeId);
      if (!state) return;

      const pts = Array.isArray(p.points) ? p.points : [];
      for (const pt of pts) {
        const pos = fromNormalized(Number(pt.nx), Number(pt.ny));
        drawSegment(
          { x: state.lastX, y: state.lastY },
          { x: pos.x, y: pos.y },
          {
            color: state.color,
            width: state.width,
            composite: state.composite,
          },
        );
        state.lastX = pos.x;
        state.lastY = pos.y;
      }
    };

    const onEnd = (p: StrokeEndPayload) => {
      if (!p || p.canvasRoomId !== canvasRoomId) return;
      if (!p.strokeId) return;
      remoteState.current.delete(p.strokeId);
    };

    s.on("canvas:stroke:start", onStart);
    s.on("canvas:stroke:move", onMove);
    s.on("canvas:stroke:end", onEnd);
    s.emit(
      "canvas:member:get",
      { canvasRoomId },
      (res: { members: Array<CanvasMember> }) => {
        setMembers(res.members ?? []);
      },
    );

    return () => {
      s.off("canvas:stroke:start", onStart);
      s.off("canvas:stroke:move", onMove);
      s.off("canvas:stroke:end", onEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasRoomId]);
  console.log(members);
  // -----------------------------
  // 포인터 이벤트(내 그리기 + emit)
  // -----------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    const s = socket.current;
    if (!canvas || !ctx || !s) return;

    const getLocalPos = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      return { x, y };
    };

    const makeStrokeId = () => {
      // crypto.randomUUID가 없을 수 있으니 fallback

      return (crypto?.randomUUID?.() ??
        `${Date.now()}-${Math.random().toString(16).slice(2)}`) as string;
    };

    const handlePointerDown = (e: PointerEvent) => {
      // 좌클릭/터치만
      if (e.pointerType === "mouse" && e.button !== 0) return;

      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);

      isDrawing.current = true;
      const pos = getLocalPos(e);
      lastPos.current = pos;

      saveSnapshot();

      const strokeId = makeStrokeId();
      myStrokeIdRef.current = strokeId;

      // 현재 스타일(필요하면 toolbar 상태로 교체)
      const color = "rgba(255,255,255,0.8)";
      const width = 10;
      const composite = "source-over";

      // start emit (정규화 point 포함)
      const { nx, ny } = toNormalized(pos.x, pos.y);

      s.emit("canvas:stroke:start", {
        canvasRoomId,
        strokeId,
        color,
        width,
        composite,
        t: Date.now(),
        point: { nx, ny },
      });

      // 로컬에도 시작점을 찍어두고 싶으면 아주 짧은 세그먼트를 그려도 됨(선택)
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDrawing.current) return;

      e.preventDefault();
      const pos = getLocalPos(e);

      // 로컬 draw
      drawSegment(lastPos.current, pos, {
        color: "rgba(255,255,255,0.8)",
        width: 10,
        composite: "source-over",
      });

      lastPos.current = pos;

      // move emit (버퍼링)
      const { nx, ny } = toNormalized(pos.x, pos.y);
      sendBuf.current.push({ nx, ny, t: Date.now() });
      scheduleFlush();
    };

    const endStroke = () => {
      if (!isDrawing.current) return;

      isDrawing.current = false;

      // 남은 move flush
      flushMove();

      const strokeId = myStrokeIdRef.current;
      myStrokeIdRef.current = null;

      if (strokeId) {
        s.emit("canvas:stroke:end", { canvasRoomId, strokeId, t: Date.now() });
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      e.preventDefault();
      endStroke();
    };

    const handlePointerCancel = (e: PointerEvent) => {
      e.preventDefault();
      endStroke();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const ctx = ctxRef.current;
      const canvas = canvasRef.current;
      if (!ctx || !canvas) return;

      if (e.ctrlKey && e.key.toLowerCase() === "z") {
        e.preventDefault();

        if (e.shiftKey) {
          // Redo
          const redoData = redoStack.current.pop();
          if (redoData) {
            const current = ctx.getImageData(
              0,
              0,
              Math.floor(canvas.width / dpr),
              Math.floor(canvas.height / dpr),
            );
            undoStack.current.push(current);
            ctx.putImageData(redoData, 0, 0);
          }
        } else {
          // Undo
          const last = undoStack.current.pop();
          if (last) {
            const current = ctx.getImageData(
              0,
              0,
              Math.floor(canvas.width / dpr),
              Math.floor(canvas.height / dpr),
            );
            redoStack.current.push(current);
            ctx.putImageData(last, 0, 0);
          }
        }
      }
    };

    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerup", handlePointerUp);
    canvas.addEventListener("pointercancel", handlePointerCancel);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerup", handlePointerUp);
      canvas.removeEventListener("pointercancel", handlePointerCancel);
      window.removeEventListener("keydown", handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasRoomId]);

  return (
    <>
      <DrawingToolbar
        canvasRoomId={canvasRoomId}
        userId={userId}
        socket={socket}
        members={members}
        users={users}
        handleMemberPermission={handleMemberPermission}
      />
      <canvas
        id="draw"
        ref={canvasRef}
        className={`absolute top-0 left-0 w-full h-full z-51 block bg-black/10 ${isCanDraw() ? "" : "pointer-events-none"}`}
        style={{ display: "block", touchAction: "none" }}
      />

      <button
        onClick={handleCloseDrawing}
        className="fixed z-53 left-10 bottom-10 text-white bg-blue-600 p-4 text-2xl"
      >
        Exit
      </button>
    </>
  );
}
