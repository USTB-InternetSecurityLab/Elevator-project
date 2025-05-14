// subpackages/person/index/index.js
import { getUserInfo } from '../../../utils/api';

Page({
  data: {
    userInfo: {
      id: 0,
      username: '',
      name: '',
      companyId: '',
      phone: '',
      sex: '',
      idNumber: '',
      role: '',
      status: 0
    },
    loading: true
  },

  onLoad() {
    this.loadUserInfo();
  },

  onShow() {
    this.loadUserInfo();  // 每次页面显示时加载数据
  },

  async loadUserInfo() {
    try {
      const userId = wx.getStorageSync('userId');
      const res = await getUserInfo(userId);
      if (res.code === 1) {
        this.setData({
          userInfo: res.data,
          loading: false
        });
      } else {
        wx.showToast({
          title: res.msg || '获取用户信息失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
      wx.showToast({
        title: '获取用户信息失败',
        icon: 'none'
      });
    }
  },

  // 编辑个人信息
  editProfile() {
    wx.navigateTo({
      url: '/subpackages/person/edit/edit'
    });
  },
    // 修改用户密码
  changePassword() {
      wx.navigateTo({
        url: '/subpackages/person/change/change'
      });
    }
});