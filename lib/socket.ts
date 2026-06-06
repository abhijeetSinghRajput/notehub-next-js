import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
    const baseUrl = apiUrl.replace(/\/api$/, "");

    socket = io(baseUrl, {
      withCredentials: true,
      transports: ["websocket"],
    });

    socket.on("connect", () => console.log("✅ socket connected:", socket?.id));
    socket.on("disconnect", (reason) => console.warn("❌ disconnected:", reason));
    socket.on("connect_error", (err) => console.error("❌ socket error:", err.message));
  }
  return socket;
}