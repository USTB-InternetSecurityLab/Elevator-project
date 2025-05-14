// pages/nearby/nearby.js
import { getDevicesByCompanyId, getDeviceElevators } from '../../utils/api';

Page({
  data: {
    userLocation: null, 
    markers: [], 
    longitude: 116.397428, 
    latitude: 39.90923, 
    scale: 16, // 地图缩放级别
    showPanel: false, // 是否显示信息面板
    selectedElevator: null, // 选中的电梯信息
    safeAreaInsets: {}, // 安全区域
    loading: true, // 加载状态
    elevators: [], // 新增电梯数据
    isMarkerTapped: false // 新增：标记是否被点击
  },

  onLoad() {
    // 获取安全区域
    const systemInfo = wx.getSystemInfoSync();
    this.setData({
      safeAreaInsets: systemInfo.safeArea
    });
    
    // 获取用户位置
    this.getUserLocation();
  },

  // 获取用户位置
  getUserLocation() {
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        this.setData({
          userLocation: {
            latitude: res.latitude,
            longitude: res.longitude
          },
          longitude: res.longitude,
          latitude: res.latitude
        });
        // 获取电梯列表
        this.getElevatorList();
      },
      fail: () => {
        wx.showToast({
          title: '请开启位置权限',
          icon: 'none'
        });
        this.setData({ loading: false });
      }
    });
  },

  // 获取电梯列表
  async getElevatorList() {
    try {
      // 获取用户信息
      const userInfo = wx.getStorageSync('userInfo');
      if (!userInfo || !userInfo.companyId) {
        wx.showToast({
          title: '获取用户信息失败',
          icon: 'none'
        });
        this.setData({ loading: false });
        return;
      }

      // 获取设备列表
      const devicesRes = await getDevicesByCompanyId(userInfo.companyId);
      if (devicesRes.code !== 1) {
        wx.showToast({
          title: devicesRes.msg || '获取设备列表失败',
          icon: 'none'
        });
        this.setData({ loading: false });
        return;
      }

      // 获取所有电梯信息
      const elevators = [];
      for (const device of devicesRes.data) {
        const elevatorsRes = await getDeviceElevators(device.id);
        if (elevatorsRes.code === 1 && elevatorsRes.data) {
          elevators.push(elevatorsRes.data);
        }
      }

      console.log("所有电梯信息：", elevators);
      // 计算5公里范围内的电梯
      const nearbyElevators = this.calculateNearbyElevators(elevators);
      console.log("5公里范围内的电梯：", nearbyElevators);

      if (nearbyElevators.length === 0) {
        wx.showToast({
          title: '附近暂无电梯',
          icon: 'none'
        });
        this.setData({ loading: false });
        return;
      }

      // 生成地图标记
      const markers = nearbyElevators.map((elevator, index) => ({
        id: index,
        latitude: parseFloat(elevator.latitude),
        longitude: parseFloat(elevator.longitude),
        title: elevator.elevatorName,
        iconPath: '/images/marker.png',
        width: 32,
        height: 32,
        callout: {
          content: elevator.elevatorName,
          color: '#000000',
          fontSize: 12,
          borderRadius: 4,
          bgColor: '#ffffff',
          padding: 4,
          display: 'ALWAYS'
        }
      }));

      console.log("生成的地图标记：", markers);

      // 更新地图中心点
      const firstElevator = nearbyElevators[0];
      this.setData({
        markers,
        longitude: parseFloat(firstElevator.longitude),
        latitude: parseFloat(firstElevator.latitude),
        elevators,
        loading: false
      });

    } catch (error) {
      console.error('获取电梯列表失败:', error);
      wx.showToast({
        title: '获取电梯列表失败',
        icon: 'none'
      });
      this.setData({ loading: false });
    }
  },

  // 计算5公里范围内的电梯
  calculateNearbyElevators(elevators) {
    const { userLocation } = this.data;
    console.log("当前位置：", userLocation);
    console.log("所有电梯：", elevators);
    
    if (!userLocation) {
      console.log("用户位置未获取到");
      return [];
    }

      //扁平化二维数组
      const flatElevators = elevators.flat();
      console.log("扁平化后的电梯数据：", flatElevators);

      const nearbyElevators = flatElevators.filter(elevator => {
      if (!elevator.latitude || !elevator.longitude) {
        console.log("电梯位置数据不完整：", elevator);
        return false;
      }
      
      const distance = this.calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        parseFloat(elevator.latitude),
        parseFloat(elevator.longitude)
      );
      return distance <= 8; // 5公里范围内
    });

    console.log("筛选后的电梯数量：", nearbyElevators.length);
    return nearbyElevators;
  },

  // 计算两点距离算法
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // 地球半径
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    console.log(`计算距离：(${lat1},${lng1}) 到 (${lat2},${lng2}) 的距离是 ${distance} 公里`);
    return distance;
  },

  // 角度转弧度
  toRad(degrees) {
    return degrees * Math.PI / 180;
  },

  // 标记点击事件
  onMarkerTap(e) {
    try {
      const markerId = e.detail.markerId;
      console.log('点击的标记ID:', markerId);
      
      if (!this.data.markers[markerId]) {
        console.error('未找到对应的标记数据');
        return;
      }
      
      // 从扁平化的电梯数据中找到对应的电梯信息
      const flatElevators = this.data.elevators.flat();
      const elevator = flatElevators.find(e => {
        if (!e || !e.latitude || !e.longitude) return false;
        return Math.abs(parseFloat(e.latitude) - this.data.markers[markerId].latitude) < 0.000001 && 
               Math.abs(parseFloat(e.longitude) - this.data.markers[markerId].longitude) < 0.000001;
      });
      
      if (elevator) {
        const selectedElevator = {
          title: elevator.elevatorName,
          address: elevator.address,
          manufacturer: elevator.manufacturer,
          installationDate: elevator.installationDate,
          lastMaintenanceDate: elevator.lastMaintenanceDate,
          status: elevator.status,
          floorCount: elevator.floorCount,
          deviceId: elevator.deviceId
        };
        
        this.setData({
          selectedElevator,
          showPanel: true
        });
      } else {
        wx.showToast({
          title: '未找到电梯信息',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('标记点击事件处理失败:', error);
      wx.showToast({
        title: '操作失败',
        icon: 'none'
      });
    }
  },

  // 关闭信息面板
  closePanel() {
    this.setData({
      showPanel: false,
      selectedElevator: null
    });
  }
});