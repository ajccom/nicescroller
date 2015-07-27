# NiceScroller
轻量级移动端模拟滚动插件。

目前NiceScroller的限制及缺陷：

- 依赖jQuery/Zepto；
- 回弹无法达到临界值；
- 回弹动画效果不佳；
- 没有回调支持。

目前NiceScroller具备的能力：

- 动态获取滑动方向；
- 支持惯性滑动；

使用NiceScroller的优势：

- 体积小，压缩后(开启gzip)文件大小只有3.2K；
- 完美支持桌面与移动端。

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
scrollBar | Boolean | true | 是否出现滚动条
momentum | Boolean | true | 是否使用惯性滑动
animation | String | ease-out | 惯性滑动动画效果
deceleration | Number | - | 惯性滑动的阻力系数

## 方法

方法名 | 参数 | 说明
---- | ---- | ----
scrollTo | x, y, time | time时间滑动至x,y处
destroy | - | 销毁

---------------

### [查看DEMO](http://ajccom.github.io/nicescroller/)


