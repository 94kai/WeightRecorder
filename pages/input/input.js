var wxCharts = require('../../utils/wxcharts.js')
var chatType = "all"

function convert2TimeStr(item) {
  var blank = ""
  var myDate = new Date(parseInt(item.time));
  var myTime = blank.concat(
    myDate.getFullYear(),
    "-",
    (myDate.getMonth() + 1 < 10 ? '0' + (myDate.getMonth() + 1) : myDate.getMonth() + 1),
    "-",
    myDate.getDate() < 10 ? '0' + myDate.getDate() : myDate.getDate(), " ",
    myDate.getHours() <= 12 ? "早" : "晚");
  item.timeStr = myTime
  return item
}

function updateChat(data) {
  var newData = data.filter(element => {
    if (chatType == "morning") {
      return element.timeStr.indexOf("早") > 0;
    } else if (chatType == "night") {
      return element.timeStr.indexOf("晚") > 0;
    } else {
      return true;
    }
  });
  if (newData.length == 0) {
    return
  }
  new wxCharts({
    canvasId: 'myCanvas',
    type: 'line',
    legend: false,
    extra: {
      lineStyle: 'curve'
    },
    categories: newData.map(item => item.timeStr).reverse(),
    series: [{
      data: newData.map(item => item.weight).reverse(),
      format: function (val) {
        return val;
      }
    }],
    yAxis: {
      title: '体重',
      format: function (val) {
        return val;
      },
      min: 115,
    },
    width: wx.getSystemInfoSync().windowWidth,
    height: 200
  });
}
Page({
  data: {
    data: [],
    inputVal: [] //所有input的内容
  },
  onShareAppMessage: function () {},
  onShareTimeline: function () {},

  onShow: function () {
    // getFromLocal
    var that = this
    wx.getStorage({
      key: 'info',
      success(res) {
        var originData = res.data
        // originData.reverse()
        //遍历key和value
        originData.forEach(function (item, key) {
          convert2TimeStr(item)
        })
        that.setData({
          data: originData
        })
        updateChat(originData)
      }
    })

  },

  //获取input的值
  addRecord: function (e) {
    var data = this.data.data;
    // 去重判断
    var newItem = convert2TimeStr({
      time: Date.parse(new Date()),
      weight: 0
    })
    var has = false
    data.forEach(function (item, key) {
      if (item.timeStr == newItem.timeStr) {
        has = true
      }
    })
    if (has) {
      wx.showModal({
        title: '提示',
        content: '该时间段已添加',
        success: function (res) {
          if (res.confirm) {
            console.log('确定')
          } else if (res.cancel) {
            console.log('取消')
          }
        }
      })
      return
    }
    data.splice(0, 0, newItem);
    this.setData({
      data: data
    })
    updateChat(data)

    wx.setStorage({
      key: "info",
      data: this.data.data
    })
  },
  inputComplete: function (e) {
    var newValue = e.detail.value
    var id = e.currentTarget.id
    this.data.data.forEach(function (item, key) {
      if (item.time == id) {
        item.weight = newValue
        console.log("change:" + item.timeStr + " " + newValue)
        return
      }
    })
    this.setData({
      data: this.data.data
    })
    updateChat(this.data.data)
    wx.setStorage({
      key: "info",
      data: this.data.data
    })
  },
  radioChange: function (e) {
    chatType = e.detail.value
    updateChat(this.data.data)
  },
  output2Clipboard: function (e) {
    wx.setClipboardData({
      data: JSON.stringify(this.data.data),
      success: function (res) {
        wx.showModal({
          title: '提示',
          content: '复制成功',
          success: function (res) {
            if (res.confirm) {
              console.log('确定')
            } else if (res.cancel) {
              console.log('取消')
            }
          }
        })
      }
    });

  },
  inputData: function (e) {
    var self = this
    wx.showModal({
      title: '请粘贴数据（数据可先导出到剪切板，然后通过记事本修改，再进行导入。导入后会删除原始数据，谨慎操作）',
      editable: true,
      placeholderText: '',
      success: function (res) {
        var newData = JSON.parse(res.content)
        newData.forEach(function (item, key) {
          convert2TimeStr(item)
        })
        self.setData({
          data: newData
        })
        updateChat(self.data.data)
        wx.setStorage({
          key: "info",
          data: newData
        })
        wx.showModal({
          title: '提示',
          content: '导入成功',
        })
      }
    })
  },
  addHistoryData: function (e) {
    var self = this
    wx.showModal({
      title: '提示',
      editable: true,
      placeholderText: '需要添加的历史数据个数',
      success: function (res) {
        if (res.confirm) {
          if ((/(^[0-9]*$)/.test(res.content) && res.content != "")) {
            wx.showModal({
              title: '提示',
              content: '添加成功',
            })
            var lastItemStr = JSON.stringify(self.data.data[self.data.data.length - 1])
            console.log(lastItemStr)
            for (var i = 0; i < res.content; i++) {
              var newItem = JSON.parse(lastItemStr);
              newItem.time = newItem.time - 12 * 60 * 60 * 1000 * (i + 1)
              newItem.weight = 0
              console.log(newItem.time)
              self.data.data.push(newItem)
              convert2TimeStr(newItem)
            }
            self.setData({
              data: self.data.data
            })
            updateChat(self.data.data)
            wx.setStorage({
              key: "info",
              data: self.data.data
            })
          } else {
            wx.showModal({
              title: '提示',
              content: '请输入整数',
            })
          }
        }
      }
    })
  }
});