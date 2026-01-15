import axios from 'axios'

// 创建 axios 实例
const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://xr-api.11dom.com',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

request.interceptors.request.use(
  config => {
    // 从 localStorage 获取 token
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = token;
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    // 直接返回响应数据
    return response.data
  },
  error => {
    if (error.response) {
      // 根据状态码处理错误
      const status = error.response.status
      let message = '请求错误'
      
      switch (status) {
        case 401:
          message = '未授权，请登录'
          // 这里可以添加重定向到登录页的逻辑
          break
        case 403:
          message = '拒绝访问'
          break
        case 404:
          message = '请求资源不存在'
          break
        case 500:
          message = '服务器错误'
          break
        default:
          message = `连接错误 ${status}`
      }
      
      return Promise.reject({ status, message })
    } else {
      return Promise.reject({ message: '网络连接错误' })
    }
  }
)

export default request