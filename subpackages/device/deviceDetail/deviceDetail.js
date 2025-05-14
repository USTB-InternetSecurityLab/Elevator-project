// pages/deviceDetail/deviceDetail.js
import { getDeviceDetail, getDeviceBlockchainData, getDeviceElevators } from '../../../utils/api';
import * as echarts from '../../../utils/ec-canvas/echarts';

let chart = null;

function initChart(canvas, width, height, dpr) {
  chart = echarts.init(canvas, null, {
    width: width,
    height: height,
    devicePixelRatio: dpr
  });
  canvas.setChart(chart);

  const option = {
    title: {
      text: '发电量数据统计',
      left: 'center',
      textStyle: {
        fontSize: 14,
        color: '#333'
      }
    },
    tooltip: {
      trigger: 'axis',
      formatter: function(params) {
        return `${params[0].name}\n发电量: ${params[0].value} kWh`;
      }
    },
    grid: {
      left: '15%',
      right: '5%',
      bottom: '15%'
    },
    xAxis: {
      type: 'category',
      data: [],
      axisLabel: {
        color: '#666',
        interval: 0,
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      name: '发电量(kWh)',
      nameTextStyle: {
        color: '#666'
      },
      axisLabel: {
        color: '#666'
      }
    },
    series: [{
      name: '发电量',
      type: 'line',
      smooth: true,
      data: [],
      itemStyle: {
        color: '#1890ff'
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [{
            offset: 0,
            color: 'rgba(24,144,255,0.3)'
          }, {
            offset: 1,
            color: 'rgba(24,144,255,0.1)'
          }]
        }
      }
    }]
  };

  chart.setOption(option);
  return chart;
}

Page({
  data: {
    deviceId: null,
    deviceInfo: null,
    blockchainData: {
      deviceStatus: '',
      statusDate: '',
      deviceSn: '',
      dailyPowerGeneration: 0,
      deviceCompanyId: ''
    },
    blockchainDataList: [], // 存储所有的区块链数据
    elevatorList: [],
    loading: true,
    ec: {
      onInit: initChart
    },
    systemInfo: {
      windowWidth: wx.getWindowInfo().windowWidth,
      windowHeight: wx.getWindowInfo().windowHeight,
      pixelRatio: wx.getSystemSetting().devicePixelRatio
    }
  },

  onLoad(options) {
    const deviceId = options.id;
    this.setData({ 
      deviceId,
      systemInfo: {
        windowWidth: wx.getWindowInfo().windowWidth,
        windowHeight: wx.getWindowInfo().windowHeight,
        pixelRatio: wx.getSystemSetting().devicePixelRatio
      }
    });
    this.loadDeviceData();
  },
  
  updateChart() {
    if (!chart || !this.data.blockchainDataList.length) return;

    try {
      // 按时间排序数据
      const sortedData = [...this.data.blockchainDataList].sort((a, b) => 
        new Date(a.statusDate) - new Date(b.statusDate)
      );

      // 提取时间和发电量数据
      const dates = sortedData.map(item => {
        const date = new Date(item.statusDate);
        return `${date.getMonth() + 1}/${date.getDate()}\n${date.getHours()}:${date.getMinutes()}`;
      });
      const powerData = sortedData.map(item => item.dailyPowerGeneration);

      const option = {
        xAxis: {
          data: dates
        },
        series: [{
          data: powerData
        }]
      };
      
      chart.setOption(option);
    } catch (error) {
      console.error('更新图表失败:', error);
    }
  },
  
  async loadDeviceData() {
    try {
      this.setData({ loading: true });
      // 实际API调用
      const deviceRes = await getDeviceDetail(this.data.deviceId);
      if (deviceRes.code !== 1) {
        throw new Error(deviceRes.msg || '获取设备信息失败');
      }

      const blockchainRes = await getDeviceBlockchainData(this.data.deviceId);
      if (blockchainRes.code !== 1) {
        throw new Error(blockchainRes.msg || '获取区块链数据失败');
      }

      const elevatorRes = await getDeviceElevators(this.data.deviceId);
      if (elevatorRes.code !== 1) {
        throw new Error(elevatorRes.msg || '获取电梯列表失败');
      }

      // 保存所有区块链数据
      const blockchainDataList = blockchainRes.data || [];
      // 取最新的一条数据作为当前状态
      const latestBlockchainData = blockchainDataList[0] || {
        deviceStatus: '',
        statusDate: '',
        deviceSn: '',
        dailyPowerGeneration: 0,
        deviceCompanyId: ''
      };

      this.setData({
        deviceInfo: deviceRes.data,
        blockchainData: latestBlockchainData,
        blockchainDataList: blockchainDataList,
        elevatorList: elevatorRes.data,
        loading: false
      }, () => {
        // 数据更新后更新图表
        setTimeout(() => {
          this.updateChart();
        }, 100);
      });
    } catch (error) {
      console.error('加载设备数据失败:', error);
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none'
      });
      this.setData({ loading: false });
    }
  },

  goToElevatorMap(e) {
    const elevatorId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/subpackages/map/elevatorMap/elevatorMap?id=${elevatorId}`
    });
  }
})