export interface BoardEvent {
  type: "hello" | "poll" | "ticket.moved" | "ticket.updated" | "job.created" | "board.reset";
  candidate_id?: number;
  from?: string;
  to?: string;
  stamped?: boolean;
  sent_back?: boolean;
}

/** Subscribe to /api/events. Falls back to 2-second polling while the stream is down. */
export function subscribeBoard(onEvent: (e: BoardEvent) => void): () => void {
  let poll: number | null = null;
  let es: EventSource | null = null;
  const startPoll = () => {
    if (poll === null) poll = window.setInterval(() => onEvent({ type: "poll" }), 2000);
  };
  const stopPoll = () => {
    if (poll !== null) { window.clearInterval(poll); poll = null; }
  };
  try {
    es = new EventSource("/api/events");
    es.onmessage = (ev) => {
      stopPoll();
      try { onEvent(JSON.parse(ev.data)); } catch { /* ignore malformed */ }
    };
    es.onerror = () => startPoll();
  } catch {
    startPoll();
  }
  return () => { es?.close(); stopPoll(); };
}
