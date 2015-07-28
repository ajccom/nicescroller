# NiceScroller
轻量级移动端模拟滚动插件。

目前NiceScroller的限制及缺陷：

- 依赖jQuery/Zepto；

目前NiceScroller具备的能力：

- 动态获取滑动方向；
- 支持惯性滑动；
- 支持嵌套。

使用NiceScroller的优势：

- 体积小，压缩后(开启gzip)文件大小只有2.3K；
- 支持桌面与移动端。

## 用法

```
<ul id="scroller1">
  <div>content</div>
</ul>
```

```
var scroller = new NiceScroller('#scroller1')
```

-------------------------------------

## 配置

`new NiceScroller('#scroller1', config)`

配置名 | 类型 | 默认值 | 说明
---- | ---- | ---- | ----
scrollbar | Boolean | true | 是否出现滚动条
momentum | Boolean | true | 是否使用惯性滑动
animation | String | ease-out | 自定义动画效果
x | Number | - | 初始X轴位置
y | Number | - | 初始Y轴位置
onscrollend | Function | - | 惯性滑动动画完成时触发
ontouchstart | Function | - | 用户碰触滑动区时触发，返回false可以停止后续事件处理
ontouchend | Function | - | 用户结束碰触时触发
deceleration | Number | - | 惯性滑动的阻力系数

## 方法

方法名 | 参数 | 说明
---- | ---- | ----
scrollTo | x, y, time | time时间内滑动至x,y处
scrollXTo | x, time | 仅滑动水平方向至x处
scrollYTo | y, time | 仅滑动垂直方向至y处
refresh | cfg | 刷新组件，可重新配置参数
destroy | - | 销毁

## 属性

属性名 | 类型 | 说明
---- | ---- | ----
current | Object | 滑动块当前的位置
point | Object | 上一次静止时的位置
maxScrollWidth | Number | x轴方向最大可滑动值(该值为负值)
maxScrollHeight | Number | y轴方向最大可滑动值(该值为负值)
jBox | Object | jQuery/Zepto对象，视口元素
jScrollBox | Object | jQuery/Zepto对象，滑块元素

---------------

### [查看DEMO](http://ajccom.github.io/nicescroller/)


