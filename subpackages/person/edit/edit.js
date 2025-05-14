import { updateEmployee, getUserInfo } from '../../../utils/api';

Page({
  data: {
    id: '',         
    username: '',
    name: '',
    phone: '',
    sex: '',
    idNumber: '',
    sexArray: ['男', '女'],
    sexIndex: 0,
    loading: true,
    isEditing: {
      username: false,
      name: false,
      phone: false,
      sex: false,
      idNumber: false
    }
  },

  onLoad() {
    const userId = wx.getStorageSync('userId');
    if (!userId) {
      wx.showToast({
        title: '未登录，请重新登录',
        icon: 'none',
        success: () => {
          wx.reLaunch({ url: '/pages/login/login' });  // 跳转登录页
        }
      });
      return;
    }
    
    // 设置id并获取用户信息
    this.setData({ id: userId });
    this.fetchUserInfo(userId);
  },

  // 获取用户信息
  fetchUserInfo(userId) {
    wx.showLoading({ title: '加载中...' });
    getUserInfo(userId)
      .then(res => {
        if (res.code === 1 && res.data) {
          const userData = res.data;
          // 设置性别索引
          const sexIndex = this.data.sexArray.findIndex(item => item === userData.sex);
          this.setData({
            username: userData.username || '',
            name: userData.name || '',
            phone: userData.phone || '',
            sex: userData.sex || '',
            idNumber: userData.idNumber || '',
            sexIndex: sexIndex >= 0 ? sexIndex : 0,
            loading: false
          });
        } else {
          wx.showToast({ title: '获取用户信息失败', icon: 'none' });
        }
      })
      .catch(err => {
        console.error('获取用户信息失败:', err);
        wx.showToast({ title: '获取用户信息失败', icon: 'none' });
      })
      .finally(() => {
        wx.hideLoading();
      });
  },

  // 输入事件处理
  onUsernameInput(e) {
    this.setData({ 
      username: e.detail.value,
      'isEditing.username': true
    });
  },
  onNameInput(e) {
    this.setData({ 
      name: e.detail.value,
      'isEditing.name': true
    });
  },
  onPhoneInput(e) {
    this.setData({ 
      phone: e.detail.value,
      'isEditing.phone': true
    });
  },
  onSexChange(e) {
    this.setData({
      sexIndex: e.detail.value,
      sex: this.data.sexArray[e.detail.value],
      'isEditing.sex': true
    });
  },
  onIdNumberInput(e) {
    this.setData({ 
      idNumber: e.detail.value,
      'isEditing.idNumber': true
    });
  },

  // 提交表单
  submitForm() {
    const { id, username, name, phone, sex, idNumber } = this.data;

    // 表单验证
    if (!username || !name || !phone || !sex || !idNumber) {
      wx.showToast({ title: '请填写完整信息', icon: 'none' });
      return;
    }
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' });
      return;
    }
    if (!/^\d{17}[\dXx]$/.test(idNumber)) {
      wx.showToast({ title: '请输入正确的身份证号', icon: 'none' });
      return;
    }

    // 调用更新接口
    updateEmployee({ id, username, name, phone, sex, idNumber })
      .then(res => {
        if (res.code === 1) {
          wx.showToast({
            title: '修改成功',
            icon: 'success',
            duration: 2000,
            success: () => {
              setTimeout(() => wx.navigateBack(), 2000);
            }
          });
        } else {
          wx.showToast({ title: res.msg || '修改失败', icon: 'none' });
        }
      })
      .catch(err => {
        console.error('修改失败:', err);
        wx.showToast({ title: '修改失败', icon: 'none' });
      });
  }
});