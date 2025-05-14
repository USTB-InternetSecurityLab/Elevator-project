Page({
  data: {
    // 轮播图数据
    swiperList: [
      { id: 1, image: "/pages/images/product.jpg" },
      { id: 2, image: "/pages/images/product_2.jpg" },
      { id: 3, image: "/pages/images/product_4.jpg" }
    ],
    // 产品数据
    onClickPoster() {
      wx.previewImage({
        urls: ['/pages/images/product_poster2.jpg'] // 点击放大查看海报
      })
  }
}
})