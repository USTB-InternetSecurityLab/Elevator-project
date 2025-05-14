// subpackages/person/change/change.js
import { getUserInfo,changePassword } from '../../../utils/api';

Page({
  data: {
    newPassword: '',     
    confirmPassword: '',  
    username: ''          
  },

  onLoad() {
    this.findUsername();
  },

  async findUsername() {
    const userId = wx.getStorageSync('userId');
    if (!userId) {
      wx.showToast({ title: '未登录', icon: 'none' });
      setTimeout(() => wx.reLaunch({ url: '/pages/login/login' }), 1500);
      return;
    }

    try {
      const res = await getUserInfo(userId);
      if (res.code === 1) {
        this.setData({ username: res.data.username });
      } else {
        throw new Error(res.msg || '获取用户信息失败');
      }
    } catch (err) {
      console.error('获取用户信息失败:', err);
      wx.showToast({ title: '获取用户信息失败', icon: 'none' });
      return;
    }

    if (!this.data.username) {
      wx.showToast({ title: '未获取到用户名', icon: 'none' });
      setTimeout(() => wx.reLaunch({ url: '/pages/login/login' }), 1500);
    }
  },

  // 输入新密码
  onNewPasswordInput(e) {
    this.setData({ newPassword: e.detail.value });
  },

  // 输入确认密码
  onConfirmPasswordInput(e) {
    this.setData({ confirmPassword: e.detail.value });
  },

  // 提交表单
  submitForm() {
    const { username, newPassword, confirmPassword } = this.data;

    // 表单验证
    if (!newPassword || !confirmPassword) {
      wx.showToast({ title: '请填写完整', icon: 'none' });
      return;
    }
    if (newPassword !== confirmPassword) {
      wx.showToast({ title: '两次输入密码不一致', icon: 'none' });
      return;
    }
    if (newPassword.length < 6) {
      wx.showToast({ title: '密码至少6位', icon: 'none' });
      return;
    }

    // 调用接口
    changePassword({
      username,
      password: newPassword  // 新密码作为参数
    })
      .then(res => {
        if (res.code === 1) {
          wx.showToast({
            title: '修改成功',
            icon: 'success',
            duration: 2000,
            success: () => {
              // 更新缓存中的密码（可选）
              wx.setStorageSync('password', newPassword);
              setTimeout(() => wx.navigateBack(), 2000);
            }
          });
        } else {
          wx.showToast({ title: res.msg || '修改失败', icon: 'none' });
        }
      })
      .catch(err => {
        console.error('修改密码失败:', err);
        wx.showToast({ title: '请求失败', icon: 'none' });
      });
  }
});