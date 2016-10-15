"use strict"
;(function ($) {
  var util = (function () {
    /**
     * _map 遍历对象，辅助函数
     * @param {Object|Array} arr 遍历对象
     * @param {Function} cb 回调函数，传入参数
          @param {Object} 数组子项
          @param {Number} 序号
     * @return {Array} 数组对象
     */
    function _map (arr, cb) {
      if (!arr) {return}
      return Array.prototype.map.call(arr, function (o, i) {
        return cb ? cb(o, i) : o
      })
    }

    /**
     * _addClass 添加类，辅助函数
     * @param {Object|Array} DOM 对象
     * @param {String} klass 类字符串
     */
    function _addClass (element, klass) {
      if (!element || !klass) {return}
      var arr = element.item ? _map(element) : [element]
      var reg = new RegExp('(\s*|^)' + klass + '(\s*|$)')
      arr.map(function (node) {
        var str = node.className
        if (!str) {
          node.className = klass
        } else {
          !reg.test(str) && (node.className += ' ' + klass)
        }
      })
    }

    /**
     * _removeClass 删除类，辅助函数
     * @param {Object} DOM 对象
     * @param {String} klass 类字符串
     */
    function _removeClass (element, klass) {
      if (!element || !klass) {return}
      var arr = element.item ? _map(element) : [element]
      var regs = klass.split(' ').map(function (str) {
        return new RegExp('(\s*|^)' + str + '(\s*|$)', 'g')
      })
      arr.map(function (node) {
        var str = node.className
        regs.map(function (reg) {
          str = str.replace(reg, '').trim()
        })
        node.className = str
      })
    }

    var _mobileCheck = 'ontouchend' in document,
      _pointCheck = window.PointerEvent || window.MSPointerEvent,
      _prefixPointerEvent = (pointerEvent) => window.MSPointerEvent ? 
          'MSPointer' + pointerEvent.charAt(9).toUpperCase() + pointerEvent.substr(10) : pointerEvent,
      ev = {
        click: 'click',
        start: _mobileCheck ? (_pointCheck ? _prefixPointerEvent('pointerdown') : 'touchstart' ) : 'mousedown',
        move: _mobileCheck ? (_pointCheck ? _prefixPointerEvent('pointermove') : 'touchmove') : 'mousemove',
        end: _mobileCheck ? (_pointCheck ? _prefixPointerEvent('pointerup') : 'touchend') : 'mouseup',
        cancel: _mobileCheck ? (_pointCheck ? _prefixPointerEvent('pointercancel') : 'touchcancel') : 'mousecancel'
      }
    
    /**
     * 事件处理对象 eventHandler
     * @usage eventHandler.on(ev.start, dom, fn) //绑定事件
     *        eventHandler.on(ev.start, dom, selector, fn) //事件委托
     *        eventHandler.off(ev.start, dom) //卸载指定事件 （仅通过 eventHandler 绑定的事件）
     *        eventHandler.off(dom) //卸载所有事件 （仅通过 eventHandler 绑定的事件）
     *        eventHandler.trigger(ev.start, dom, 'args1', 'args2') //模拟事件并触发，第 3 个参数起都是传入参数
     *  目前无法通过一次调用绑定多个事件, 如 eventHandler.on('touchstart touchmove', function () {...})
     */
    var eventHandler = (function () {
      /**
       * store 存储 eventHandler 中的 dom 与 绑定事件
       * 形如：
         {
           click: [{
             dom: dom1,
             fn: [fn1, fn2, ...]
           }, {
             dom: dom2,
             fn: [...]
           }]
         }
       */
      var store = {}
      
      /**
       * check 冒泡方式查找对应元素是否与 selector 匹配
       * @param {String} selector 选择器字符串
       * @param {Object} e 事件对象
       * @param {Object} 父元素
       * @param {Object|Null} 返回查找到的元素或 null
       */
      function check (selector, e, parentNode) {
        if (!selector || !parentNode) {return null}
        var nodes = [], target = e.target
        
        _map(parentNode.querySelectorAll(selector), function (node) {
          nodes.push(node)
        })
        
        while (target && nodes.indexOf(target) === -1 && target !== parentNode) {
          target = target.parentNode
        }
        if (target === parentNode) {return null}
        return target
      }
      
      /**
       * on 绑定方法
       * @param eventName 事件名称
       * @param dom 绑定事件的 DOM 元素
       * @param selector 委托元素的 selector
       * @param callback 回调函数
       * @usage on('click', document.body, 'a', function () {console.log('click a link')})
       */
      function on (eventName, dom, selector, callback) {
        if (!eventName || !dom) {return new Error('arguments wrong in on function. eventName:' + eventName + ' element: ' + dom)}
        
        var i = 0, item = null, l = 0, target = null
        
        if (typeof selector === 'function') {
          callback = selector
          selector = ''
        }
        
        var arr = dom.item ? _map(dom) : [dom]
        arr.map(function (dom) {
          /**
           * fn 需要进行委托处理后执行回调函数
           */
          var fn = function (e) {
            if (selector) {
              var node = check(selector, e, dom)
              node && callback.call(node, e)
            } else {
              callback.call(dom, e)
            }
          }
          
          dom.addEventListener(eventName, fn)
          
          var temp = null
          if (!store[eventName]) {
            store[eventName] = [{
              dom: dom,
              fn: [fn]
            }]
          } else {
            l = store[eventName].length
            
            for (i = 0; i < l; i++) {
              temp = store[eventName][i]
              if (temp.dom === dom) {
                target = dom
                temp.fn.push(fn)
                break
              }
            }
            
            //not find dom in store[eventName]
            if (!target) {
              store[eventName].push({
                dom: dom,
                fn: [fn]
              })
            }
          }
        })
        
      }
      
      /**
       * off 移除绑定方法
       * @param eventName 事件名称
       * @param dom 绑定事件的 DOM 元素
       * @usage off('click', document.body)
       */
      function off (eventName, dom) {
        if (!eventName) {return new Error('arguments wrong in on function. first arguments:' + eventName)}
        
        if (typeof eventName === 'object') {
          dom = eventName
          eventName = ''
        }
        
        var temp = null, i = 0, j = 0, l = 0, len = 0, arr = []
        arr = dom.item ? _map(dom) : [dom]
        len = arr.length
        if (eventName) {
          if (!store[eventName]) {return}
          l = store[eventName].length
          for (i = 0; i < l; i++) {
            temp = store[eventName][i]
            for (j = 0; j < len; j++) {
              if (arr[j] === temp.dom) {
                removeEvent(arr[j], eventName, temp.fn)
                break
              }
            }
          }
        } else {
          for (eventName in store) {
            l = store[eventName].length
            for (i = 0; i < l; i++) {
              temp = store[eventName][i]
              for (j = 0; j < len; j++) {
                if (arr[j] === temp.dom) {
                  removeEvent(arr[j], eventName, temp.fn)
                  break
                }
              }
            }
          }
        }
        
        /**
         * removeEvent 移除事件
         * @param {Object} dom 
         * @param {String} eventName 
         * @param {Array} fnArray 回调事件数组
         */
        function removeEvent (dom, eventName, fnArray) {
          var i = 0, l = 0, index = 0, temp = null
          fnArray.map(function (fn) {
            try {
              dom.removeEventListener(eventName, fn)
              
              l = store[eventName].length
              for (i; i < l; i++) {
                temp = store[eventName][i]
                index = temp.fn.indexOf(fn)
                if (temp.dom === dom && index > -1) {
                  temp.fn.splice(index, 1)
                }
              }
            } catch (e) {}
          })
        }
        
        // beauty store
        for (eventName in store) {
          i = 0, l = store[eventName].length, target = []
          for (i; i < l; i++) {
            temp = store[eventName][i]
            if (temp.fn && temp.fn.length !== 0) {
              target.push(temp)
            }
          }
          store[eventName] = target
        }
      }
      
      /**
       * TODO
       */
      function trigger (eventName, dom) {
        return
      }
      
      return {on: on, off: off}
      
    })()
    
    
    return {
      map: _map,
      addClass: _addClass,
      removeClass: _removeClass,
      ev: ev,
      eventHandler: eventHandler
    }
  })()
  
  /////////////////////////////////////////////////
  /////////////////////////////////////////////////
  var ev = util.ev
  
  /**
   * _append 插入字符串
   * @param {Object} DOM 元素
   * @param {String} 字符串
   */
  function _append (dom, str) {
    var arr = dom.item ? util.map(dom) : [dom]
    arr.map(function (dom) {
      var div = document.createElement('div')
      div.innerHTML = str
      dom.appendChild(div)
      var arr = util.map(div.childNodes)
      
      arr.map(function (child) {
        dom.insertBefore(child, div)
      })
      dom.removeChild(div)
    })
    
    return dom
  }
  
  /**
   * 获取浏览器前缀
   */
  var _prefix = (function () {
    var div = document.createElement('div'),
      style = div.style,
      result = ''
    if (style.WebkitTransform === '') {
      result = '-webkit-'
    } else if (style.MozTransform === '') {
      result = '-moz-'
    }
    return result
  }())
  
  /**
   * _css 设置元素样式
   * @type {Function} 
   * @param {Object} dom DOM 元素或 NodeList 对象
   * @param {Object} obj 样式数据
   */
  function _css (dom, obj) {
    var arr = dom.item ? util.map(dom) : [dom]
    arr.map(function (dom) {
      for (var item in obj) {
        dom.style[item] = obj[item]
      }
    })
  }
  
  /**
   * 设置元素位移
   * @type {Function} 
   * @param {Number} x x轴位移值
   * @param {Number} y y轴位移值
   */
  function _setDist (x, y) {
    var d = {}
    d[_prefix + 'transform'] = 'translate3d(' + x + 'px, ' + y + 'px, 0px)'
    _css(this.DOMScrollBox, d)
    this.current = {
      x: x,
      y: y
    }
    
    if (this.cfg.scrollbar) {_updateBar.apply(this)}
  }
  
  /**
   * 更新滚动条
   * @type {Function} 
   */
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
      _css(this.DOMBarX, d)
    }
    if (dir !== 0) {
      temp = c.y / this.maxScrollHeight * (ws.height - bs.y)
      d[_prefix + 'transform'] = 'translate3d(0px, ' + temp + 'px, 0px)'
      _css(this.DOMBarY, d)
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
  
  /**
   * 添加计时器
   * @type {Function} 
   * @param {Function} fn 回调函数
   * @return 计时器对象
   */
  function _rAF (fn) {
    var a = (window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    setTimeout)(fn)
    return a
  }
  
  /**
   * 注销计时器
   * @type {Function} 
   * @param {Object} id 计时器对象
   */
  function _cAF (id) {
    (window.cancelAnimationFrame ||
    window.webkitCancelAnimationFrame ||
    window.mozCancelAnimationFrame ||
    window.oCancelAnimationFrame ||
    clearTimeout)(id)
  }
  
  /**
   * 添加动画
   * @type {Function} 
   * @param {Object} args 动画所需参数
   */
  function _animate (args) {
    var startTime = +new Date, 
      pastTime = 0,
      currentX, currentY, time = typeof args.duration === 'number' ? args.duration : 0,
      startX = this.current.x,
      startY = this.current.y,
      distenceX = args.x - startX,
      distenceY = args.y - startY,
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
        util.removeClass(that.DOMBox, 'active')
        that._isAdded = false
        that.cfg.onscrollend && that.cfg.onscrollend.apply(that)
        return
      }
      
      _setDist.call(that, currentX, currentY)
      that.timer = _rAF(step)
    }
    
    step()
  }
  
  /**
   * 取消动画
   * @type {Function}
   */
  function _cancelAnimate () {
    this.timer && _cAF(this.timer)
  }
  
  /**
   * 默认配置项
   */
  var _defaultConfig = {
    scrollbar: true,
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
    return Object.assign({}, _defaultConfig, cfg)
  }
  
  /**
   * 设置起始点
   * @type {Function} 
   */
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
    _isLock = false,
    _isChecked = false,
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
  
  /**
   * 接触时回调方法
   * @type {Function} 
   * @param {Object} e 事件对象
   */
  function _start (e) {
    if (this.cfg.ontouchstart && !this.cfg.ontouchstart.apply(this)) {return}
    _cancelAnimate.apply(this)
    this.touched = true
    _touchedScroller.push(this)
    o = _getXY(e)
    m = o
    _setPoint.call(this)
    startTime = +new Date
    _isLock = true
    _isChecked = false
  }
  
  /**
   * 移动时回调方法
   * @type {Function} 
   * @param {Object} e 事件对象
   */
  function _move (e) {
    _currentScroller = _touchedScroller[0]
    if (!_currentScroller || !_currentScroller.touched) {return}
    if (!_currentScroller._isAdded) {//避免频繁操作DOM
      util.addClass(_currentScroller.DOMBox, 'active')
      _currentScroller._isAdded = true
    }
    m = _getXY(e)
    var dir = _currentScroller.dir,
      dx = m.x - o.x,
      dy = m.y - o.y,
      point = _currentScroller.point
    _handleMove.call(_currentScroller, dir === 1 ? 0 : point.x + dx, dir === 0 ? 0 : point.y + dy)
    if (!_isChecked) {
      if (Math.abs(dx) < Math.abs(dy) && dir === 0) {_isLock = false}
      _isChecked = true
    }
    if (_isLock) {
      e.preventDefault()
    }
  }
  
  /**
   * 结束时回调方法
   * @type {Function} 
   * @param {Object} e 事件对象
   */
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
    if (endTime < 300) {
      mx = dir === 1 ? {duration: 0, destination: 0} : getLocation(point.x, point.x + deltaX, endTime, _currentScroller.maxScrollWidth, wrapperSize.width, deceleration)
      my = dir === 0 ? {duration: 0, destination: 0} : getLocation(point.y, point.y + deltaY, endTime, _currentScroller.maxScrollHeight, wrapperSize.height, deceleration)
      time = Math.max(mx.duration, my.duration)
    } else {
      //吸附边界
      mx = dir === 1 ? {duration: 0, destination: 0} : {duration: 300, destination: point.x + deltaX}
      my = dir === 0 ? {duration: 0, destination: 0} : {duration: 300, destination: point.y + deltaY}
      time = 300
    }
    
    //吸附边界
    mx.destination = mx.destination > 0 ? (time += 300, 0) : (mx.destination < maxScrollWidth ? (time += 300, maxScrollWidth) : mx.destination)
    my.destination = my.destination > 0 ? (time += 300, 0) : (my.destination < maxScrollHeight ? (time += 300, maxScrollHeight) : my.destination)

    _currentScroller.scrollTo(mx.destination, my.destination, time)
    
    _currentScroller.cfg.ontouchend && _currentScroller.cfg.ontouchend.apply(_currentScroller)
    _currentScroller = null
    _touchedScroller = []
  }
  //drag end
  
  /**
   * 势能效果方法
   * @type {Function} 
   * @param {Number} current 起始的位置
   * @param {Number} start 当前的位置
   * @param {Number} time 触摸滑动时间
   * @param {Number} lowerMargin 最大移动距离
   * @param {Number} wrapperSize 父窗口在该方向的大小(宽或高)
   * @param {Number} deceleration 系数
   */
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
  
  /**
   * 滑动至
   * @type {Function} 
   * @param {Number} x x轴数值
   * @param {Number} y y轴数值
   * @param {Number} time 动画时间
   */
  function _scrollTo (x, y, time) {
    _cancelAnimate.apply(this)
    _animate.call(this, {
      duration: time,
      x: x,
      y: y
    })
    util.addClass(this.DOMBox, 'active')
    this._isAdded = true
    return this
  }
  
  /**
   * x轴滑动至
   * @type {Function} 
   * @param {Number} x x轴数值
   * @param {Number} time 动画时间
   */
  function _scrollXTo (x, time) {
    _cancelAnimate.apply(this)
    _animate.call(this, {
      duration: time,
      x: x,
      y: this.current.y
    })
    util.addClass(this.DOMBox, 'active')
    this._isAdded = true
    return this
  }
  
  /**
   * y轴滑动至
   * @type {Function} 
   * @param {Number} y y轴数值
   * @param {Number} time 动画时间
   */
  function _scrollYTo (y, time) {
    _cancelAnimate.apply(this)
    _animate.call(this, {
      duration: time,
      x: this.current.x,
      y: y
    })
    util.addClass(this.DOMBox, 'active')
    this._isAdded = true
    return this
  }
  
  /**
   * 设置元素位置
   * @type {Function} 
   * @param {Number} x x轴数值
   * @param {Number} y y轴数值
   */
  function _handleMove (x, y) {
    _setDist.call(this, x, y)
  }
  
  /**
   * 绑定事件
   * @type {Function} 
   */
  function _bind () {
    var that = this
    util.eventHandler.on(ev.start, this.DOMScrollBox, function (e) {_start.call(that, e)})
    if (!_bound) {
      util.eventHandler.on(ev.move, document, _move)
      util.eventHandler.on(ev.end, document, _end)
      util.eventHandler.on(ev.cancel, document, _end)
      _bound = true
    }
  }
  
  /**
   * 解绑事件
   * @type {Function} 
   */
  function _unbind () {
    util.eventHandler.off(ev.move, document)
    util.eventHandler.off(ev.end, document)
    util.eventHandler.off(ev.cancel, document)
    _bound = false
  }
  
  /**
   * 初始化
   * @type {Function} 
   */
  function _init () {
    var w, h, dir, box, x, y, scrollBox
    this.DOMScrollBox = this.DOMBox.children[0]
    
    box = {
      width: this.DOMBox.clientWidth,
      height: this.DOMBox.clientHeight
    }
    scrollBox = {
      width: this.DOMScrollBox.clientWidth,
      height: this.DOMScrollBox.clientHeight
    }
    
    w = box.width - scrollBox.width
    h = box.height - scrollBox.height
    x = this.cfg.x || 0
    y = this.cfg.y || 0
    //0 左右； 1 上下； 2 两个方向； -1 不能滚动
    dir = w < 0 ? (h < 0 ? 2 : 0) : (h < 0 ? 1 : -1)
    _scrollerCount++
    this.dir = dir
    if (dir === -1) {return}
    this.maxScrollWidth = w
    this.maxScrollHeight = h
    this.wrapperSize = box
    this.point = {
      x: x,
      y: y
    }
    
    if (this.cfg.scrollbar) {
      _append(this.DOMBox, '<div class="scrollbar-x scrollbar"><div class="bar"></div></div><div class="scrollbar-y scrollbar"><div class="bar"></div></div>')
      
      this.DOMScrollBarX = this.DOMBox.querySelector('.scrollbar-x')
      this.DOMScrollBarY = this.DOMBox.querySelector('.scrollbar-y')
      this.barSize = {
        x: box.width / scrollBox.width * box.width,
        y: box.height / scrollBox.height * box.height
      }
      this.DOMBarX = this.DOMScrollBarX.querySelector('.bar')
      this.DOMBarX.style.width = this.barSize.x + 'px'
      this.DOMBarY = this.DOMScrollBarY.querySelector('.bar')
      this.DOMBarY.style.height = this.barSize.y + 'px'
      dir === 0 && (this.DOMScrollBarY && this.DOMScrollBarY.parentNode.removeChild(this.DOMScrollBarY))
      dir === 1 && (this.DOMScrollBarX && this.DOMScrollBarX.parentNode.removeChild(this.DOMScrollBarX))
    }
    _bind.apply(this)
    
    _setDist.call(this, x, y)
  }
  
  /**
   * 刷新方法，重新获取可滑动区域，默认不会变动当前位置
   * @type {Function} 
   * @param {Object} cfg 更新配置，可覆盖原配置
   */
  function _refresh (cfg) {
    var x = this.current.x,
      y = this.current.y
    _scrollerCount--
    
    var dom = this.DOMBox.querySelector('.scrollbar')
    dom && dom.parentNode.removeChild(dom)
    this.cfg = Object.assign(this.cfg, {x: x, y: y}, cfg)
    _init.apply(this)
    return this
  }
  
  /**
   * 回收实例对象
   * @type {Function} 
   */
  function _destroy () {
    var item = ''
    util.removeClass(this.DOMBox, 'active')
    util.eventHandler.off(this.DOMBox)
    var dom = this.DOMBox.querySelector('.scrollbar')
    dom && dom.parentNode.removeChild(dom)
    for (item in this) {
      delete this[item]
    }
    
    this.__proto__ = null
    
    _scrollerCount--
    if (_scrollerCount === 0) {
      _unbind()
    }
  }
  
  /**
   * NiceScroller类
   * @type {Function} 
   * @param {Object|String} ele DOM元素
   * @param {Object} cfg 实例化配置，可覆盖默认配置
   */
  function NiceScroller (ele, cfg) {
    this.DOMBox = typeof ele === 'string' ? document.querySelector(ele) : (ele.item ? ele.item(0) : ele)
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
