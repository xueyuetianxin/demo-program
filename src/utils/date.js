// src/utils/date.js
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

/**
 * 格式化聊天消息时间（微信风格）
 * @param {string|number} timestamp - 时间戳或可解析的时间字符串
 * @returns {string} 格式化后的时间
 */
export const formatMsgTime = (timestamp) => {
  if (!timestamp) return ''
  const time = dayjs(timestamp)
  const now = dayjs()

  // 当天：显示具体小时和分（如 10:21）
  if (now.isSame(time, 'day')) {
    return time.format('HH:mm')
  }
  // 昨天：显示"昨天" + 时间（如 昨天 10:21）
  else if (now.subtract(1, 'day').isSame(time, 'day')) {
    return `昨天 `
  }
  // 超过昨天：显示月份/天数（如 10/21）
  else {
    return time.format('MM/DD')
  }
}