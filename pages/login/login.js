import { login, getUserInfo } from '../../utils/api';

Page({
  data: {
    username: '',
    password: '',
    remember: false,
    loading: false
  },

  onLoad() {
    // 页面加载时检查是否有保存的用户信息
    const savedUsername = wx.getStorageSync('username');
    const savedPassword = wx.getStorageSync('password');
    const savedRemember = wx.getStorageSync('remember'); // 获取勾选状态

    if (savedRemember) {
      this.setData({
        username: savedUsername,
        password: savedPassword,
        remember: true,
      });
    }
  },

  // 获取用户名输入
  handleUsernameInput(e) {
    this.setData({
      username: e.detail.value
    });
  },

  // 获取密码输入
  handlePasswordInput(e) {
    this.setData({
      password: e.detail.value
    });
  },

  // 登录逻辑
  async handleLogin() {
    const { username, password, remember } = this.data;
    
    if (!username || !password) {
      wx.showToast({
        title: '请输入用户名和密码',
        icon: 'none'
      });
      return;
    }

    this.setData({ loading: true });

    try {
      // 1. 先进行登录
      const loginRes = await login({ username, password });
      
      if (loginRes.code === 1) {
        // 保存 token
        wx.setStorageSync('token', loginRes.data.token);
        wx.setStorageSync('userId', loginRes.data.id);
        
        // 2. 立即获取用户详细信息
        const userInfoRes = await getUserInfo(loginRes.data.id);
        
        if (userInfoRes.code === 1) {
          // 保存用户详细信息
          wx.setStorageSync('userInfo', userInfoRes.data);
          // 保存登录信息
          if (remember) {
            wx.setStorageSync('username', username);
            wx.setStorageSync('password', password);
            wx.setStorageSync('remember', true);
          } else {
            wx.removeStorageSync('username');
            wx.removeStorageSync('password');
            wx.removeStorageSync('remember');
          }

          // 登录成功
          wx.setStorageSync('isLoggedIn', true);
          wx.switchTab({
            url: '/pages/home/home'
          });
        } else {
          throw new Error(userInfoRes.msg || '获取用户信息失败');
        }
      } else {
        throw new Error(loginRes.msg || '登录失败');
      }
    } catch (error) {
      console.error('登录失败:', error);
      wx.showToast({
        title: error.message || '登录失败，请检查用户名和密码',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  }
});
