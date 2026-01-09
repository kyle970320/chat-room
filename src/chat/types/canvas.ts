export interface CanvasRoomSummary {
  id: string;
  title: string;
  role: "owner" | "member";
  canDraw: boolean;
  memberCount: number;
  createdAt: number;
}

export interface ChatRoomUser {
  userId: number;
  name: string;
  avatarUrl?: string | null;
  lastMessageTs?: number | null;
}
export interface Point {
  nx: number;
  ny: number;
  t?: number;
  seq?: number;
}

export interface SyncStroke {
  id: string;
  canvasRoomId: string;
  userId: number;
  color: string;
  width: number;
  composite: string;
  startedAt: number;
  endedAt: number;
  pointsJson: string; // server 저장 형태
}

export interface JoinResponse {
  ok: boolean;
  canvasRoomId: string;
  clearedAt: number;
  strokes: SyncStroke[];
  error?: string;
}

export interface StrokeStartPayload {
  canvasRoomId: string;
  strokeId: string;
  userId: number;
  color: string;
  width: number;
  composite: string;
  t: number;
  point?: Point | null;
}

export interface StrokeMovePayload {
  canvasRoomId: string;
  strokeId: string;
  points: Point[];
}

export interface StrokeEndPayload {
  canvasRoomId: string;
  strokeId: string;
  t: number;
}

export interface CanvasMember {
  canDraw: number;
  canvasRoomId: string;
  joinedAt: number;
  role: string;
  userId: number;
}
