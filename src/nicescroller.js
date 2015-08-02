"use strict"
;(function ($) {
  
  //兼容PC与移动端事件
  var _mobileCheck = 'ontouchend' in document,
    ev = {
      click: 'click',
      start: _mobileCheck ? 'touchstart' : 'mousedown',
      move: _mobileCheck ? 'touchmove' : 'mousemove',
      end: _mobileCheck ? 'touchend' : 'mouseup'
    }
  
  //获取浏览器前缀
  var _prefix = (function () {
    var div = document.createElement('div'),
      style = div.style,
    /*  arr = ['WebkitT', 'MozT', 'MsT'],
      temp = '',
      i = 0,
      l = 3,*/
      
      result = ''
      
    /*for (i; i < l; i++) {
      temp = arr[i]
      if (typeof style[temp + 'ransform'] !== 'undefined') {
        result = '-' + temp.replace('T', '').toLowerCase() + '-'
        break
      }
    }*/
    if (style.WebkitTransform === '') {
      result = '-webkit-'
    } else if (style.MozTransform === '') {
      result = '-moz-'
    }
    return result
  }())
  
  /**
   * 设置元素位移
   * @type {Function} 
   * @param {Number} x x轴位移值
   * @param {Number} y y轴位移值
   */
  function _setDist (x, y) {
    var d = {}
    d[_prefix + 'transform'] = 'translate3d(' + x + 'px, ' + y + 'px, 0px)'
    this.jScrollBox.css(d)
    this.current = {
      x: x,
      y: y
    }
    
    if (this.cfg.scrollbar) {_updateBar.apply(this)}
  }
  
  function _updateBar () {
    var c = this.current,
      d = {},
      ws = this.wrapperSize,
      temp = 0,
      dir = this.dir,
      bs = this.barSize
    if (dir !== 1) {
      temp = c.x / this.maxScrollWidth * (ws.width - bs.x)
      d[_prefix + 'transform'] = 'translate3d(' + temp + 'px, 0px, 0px)'
      this.jBarX.css(d)
    }
    if (dir !== 0) {
      temp = c.y / this.maxScrollHeight * (ws.height - bs.y)
      d[_prefix + 'transform'] = 'translate3d(0px, ' + temp + 'px, 0px)'
      this.jBarY.css(d)
    }
  }
      
  /**
   * 路径扭曲函数
   * @param {Number} t current time（当前时间）
   * @param {Number} b beginning value（初始值）置0，即b=0；
   * @param {Number} c change in value（变化量）置1，即c=1；
   * @param {Number} d duration（持续时间） 置1，即d=1。
   * @return {Number}
   */
  var _animationFunction = {
    'ease-out-back': function (t, b, c, d) {
      var s = 1.70158
      return c * ((t = t / d - 1) * t * ((s + 1) * t + s) + 1) + b
    },
    'ease-out': function (t, b, c, d) {
      return -c *(t/=d)*(t-2) + b
    },
    'linear': function (t, b, c, d) {
      return t / d * c + b
    }
  }
  
  /**
   * 添加动画函数
   * @param {Object} obj 新增函数
   */
  /*function _extendAnimate (obj) {
    $.extend(_animationFunction, obj)
  }*/
  
  //计时器
  function _rAF (fn) {
    var a = (window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    setTimeout)(fn)
    return a
  }
  
  function _cAF (id) {
    (window.cancelAnimationFrame ||
    window.webkitCancelAnimationFrame ||
    window.mozCancelAnimationFrame ||
    window.oCancelAnimationFrame ||
    clearTimeout)(id)
  }
  
  function _animate (args) {
    var startTime = +new Date, 
      pastTime = 0,
      currentX, currentY, time = args.duration,
      startX = this.current.x,
      startY = this.current.y,
      distenceX = args.x - startX,
      distenceY = args.y - startY,
      dom = this.jScrollBox,
      that = this
    function step () {
      pastTime = +new Date - startTime
      if (_animationFunction[that.cfg.animation]) {
        currentX = _animationFunction[that.cfg.animation](pastTime, startX, distenceX, time)
        currentY = _animationFunction[that.cfg.animation](pastTime, startY, distenceY, time)
      } else {
        currentX = _animationFunction.linear(pastTime, startX, distenceX, time)
        currentY = _animationFunction.linear(pastTime, startY, distenceY, time)
      }
      
      if (pastTime >= time) {
        currentX = args.x
        currentY = args.y
        _setDist.call(that, currentX, currentY)
        that.jBox.removeClass('active')
        that.cfg.onscrollend && that.cfg.onscrollend.apply(that)
        return
      }
      
      _setDist.call(that, currentX, currentY)
      that.timer = _rAF(step)
    }
    
    step()
  }
  
  /**
   * 取消动画函数
   * @type {Function}
   */
  function _cancelAnimate () {
    this.timer && _cAF(this.timer)
  }
  
  /**
   * 解决模拟滑动效果
   * @usage new NiceScroller('.scroll')
   */
  
  var _defaultConfig = {
    scrollbar: true,
    momentum: true,
    animation: 'ease-out',
    //x: 0,
    //y: 0,
    //onscrollend: function () {},
    //ontouchstart: function () {},
    //ontouchend: function () {},
    deceleration: 0.0006
  }
  
  /**
   * 处理配置项
   * @type {Function} 
   * @param {Object} cfg
   * @return {Object}
   */
  function _handleConfig (cfg) {
    return $.extend({}, _defaultConfig, cfg)
  }
  
  function _setPoint () {
    var dir = this.dir,
      point = this.point,
      current = this.current
    point.x = dir === 1 ? 0 : current.x
    point.y = dir === 0 ? 0 : current.y
  }
  
  //drag
  var _currentScroller = null,
    _touchedScroller = [],
    o = {},
    m = {},
    startTime,
    endTime,
    _bound = false,
    _scrollerCount = 0
    
  /**
   * 获取事件对象中的坐标值
   * @type {Function} 
   * @param {Object} e
   * @return {Object} 包含坐标值的对象
   */
  var _getXY = function (e) {
    var e = e.originalEvent ? e.originalEvent : e,
      touches = e.touches,
      x = 0,
      y = 0
    if (touches) {
      x = touches[0].pageX
      y = touches[0].pageY
    } else {
      x = e.clientX
      y = e.clientY
    }
    
    return {x: x, y: y} 
  }
    
  function _start (e) {
    if (this.cfg.ontouchstart && !this.cfg.ontouchstart.apply(this)) {return}
    _cancelAnimate.apply(this)
    this.touched = true
    _touchedScroller.push(this)
    o = _getXY(e)
    m = o
    _setPoint.call(this)
    startTime = +new Date
    
  }
  
  function _move (e) {
    _currentScroller = _touchedScroller[0]
    if (!_currentScroller || !_currentScroller.touched) {return}
    _currentScroller.jBox.addClass('active')
    m = _getXY(e)
    var dir = _currentScroller.dir,
      point = _currentScroller.point
    _handleMove.call(_currentScroller, dir === 1 ? 0 : point.x + m.x - o.x, dir === 0 ? 0 : point.y + m.y - o.y)
    e.preventDefault()
  }
  
  function _end (e) {
    if (!_currentScroller) {return}
    _currentScroller.touched = false
    var deltaX = m.x - o.x,
      deltaY = m.y - o.y,
      mx, my,
      point = _currentScroller.point,
      deceleration = _currentScroller.cfg.deceleration,
      wrapperSize = _currentScroller.wrapperSize,
      time,
      dir = _currentScroller.dir,
      maxScrollWidth = _currentScroller.maxScrollWidth,
      maxScrollHeight = _currentScroller.maxScrollHeight
    if (deltaX === 0 && deltaY === 0) {return}
    endTime = +new Date - startTime
    if (_currentScroller.cfg.momentum) {
      mx = dir === 1 ? {duration: 0, destination: 0} : getLocation(point.x, point.x + deltaX, endTime, _currentScroller.maxScrollWidth, wrapperSize.width, deceleration)
      my = dir === 0 ? {duration: 0, destination: 0} : getLocation(point.y, point.y + deltaY, endTime, _currentScroller.maxScrollHeight, wrapperSize.height, deceleration)
      time = Math.max(mx.duration, my.duration)
      
      //吸附边界
      mx.destination = mx.destination > 0 ? 0 : (mx.destination < maxScrollWidth ? maxScrollWidth : mx.destination)
      my.destination = my.destination > 0 ? 0 : (my.destination < maxScrollHeight ? maxScrollHeight : my.destination)

      _currentScroller.scrollTo(mx.destination, my.destination, time)
    }
    _currentScroller.cfg.ontouchend && _currentScroller.cfg.ontouchend.apply(_currentScroller)
    _currentScroller = null
    _touchedScroller = []
  }
  //drag end
  
  function getLocation (current, start, time, lowerMargin, wrapperSize, deceleration) {
    var distance = start - current,
      speed = Math.abs(distance) / time,
      destination,
      duration

    destination = current + ( speed * speed ) / ( 2 * deceleration ) * ( distance < 0 ? -1 : 1 )
    duration = speed / deceleration
    
    if ( destination < lowerMargin ) {
      destination = wrapperSize ? lowerMargin - ( wrapperSize / 2.5 * ( speed / 8 ) ) : lowerMargin
      distance = Math.abs(destination - current)
      duration = distance / speed
    } else if ( destination > 0 ) {
      destination = wrapperSize ? wrapperSize / 2.5 * ( speed / 8 ) : 0
      distance = Math.abs(current) + destination
      duration = distance / speed
    }

    return {
      destination: Math.round(destination),
      duration: duration
    }
  }
  
  function _scrollTo (x, y, time) {
    _cancelAnimate.apply(this)
    _animate.call(this, {
      duration: time,
      x: x,
      y: y
    })
    this.jBox.addClass('active')
    return this
  }
  
  function _scrollXTo (x, time) {
    _cancelAnimate.apply(this)
    _animate.call(this, {
      duration: time,
      x: x,
      y: this.current.y
    })
    this.jBox.addClass('active')
    return this
  }
  
  function _scrollYTo (y, time) {
    _cancelAnimate.apply(this)
    _animate.call(this, {
      duration: time,
      x: this.current.x,
      y: y
    })
    this.jBox.addClass('active')
    return this
  }
  
  function _handleMove (x, y) {
    _setDist.call(this, x, y)
  }
  
  function _bind () {
    var that = this
    this.jScrollBox.on(ev.start, function (e) {_start.call(that, e)})
    if (!_bound) {
      $(document).on(ev.move, _move).on(ev.end, _end)
      _bound = true
    }
  }
  
  function _unbind () {
    $(document).off(ev.move, _move).off(ev.end, _end)
    _bound = false
  }
  
  function _init () {
    var w, h, dir, box, x, y
    this.jScrollBox = this.jBox.children().eq(0)
    box = {
      width: this.jBox.width(),
      height: this.jBox.height()
    }
    w = box.width - this.jScrollBox.width()
    h = box.height - this.jScrollBox.height()
    x = this.cfg.x || 0
    y = this.cfg.y || 0
    //0 左右； 1 上下； 2 两个方向； -1 不能滚动
    dir = w < 0 ? (h < 0 ? 2 : 0) : (h < 0 ? 1 : -1)
    if (dir === -1) {return}
    this.dir = dir
    this.maxScrollWidth = w
    this.maxScrollHeight = h
    this.wrapperSize = box
    this.point = {
      x: x,
      y: y
    }
    
    if (this.cfg.scrollbar) {
      this.jBox.append('<div class="scrollbar-x scrollbar"><div class="bar"></div></div><div class="scrollbar-y scrollbar"><div class="bar"></div></div>')
      this.jScrollBarX = this.jBox.find('.scrollbar-x')
      this.jScrollBarY = this.jBox.find('.scrollbar-y')
      this.barSize = {
        x: box.width / -w * box.width,
        y: box.height / -h * box.height
      }
      this.jBarX = this.jScrollBarX.find('.bar').width(this.barSize.x)
      this.jBarY = this.jScrollBarY.find('.bar').height(this.barSize.y)
      dir === 0 && this.jScrollBarY.remove()
      dir === 1 && this.jScrollBarX.remove()
    }
    
    _bind.apply(this)
    _scrollerCount++
    
    _setDist.call(this, x, y)
  }
  
  function _refresh (cfg) {
    var x = this.current.x,
      y = this.current.y
    _scrollerCount--
    this.jBox.find('.scrollbar').remove()
    this.cfg = $.extend(this.cfg, {x: x, y: y}, cfg)
    _init.apply(this)
    return this
  }
  
  /**
   * 回收实例对象
   * @type {Function} 
   */
  function _destroy () {
    var item = ''
    this.jBox.removeClass('active').off().find('.scrollbar').remove()
    for (item in this) {
      delete this[item]
    }
    
    this.__proto__ = null
    
    _scrollerCount--
    if (_scrollerCount === 0) {
      _unbind()
    }
  }
  
  function NiceScroller (ele, cfg) {
    this.jBox = $(ele)
    this.cfg = _handleConfig(cfg)
    
    _init.apply(this)
    return this
  }
  
  NiceScroller.prototype = {
    scrollTo: _scrollTo,
    scrollXTo: _scrollXTo,
    scrollYTo: _scrollYTo,
    refresh: _refresh,
    destroy: _destroy
  }
  
  if(typeof define === 'function' && define.amd) {
    define([], function () {
      return NiceScroller
    })
  } else if (typeof module !== 'undefined' && module.exports) {
    module.exports = NiceScroller
  } else {
    window.NiceScroller = NiceScroller
  }
  
}(window.jQuery || window.Zepto))