import { useUserStore } from '@/stores/user'
import { useChatStore } from '@/stores/chatStore'
import md5 from 'js-md5'

class WebSocketService {
  constructor() {
    this.socket = null
    this.reconnectInterval = 2500
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 10
    this.isManualClose = false
    this.heartbeatTimer = null;
  }

  connect() {
    if (this.socket) {
      if (this.socket.readyState === WebSocket.OPEN) return
      if (this.socket.readyState === WebSocket.CONNECTING) return
    }
    
    const userStore = useUserStore()
    
    
    if (!userStore.userInfo?.uid) {
      console.warn('无法连接WebSocket: 用户ID未找到')
      return
    }

    const time = Math.floor(Date.now() / 1000);
    const secret = '^11dom&cartoonChat$'
    const firstHash = md5(secret);
    const authKey = md5(`${firstHash}${time}`);  
    
    this.socket = new WebSocket(`wss://xr-api.11dom.com:2346?key=${authKey}&time=${time}`)

    this.socket.onopen = () => {
      console.log('WebSocket连接成功')
      this.reconnectAttempts = 0
      
      // 发送初始化消息
      this.send({
        type: 'user_init',
        user_id: userStore.userInfo.uid,
        time: time,
        key: authKey,
        uid: userStore.userInfo.uid
      })
    }

    this.socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        this.handleMessage(message)
      } catch (error) {
        console.error('解析WebSocket消息错误:', error)
      }
    }

    this.socket.onclose = (event) => {
      // console.log('WebSocket关闭:')
      if (!this.isManualClose && this.reconnectAttempts < this.maxReconnectAttempts) {
        clearInterval(this.heartbeatTimer);
        setTimeout(() => {
          this.reconnectAttempts++
          console.log(`重连中... 尝试 ${this.reconnectAttempts}`)
          this.connect()
        }, this.reconnectInterval)
      }
    }

    this.socket.onerror = (error) => {
      console.error('WebSocket错误:', error)
    }
  }

  send(message) {
    // 等待连接建立后再发送消息
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      // 如果正在连接中，等待后重试
      if (this.socket?.readyState === WebSocket.CONNECTING) {
        setTimeout(() => this.send(message), 300)
        return
      }
      
      // 如果未连接，尝试重新连接
      console.warn('WebSocket未连接，尝试重新连接...')
      this.connect()
      setTimeout(() => this.send(message), 500)
      return
    }
    
    try {
      this.socket.send(JSON.stringify(message))
    } catch (error) {
      console.error('发送WebSocket消息失败:', error)
    }
  }

  disconnect() {
    this.isManualClose = true
    if (this.socket) {
      this.socket.close()
      this.socket = null
    }
  }

  startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping', timestamp: Date.now() });
      }
    }, 30000); // 30秒间隔
  }

  handleMessage(message) {
    // console.log('收到WebSocket消息:', message)
    // 创建自定义事件并派发
    const event = new CustomEvent('websocket-message', {
      detail: message
    });
    window.dispatchEvent(event);
  }
}

const webSocketService = new WebSocketService()

// 添加全局访问
window.webSocketService = webSocketService

export default webSocketService