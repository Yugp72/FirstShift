export interface BoardEvent {
  type: "hello" | "poll" | "ticket.moved" | "ticket.updated" | "job.created" | "board.reset";
  candidate_id?: number;
  from?: string;
  to?: string;
  stamped?: boolean;
  sent_back?: boolean;
}

/** Live board updates. The API runs as a serverless function on Enter, so we poll every 3 s (paused while the tab is hidden). */
export function subscribeBoard(onEvent: (e: BoardEvent) => void): () => void {
  const tick = () => { if (document.visibilityState === "visible") onEvent({ type: "poll" }); };
  const id = window.setInterval(tick, 3000);
  const onVis = () => tick();
  document.addEventListener("visibilitychange", onVis);
  return () => { window.clearInterval(id); document.removeEventListener("visibilitychange", onVis); };
}
