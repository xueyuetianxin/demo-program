import request from '@/utils/request'

// 登录接口
export const apiLogin = (data) => {
  return request({
    url: '/h5/auth/login',
    method: 'POST',
    data
  })
}
// 好友列表
export const apiFriendList = (params) => {
  return request({
    url: '/h5/chat/friends',
    method: 'GET',
    params
  })
}
// 公共个人信息
export const apiPublicInfo = (id) => {
  return request({
    url: `/h5/user/publicInfo/${id}`,
    method: 'GET'
  })
}
// 聊天列表
export const apiSessionsList = (params) => {
  return request({
    url: '/h5/chat/newSessions',
    method: 'GET',
    params
  })
}
// 会话详情
export const apiSessionsDetail = (params) => {
  return request({
    url: '/h5/chat/sessionDetail',
    method: 'GET',
    params
  })
}
//图片上传
export const apiUploadImage = (formData, params = {}) => {
  return request({
    url: '/api/common/uploadImg',
    method: 'POST',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    params: {
      title: formData.get('file')?.name.split('.')[0] || '',
      ...params // 允许调用时覆盖默认参数
    }
  })
}
//好友私聊
export const apiPrivate = (data) => {
  return request({
    url: '/h5/chat/private',
    method: 'POST',
    data
  })
}
// 群聊详情
export const apiGroupDetail = (params) => {
  return request({
    url: '/h5/chat/groupDetail',
    method: 'GET',
    params
  })
}
//群聊发信息
export const apiSendMessages = (data) => {
  return request({
    url: '/h5/chat/sendMessages',
    method: 'POST',
    data
  })
}
//群或个人消息免打扰
export const apiAvoidDisturb = (id,data) => {
  return request({
    url: `/h5/chat/avoidDisturb/${id}`,
    method: 'POST',
    data
  })
}
//聊天置顶-取消置顶
export const apiPutTop = (id,data) => {
  return request({
    url: `/h5/userChat/putTop/${id}`,
    method: 'POST',
    data
  })
}
//清空聊天记录
export const apiClearContent = (id,data) => {
  return request({
    url: `/h5/userChat/clearContent/${id}`,
    method: 'POST',
    data
  })
}
// 个人信息
export const apiMeInfo = (params) => {
  return request({
    url: '/h5/user/info',
    method: 'GET',
    params
  })
}
//好友申请
export const apiFriendRequest = (data) => {
  return request({
    url: '/h5/chat/friendRequest',
    method: 'POST',
    data
  })
}
// 展馆详情
export const apiDisplayDetail = (id) => {
  return request({
    url: `/h5/display/${id}`,
    method: 'GET'
  });
}
// 群成员在馆人员
export const apiGroupPersons = (params) => {
  return request({
    url: '/h5/chat/groupPersons',
    method: 'GET',
    params
  })
}
//设置好友备注
export const apiFriendRemark = (data) => {
  return request({
    url: '/h5/userChat/friendRemark',
    method: 'POST',
    data
  })
}
// 申请消息列表
export const apiApplyList = (params) => {
  return request({
    url: '/h5/chat/applyList',
    method: 'GET',
    params
  })
}
//好友通过或拒绝
export const apiFriendThrough = (id,data) => {
  return request({
    url: `/h5/chat/friendThrough/${id}`,
    method: 'POST',
    data
  })
}
//删除好友
export const apiDelFriend = (id,data) => {
  return request({
    url: `/h5/chat/delFriend/${id}`,
    method: 'DELETE',
    data
  })
}
//删除会话
export const apiDelSession = (id,data) => {
  return request({
    url: `/h5/chat/delSession/${id}`,
    method: 'DELETE',
    data
  })
}
//撤销群消息
export const apiRevokeMsg = (data) => {
  return request({
    url: '/h5/chat/revokeMsg',
    method: 'POST',
    data
  })
}
//聊天内容收藏
export const apiContentCollect = (data) => {
  return request({
    url: '/h5/userChat/contentCollect',
    method: 'POST',
    data
  })
}
//直接拉进群
export const apiPullToGroup = (data) => {
  return request({
    url: '/h5/chat/pullToGroup',
    method: 'POST',
    data
  })
}
//管理员将用户移出群聊
export const apiCuratorLogout = (data) => {
  return request({
    url: `/h5/chat/curatorLogout`,
    method: 'DELETE',
    data
  })
}
//用户退群
export const apiUserLogout = (data) => {
  return request({
    url: `/h5/chat/userLogout`,
    method: 'DELETE',
    data
  })
}
// 企业成员列表
export const apiInstitutionList = (params) => {
  return request({
    url: '/h5/institution/2',
    method: 'GET',
    params
  })
}