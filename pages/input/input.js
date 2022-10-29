var wxCharts = require('../../utils/wxcharts.js')
var chatType = "all"
var pickIndex

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
  console.log(item)
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
    pickerVisible: false,
    pickerTitle: '',
    // 去年和今年两年
    years: Array.from(new Array(2), (_, index) => ({
      label: `${new Date().getFullYear()-1+index}年`,
      value: new Date().getFullYear() - 1 + index,
    })),
    timeSegment: [{
        label: '早',
        value: '1'
      },
      {
        label: '晚',
        value: '2'
      },
    ],
    months: Array.from(new Array(12), (_, index) => ({
      label: `${index + 1}月`,
      value: index + 1,
    })),
    days: Array.from(new Array(31), (_, index) => ({
      label: `${index + 1}日`,
      value: index + 1
    })),
    selectedYearsWithDate: '',
    selectedMonth: '',
    selectedDay: '',
    selectedTimeSegment: '',
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
    var newItem = convert2TimeStr({
      time: Date.parse(new Date()),
      weight: 0
    })
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
    var index = e.currentTarget.dataset.index
    this.data.data[index].weight = newValue
    console.log("chagne:")
    console.log(this.data.data[index])

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
  onPickerConfirm(e) {
    var _a, _b, _c, _d;
    this.setData({
      pickerVisible: false,
      selectedYearsWithDate: (_a = e.detail.value[0]) === null || _a === void 0 ? void 0 : _a.value,
      selectedMonth: (_b = e.detail.value[1]) === null || _b === void 0 ? void 0 : _b.value,
      selectedDay: (_c = e.detail.value[2]) === null || _c === void 0 ? void 0 : _c.value,
      selectedTimeSegment: (_d = e.detail.value[3]) === null || _d === void 0 ? void 0 : _d.value,
    });
    var newDate = new Date()
    newDate.setFullYear(_a.value)
    newDate.setMonth(_b.value - 1)
    newDate.setDate(_c.value)
    var hours
    if (_d.value == 1) {
      hours = 8
    } else if (_d.value == 2) {
      hours = 20
    }
    newDate.setHours(hours)
    this.data.data[pickIndex].time = newDate.valueOf()
    convert2TimeStr(this.data.data[pickIndex])
    console.log(this.data.data)
    this.data.data.sort((a, b) => {
      return b.time - a.time
    })
    console.log(this.data.data)
    this.setData({
      data: this.data.data
    })
    updateChat(this.data.data)
    wx.setStorage({
      key: "info",
      data: this.data.data
    })
  },
  onPickerCancel() {
    this.setData({
      pickerVisible: false,
    });
  },
  longPress(e) {
    var self = this
    wx.showModal({
      title: '提示',
      content:'确认删除吗？',
      placeholderText: '',
      success: function (res) {
        if (res.confirm) {
          var index = e.currentTarget.dataset.index
          self.data.data.splice(index, 1)
          self.setData({
            data: self.data.data
          })
          updateChat(self.data.data)
          wx.setStorage({
            key: "info",
            data: self.data.data
          })
        }
      }
    })
  },
  onClickPicker(e) {
    var index = e.currentTarget.dataset.index
    pickIndex = index

    var time = new Date(this.data.data[index].time)
    this.setData({
      pickerVisible: true,
      selectedYearsWithDate: time.getFullYear(),
      selectedMonth: time.getMonth() + 1,
      selectedDay: time.getDate(),
      selectedTimeSegment: time.getHours() <= 12 ? "1" : "2",
    });
  },
  help(e) {
    wx.showModal({
      title: '帮助',
      content: "1.点击“添加新数据”，新增一条新纪录，点击条目左侧可修改时间，右侧可修改体重（数据会自动按时间重排序）\r\n2.长按某个条目，可删除某条记录\r\n3.体重数据全部保存在手机本地，如果要换手机，可点击导出到剪切板。在新手机上通过导入数据复制之前导出的数据",
    })
  },
});