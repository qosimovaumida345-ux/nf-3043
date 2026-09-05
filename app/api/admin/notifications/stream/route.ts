import { getSession } from "@/lib/auth";
import { notificationEmitter, NewSubmissionEvent } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return new Response("Unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // 1. Dastlabki ulanish signali
      controller.enqueue(encoder.encode(": connected\n\n"));
      controller.enqueue(encoder.encode("retry: 4000\n\n"));

      // 2. Yangi yuklama hodisasini tinglash
      const handleNewSubmission = (data: NewSubmissionEvent) => {
        try {
          const payload = `event: new-submission\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        } catch (err) {
          console.error("SSE yuborishda xatolik:", err);
        }
      };

      notificationEmitter.on("new-submission", handleNewSubmission);

      // 3. Proxy/Cloudflare ulanishni yopib qo'ymasligi uchun har 20 soniyada Keep-Alive ping
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          clearInterval(pingInterval);
        }
      }, 20000);

      // 4. Ulanish yopilganda tozalash
      return () => {
        notificationEmitter.off("new-submission", handleNewSubmission);
        clearInterval(pingInterval);
      };
    },
    cancel() {
      // Brauzer oynasi yopilganda
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
