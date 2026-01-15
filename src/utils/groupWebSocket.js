import { useUserStore } from '@/stores/user'
import md5 from 'js-md5'

class GroupWebSocketService {
  constructor(chatId, room, user_id, sign) { // 修改构造函数接收额外参数
    this.socket = null
    this.chatId = chatId
    this.room = room
    this.user_id = user_id
    this.sign = sign
    this.reconnectInterval = 2500
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 10
    this.isManualClose = false
    this.heartbeatTimer = null
  }

  connect() {
    if (this.socket) {
      if (this.socket.readyState === WebSocket.OPEN) return
      if (this.socket.readyState === WebSocket.CONNECTING) return
    }
    
    const userStore = useUserStore()
    
    if (!userStore.userInfo?.uid) {
      console.warn('无法连接群聊WebSocket: 用户ID未找到')
      return
    }

    const time = Math.floor(Date.now() / 1000);
    const secret = '^11dom&cartoonChat$'
    const firstHash = md5(secret);
    const authKey = md5(`${firstHash}${time}`);  
    
    // 群聊专用WebSocket地址
    this.socket = new WebSocket(`wss://xr-api.11dom.com:2346?key=${authKey}&time=${time}`)

    this.socket.onopen = () => {
      console.log('群聊WebSocket连接成功')
      this.reconnectAttempts = 0
      
      // 发送群聊初始化消息 - 添加所有必需字段
      this.send({
        type: 'init',
        time,
        key: authKey,
        uid: userStore.userInfo.uid,
        room: this.room,           // 添加 room
        user_id: this.user_id,     // 添加 user_id
        hallId: this.chatId,       // 添加 hallId (使用 chatId)
        sign: this.sign            // 添加 sign
      })
      
      // 启动心跳
      this.startHeartbeat()
    }

    this.socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        this.handleMessage(message)
      } catch (error) {
        console.error('解析群聊WebSocket消息错误:', error)
      }
    }

    this.socket.onclose = (event) => {
      console.log('群聊WebSocket关闭:', event)
      if (!this.isManualClose && this.reconnectAttempts < this.maxReconnectAttempts) {
        clearInterval(this.heartbeatTimer)
        setTimeout(() => {
          this.reconnectAttempts++
          console.log(`群聊重连中... 尝试 ${this.reconnectAttempts}`)
          this.connect()
        }, this.reconnectInterval)
      }
    }

    this.socket.onerror = (error) => {
      console.error('群聊WebSocket错误:', error)
    }
  }

  send(message) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      if (this.socket?.readyState === WebSocket.CONNECTING) {
        setTimeout(() => this.send(message), 300)
        return
      }
      
      console.warn('群聊WebSocket未连接，尝试重新连接...')
      this.connect()
      setTimeout(() => this.send(message), 500)
      return
    }
    
    try {
      this.socket.send(JSON.stringify(message))
    } catch (error) {
      console.error('发送群聊WebSocket消息失败:', error)
    }
  }

  disconnect() {
    this.isManualClose = true
    if (this.socket) {
      clearInterval(this.heartbeatTimer)
      this.socket.close()
      this.socket = null
    }
  }

  startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.send({ 
          type: 'group_ping', 
          chat_id: this.chatId,
          timestamp: Date.now() 
        })
      }
    }, 30000)
  }

  handleMessage(message) {
    // 创建自定义事件并派发
    const event = new CustomEvent('group-websocket-message', {
      detail: {
        ...message,
        chatId: this.chatId
      }
    })
    window.dispatchEvent(event)
  }
}

export default GroupWebSocketService