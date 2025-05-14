// app.js
App({
  onLaunch() {
    console.log('小程序启动');
    // 检查是否已登录
    const isLoggedIn = wx.getStorageSync('isLoggedIn');
    if (!isLoggedIn) {
      wx.redirectTo({
        url: '/pages/login/login', // 用户未登录，跳转到登录页面
      });
    }    
  }
});