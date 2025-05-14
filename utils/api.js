const BASE_URL = 'http://39.106.77.250:9091';

// 统一的请求方法
const request = (url, method, data) => {
  const token = wx.getStorageSync('token');
  console.log('[发起请求] URL:', url);
  console.log('[发起请求] Token:', token);
  console.log('[发起请求] 完整请求头:', {
    'content-type': 'application/json',
    'token': `Bearer ${token}`
  });
  
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${BASE_URL}${url}`,
      method,
      data,
      header: {
        'content-type': 'application/json',
        'token': /* `Bearer ${token}` */token
      },
      success: (res) => {
        console.log('[响应] 完整数据:', res.data);
        if (res.statusCode === 200) {
          resolve(res.data);
        } else if (res.statusCode === 401) {
          wx.removeStorageSync('token');
          wx.redirectTo({
            url: '/pages/login/login'
          });
          reject(new Error('登录已过期'));
        } else {
          reject(res);
        }
      },
      fail: (err) => {
        reject(err);
      }
    });
  });
};

// 登录请求方法
const loginRequest = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${BASE_URL}/admin/employee/login`,
      method: 'POST',
      data,
      header: {
        'content-type': 'application/json'
      },
      success: (res) => {
        console.log('[登录响应] 完整数据:', res.data);
        if (res.statusCode === 200 && res.data.code === 1) {
          // 登录成功，存储token
          wx.setStorageSync('token', res.data.data.token);
          resolve(res.data);
        } else {
          reject(res);
        }
      },
      fail: (err) => {
        reject(err);
      }
    });
  });
};

// 用户相关接口
export const login = (data) => loginRequest(data);
export const logout = () => request('/admin/employee/logout', 'POST');
export const getUserInfo = (id) => request(`/admin/employee/getEmployeeById/${id}`, 'GET');
export const updateEmployee = (data) => request('/admin/employee', 'PUT', data);
export const changePassword = (data) => request('/admin/employee/forgetPassword','POST',data);
// 设备相关接口
export const getDevicesByCompanyId = (companyId) => request(`/admin/employee/getDevicesById/${companyId}`, 'GET');
export const getDeviceDetail = (id) => request(`/admin/device/${id}`, 'GET');
export const getDeviceBlockchainData = (deviceId) => request(`/admin/device/queryOnChainInfoByDeviceId/${deviceId}`, 'GET');
export const getDeviceElevators = (deviceId) => request(`/admin/device/getElevatorsById/${deviceId}`, 'GET');

// 电梯相关接口
export const getElevatorDetail = (id) => request(`/admin/elevator/${id}`, 'GET');
