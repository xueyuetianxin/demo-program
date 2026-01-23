<template>
  <div class="login-container">
    <div class="login-header">
      <div class="logo">
        <div class="logo-icon">元</div>
        <h1>元信登录</h1>
      </div>
      <p>请使用手机号和密码登录</p>
    </div>

    <form class="login-form" @submit.prevent="handleLogin">
      <div class="form-group">
        <label for="mobile">手机号码</label>
        <div class="input-wrapper">
          <input 
            type="tel" 
            id="mobile" 
            v-model="form.mobile" 
            placeholder="请输入手机号"
            maxlength="11"
            required
          />
          <div class="prefix">+86</div>
        </div>
      </div>

      <div class="form-group">
        <label for="password">密码</label>
        <div class="input-wrapper">
          <input 
            :type="showPassword ? 'text' : 'password'" 
            id="password" 
            v-model="form.password" 
            placeholder="请输入密码"
            required
          />
          <button 
            type="button" 
            class="toggle-password"
            @click="showPassword = !showPassword"
          >
            <i :class="showPassword ? 'icon-eye-open' : 'icon-eye-close'"></i>
          </button>
        </div>
      </div>

      <div class="form-group">
        <div class="remember-forgot">
          <label class="remember-me">
            <input type="checkbox" v-model="rememberMe" />
            <span>记住我</span>
          </label>
          <a href="#" class="forgot-password">忘记密码？</a>
        </div>
      </div>

      <button 
        type="submit" 
        class="login-button"
        :disabled="loading"
      >
        <span v-if="loading">登录中...</span>
        <span v-else>登录</span>
      </button>

      <div class="login-methods">
        <div class="divider">
          <span class="line"></span>
          <span class="text">或用以下方式登录</span>
          <span class="line"></span>
        </div>
        <div class="qr-login">
          <div class="qr-code">
            <div class="qr-placeholder"></div>
          </div>
          <p>扫码登录</p>
        </div>
      </div>
    </form>

    <div v-if="errorMessage" class="error-message">
      <i class="icon-error"></i>
      {{ errorMessage }}
    </div>

    <div class="footer">
      <p>隐私政策 | 用户协议</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { apiLogin } from '@/api/user';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user'
const userStore = useUserStore();
const router = useRouter();

// 表单数据
const form = ref({
  mobile: '',
  password: '',
  code: '',
  type: '1' // 固定为密码登录
});

const showPassword = ref(false);
const rememberMe = ref(false);
const loading = ref(false);
const errorMessage = ref('');

// 处理登录
const handleLogin = async () => {
  if (!form.value.mobile || !form.value.password) {
    errorMessage.value = '手机号和密码不能为空';
    return;
  }

  try {
    loading.value = true;
    errorMessage.value = '';
    
    // 调用登录API
    const response = await apiLogin({
      mobile: form.value.mobile,
      password: form.value.password,
      code: form.value.code,
      type: form.value.type
    });
    console.log(response.data.token)
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('uid', response.data.uid);
      localStorage.setItem('nickname', response.data.nickname);
      localStorage.setItem('logo', response.data.logo);
    

      const userInfo = {
      ...(response.data.user || {}), // 如果 API 返回了其他用户信息
      uid: response.data.uid // 确保 uid 包含在用户信息中
    };

    if (userStore) {
      userStore.loginSuccess({
        token: response.data.token,
        user: userInfo, // 根据实际API响应调整
        rememberMe: rememberMe.value
      });
    }
    
    // 跳转到首页或聊天页面
    router.push('/chat');
  } catch (error) {
    console.error('登录失败', error);
    errorMessage.value = error.message || '登录失败，请检查手机号和密码';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
  background: rgb(40, 131, 206);
  color: white;
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.logo {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 15px;
}

.logo-icon {
  width: 80px;
  height: 80px;
  border-radius: 16px;
  background-color: white;
  color: rgb(40, 131, 206);
  font-size: 48px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 15px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.login-header h1 {
  font-size: 28px;
  margin: 0;
}

.login-header p {
  margin-top: 8px;
  font-size: 16px;
  opacity: 0.9;
}

.login-form {
  width: 100%;
  max-width: 400px;
  background: white;
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-weight: 500;
  font-size: 14px;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  background: #f9f9f9;
}

.prefix {
  padding: 0 15px;
  background: #f0f0f0;
  height: 100%;
  display: flex;
  align-items: center;
  color: #666;
  font-size: 16px;
  border-right: 1px solid #e0e0e0;
}

input {
  flex: 1;
  padding: 14px 15px;
  border: none;
  background: transparent;
  font-size: 16px;
  outline: none;
}

.toggle-password {
  background: none;
  border: none;
  padding: 0 15px;
  cursor: pointer;
  color: #666;
  font-size: 18px;
}

.remember-forgot {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.remember-me {
  display: flex;
  align-items: center;
  color: #666;
  font-size: 14px;
}

.remember-me input {
  margin-right: 8px;
}

.forgot-password {
  color:rgb(19, 131, 223);
  text-decoration: none;
  font-size: 14px;
}

.login-button {
  width: 100%;
  padding: 14px;
  background-color: rgb(40, 131, 206);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  margin-top: 10px;
  transition: background-color 0.3s;
}

.login-button:disabled {
  background-color: rgb(19, 131, 223);
  cursor: not-allowed;
}

.login-button:not(:disabled):hover {
  background-color: rgb(14, 102, 173);
}

.login-methods {
  margin-top: 30px;
}

.divider {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.divider .line {
  flex: 1;
  height: 1px;
  background-color: #e0e0e0;
}

.divider .text {
  padding: 0 15px;
  color: #999;
  font-size: 14px;
}

.qr-login {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.qr-code {
  width: 150px;
  height: 150px;
  background: #f5f5f5;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
  border: 1px solid #e0e0e0;
}

.qr-placeholder {
  width: 120px;
  height: 120px;
  background: repeating-conic-gradient(#999 0% 25%, #eee 0% 50%) 50% / 20px 20px;
  border-radius: 4px;
}

.qr-login p {
  color: #666;
  font-size: 14px;
}

.error-message {
  margin-top: 20px;
  padding: 12px 20px;
  background: rgba(255, 77, 79, 0.1);
  color: #ff4d4f;
  border-radius: 8px;
  display: flex;
  align-items: center;
  max-width: 400px;
  width: 100%;
}

.icon-error {
  display: inline-block;
  width: 18px;
  height: 18px;
  background: #ff4d4f;
  border-radius: 50%;
  margin-right: 10px;
  position: relative;
}

.icon-error::before, .icon-error::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 10px;
  height: 2px;
  background: white;
}

.icon-error::before {
  transform: translate(-50%, -50%) rotate(45deg);
}

.icon-error::after {
  transform: translate(-50%, -50%) rotate(-45deg);
}

.footer {
  margin-top: 30px;
  text-align: center;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}
</style>