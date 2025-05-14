// pages/profile/profile.js
import { getUserInfo } from '../../utils/api';

Page({
  data: {
    userInfo: {
      name: '',
      username: '',
      phone: '',
      role: '',
      status: 0
    },
    loading: true
  },

  onLoad() {
    this.loadUserProfile();
  },

  async loadUserProfile() {
    try {
      const userId = wx.getStorageSync('userId');
      const response = await getUserInfo(userId);
      
      if (response.code === 1 && response.data) {
        this.setData({
          userInfo: response.data,
          loading: false
        });
      } else {
        throw new Error('获取用户信息失败');
      }
    } catch (error) {
      console.error('加载用户信息失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
      this.setData({ loading: false });
    }
  },

  // 跳转个人详情页
  navigateToUserDetail: function() {
    wx.navigateTo({
      url: '/subpackages/person/index/index'
    })
  },

  // 跳转设备列表页
  navigateToDeviceList: function() {
    wx.switchTab({
      url: '/pages/deviceList/deviceList'
    })
  },

  // 意见反馈页
  navigateToFeedback: function() {
    wx.navigateTo({
      url: '/subpackages/person/feedback'
    })
  },

  // 关于我们页
  navigateToAbout: function() {
    wx.navigateTo({
      url: '/subpackages/person/about'
    })
  },

  // 退出登录提示
  handleLogout: function() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorageSync()
          wx.reLaunch({
            url: '/pages/login/login'
          })
        }
      }
    })
  }
}) 