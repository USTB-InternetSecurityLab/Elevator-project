// pages/deviceList/deviceList.js
import { getDevicesByCompanyId } from '../../utils/api';

Page({
  data: {
    devices: [],
    allDevices: [], // 存储所有设备数据
    loading: true,
    currentPage: 1,
    pageSize: 5,
    total: 0,
    hasMore: true,
    searchKeyword: '', // 搜索关键词
    totalPages: 0
  },

  onLoad() {
    this.loadDeviceList();
  },

  async loadDeviceList() {
    try {
      const userInfo = wx.getStorageSync('userInfo');
      if (!userInfo || !userInfo.companyId) {
        wx.showToast({
          title: '未获取到企业信息',
          icon: 'none'
        });
        return;
      }

      this.setData({ loading: true });
      const res = await getDevicesByCompanyId(userInfo.companyId);
      
      if (res.code === 1) {
        await this.setData({
          allDevices: res.data,
          total: res.data.length,
        });     
        this.filterAndPaginateDevices();
      } else {
        wx.showToast({
          title: res.msg || '获取设备列表失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('加载设备列表失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 处理搜索输入
  handleSearch(e) {
    const keyword = e.detail.value.trim();
    this.setData({
      searchKeyword: keyword,
      currentPage: 1
    });
    this.filterAndPaginateDevices();
  },

  // 过滤和分页设备数据
  filterAndPaginateDevices() {
    const { allDevices, searchKeyword, currentPage, pageSize } = this.data;
    
    // 过滤设备
    let filteredDevices = allDevices;
    if (searchKeyword) {
      filteredDevices = allDevices.filter(device => 
        device.deviceName.toLowerCase().includes(searchKeyword.toLowerCase())
      );
    }

    // 计算总页数
    const total = filteredDevices.length;
    const totalPages = Math.ceil(total / pageSize); 

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const currentPageDevices = filteredDevices.slice(startIndex, endIndex);

    this.setData({
      devices: currentPageDevices,
      total: total,
      hasMore: endIndex < total,
      totalPages: totalPages
    });
  },

  // 跳转到设备详情页
  navigateToDeviceDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/subpackages/device/deviceDetail/deviceDetail?id=${id}`
    });
  },

  // 处理分页
  handlePageChange(e) {
    const type = e.currentTarget.dataset.type;
    let page = this.data.currentPage;
    page = type === 'next' ? page + 1 : page - 1;
    
    if (page > 0 && page <= this.data.totalPages) {
      this.setData({ currentPage: page });
      this.filterAndPaginateDevices();
      wx.pageScrollTo({ scrollTop: 0 });
    }
  }
});