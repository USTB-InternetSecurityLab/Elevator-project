// subpackages/map/elevatorMap/elevatorMap.js
import { getElevatorDetail } from '../../../utils/api';
const QQMapWX = require('../../../utils/qqmap-wx-jssdk.js');
const qqmapsdk = new QQMapWX({ key: 'VFRBZ-O4YYJ-UBDFY-DIL4U-32PBE-65F4U' });
const app = getApp()

Page({
  data: {
    elevatorInfo: null,
    loading: true,
    markers: [],
    latitude: 0,
    longitude: 0,
    scale: 16,
    showPanel: false,
    panelHeight: '40%',
    statusMap: {
      1: { text: '运行中', class: 'status-normal' },
      2: { text: '维护中', class: 'status-warning' },
      3: { text: '停用中', class: 'status-disabled' }
    },
    isPanelExpanded: false,
    currentElevator: null
  },

  onLoad(options) {
    if (options.id) {
      this.loadElevatorDetail(options.id);
    } else {
      this.loadElevatorData();
    }
  },

  async loadElevatorDetail(id) {
    try {
      this.setData({ loading: true });
      const res = await getElevatorDetail(id);
      
      if (res.code === 1) {
        const elevatorInfo = res.data;
        this.setData({
          elevatorInfo,
          latitude: parseFloat(elevatorInfo.latitude),
          longitude: parseFloat(elevatorInfo.longitude),
          markers: [{
            id: elevatorInfo.id,
            latitude: parseFloat(elevatorInfo.latitude),
            longitude: parseFloat(elevatorInfo.longitude),
            title: elevatorInfo.elevatorName,
            iconPath: '/images/marker.png',
            width: 30,
            height: 30
          }]
        });

        // 使用腾讯地图API进行逆地址解析
        qqmapsdk.reverseGeocoder({
          location: {
            latitude: parseFloat(elevatorInfo.latitude),
            longitude: parseFloat(elevatorInfo.longitude)
          },
          success: (res) => {
            const address = res.result.address;
            this.setData({
              'elevatorInfo.address': address
            });
          }
        });
      } else {
        wx.showToast({
          title: res.msg || '获取电梯信息失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('加载电梯详情失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 地图标记点击事件
  onMarkerTap(e) {
    this.setData({
      showPanel: true
    });
  },

  // 地图点击事件
  onMapTap() {
    this.setData({
      showPanel: false
    });
  },

  // 加载电梯数据
  async loadElevatorData() {
    try {
      this.setData({ loading: true })
      
      // 获取电梯列表
      const res = await wx.cloud.callFunction({
        name: 'getElevatorList'
      })
      
      const elevators = res.result.data
      
      // 处理标记点数据
      const markers = elevators.map(elevator => ({
        id: elevator._id,
        latitude: elevator.location.latitude,
        longitude: elevator.location.longitude,
        title: elevator.name,
        iconPath: this.getMarkerIcon(elevator.status),
        width: 32,
        height: 32,
        callout: {
          content: elevator.name,
          color: '#333',
          fontSize: 14,
          borderRadius: 4,
          bgColor: '#fff',
          padding: 4,
          display: 'ALWAYS'
        }
      }))
      
      this.setData({
        markers,
        loading: false
      })
      
      // 如果有电梯数据，设置地图中心点
      if (elevators.length > 0) {
        this.setData({
          latitude: elevators[0].location.latitude,
          longitude: elevators[0].location.longitude
        })
      }
    } catch (error) {
      console.error('加载电梯数据失败:', error)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
      this.setData({ loading: false })
    }
  },

  // 获取标记点图标
  getMarkerIcon(status) {
    const iconMap = {
      normal: '/images/marker-normal.png',
      warning: '/images/marker-warning.png',
      error: '/images/marker-error.png'
    }
    return iconMap[status] || iconMap.normal
  },

  // 标记点点击事件
  async onMarkerTap(e) {
    const markerId = e.markerId
    try {
      // 获取电梯详情
      const res = await wx.cloud.callFunction({
        name: 'getElevatorDetail',
        data: { id: markerId }
      })
      
      const elevator = res.result.data
      this.setData({
        currentElevator: elevator,
        isPanelExpanded: true
      })
    } catch (error) {
      console.error('获取电梯详情失败:', error)
      wx.showToast({
        title: '获取详情失败',
        icon: 'none'
      })
    }
  },

  // 面板滑动事件
  onPanelTouchStart(e) {
    this.startY = e.touches[0].clientY
  },

  onPanelTouchMove(e) {
    const currentY = e.touches[0].clientY
    const deltaY = currentY - this.startY
    
    if (deltaY > 50) { // 向下滑动
      this.setData({ isPanelExpanded: false })
    } else if (deltaY < -50) { // 向上滑动
      this.setData({ isPanelExpanded: true })
    }
  },

  // 地图移动事件
  onMapMove(e) {
    // 可以在这里添加地图移动时的逻辑
  },

  // 下拉刷新
  async onPullDownRefresh() {
    await this.loadElevatorData()
    wx.stopPullDownRefresh()
  }
});