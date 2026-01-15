import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import {  apiFriendRemark ,apiFriendList} from '@/api/user';
export const useFriendStore = defineStore('friend', () => {
  const friendList = ref([]);
  
  // 初始化时从localStorage加载
  const loadFromCache = () => {
    const cached = localStorage.getItem('friendList');
    if (cached) {
      try {
        friendList.value = JSON.parse(cached);
      } catch (e) {
        console.error('解析好友列表缓存失败', e);
      }
    }
  };

  const removeFriend = (friendId) => {
    friendList.value = friendList.value.filter(
      f => f.friend_id.toString() !== friendId.toString()
    );
  };

  const getFriendList = async () => {
    const res = await apiFriendList({ limit: 20 });
    friendList.value = res.data.data;
  }; 
  
  // 更新单个好友信息
  const updateRemark = async (friendId, newRemark) => {
    try {
      await apiFriendRemark({
        friend_uid: friendId,
        friend_remark: newRemark
      });
      
      // 更新本地store
      const index = friendList.value.findIndex(
        f => f.friend_id.toString() === friendId.toString()
      );
      
      if (index !== -1) {
        friendList.value[index].friend_remark = newRemark;
      }
      
      // 更新本地存储
      saveToCache();
    } catch (error) {
      throw error;
    }
  }
  
  // 保存到localStorage
  const saveToCache = () => {
    localStorage.setItem('friendList', JSON.stringify(friendList.value));
  };
  
  // 自动保存到缓存
  watch(friendList, saveToCache, { deep: true });
  
  return {
    friendList,
    loadFromCache,
    updateRemark,
    removeFriend,
    getFriendList
  };
});