App({
  onLaunch() {
    if (wx.cloud) {
      wx.cloud.init({
        env: "cloud1-9g2ria5zb88ce205",
        traceUser: true
      });
    }
  }
});