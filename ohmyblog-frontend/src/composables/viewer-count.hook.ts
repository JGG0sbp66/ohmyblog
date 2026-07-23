import { ref, onMounted, onUnmounted } from "vue";

const viewerCount = ref(0);
const isConnected = ref(false);
let ws: WebSocket | null = null;
let refCount = 0;

/**
 * 全局共享的在线浏览人数 WebSocket 连接。
 * 多个组件调用时复用同一个连接，最后一个卸载时关闭。
 */
export function useViewerCount() {
  onMounted(() => {
    refCount++;
    if (refCount === 1) {
      connect();
    }
  });

  onUnmounted(() => {
    refCount--;
    if (refCount === 0) {
      ws?.close();
      ws = null;
      isConnected.value = false;
    }
  });

  return { viewerCount, isConnected };
}

function connect() {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const url = `${protocol}//${window.location.host}/api/ws/viewers`;

  ws = new WebSocket(url);

  ws.onopen = () => {
    isConnected.value = true;
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      viewerCount.value = data.count;
    } catch {
      // ignore malformed messages
    }
  };

  ws.onclose = () => {
    isConnected.value = false;
    // 如果还有组件在使用，尝试重连
    if (refCount > 0) {
      setTimeout(connect, 3000);
    }
  };
}
