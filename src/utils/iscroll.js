const utils = {
  element: document.createElement('div'),
  preFixArr: ['webkit', 'Moz', 'ms', 'O'],
  getPrefix (style) {
    let elementStyleCol = this.element.style
    if (style in elementStyleCol) return style
    for (let i = 0; i < this.preFixArr.length; i++) {
      let styleName = this.preFixArr[i] + style.replace(/[a-z]/, match => match.toUpperCase())
      if (styleName in elementStyleCol) return styleName
    }
    return null
  },
  momentum (current, start, time, lowerMargin, wrapperSize, deceleration) {
    let distance = current - start,
      speed = Math.abs(distance) / time,
      destination,
      duration

    deceleration = deceleration === undefined ? 0.0006 : deceleration

    destination = current + (speed * speed) / (2 * deceleration) * (distance < 0 ? -1 : 1)
    duration = speed / deceleration

    if (destination < lowerMargin) {
      destination = wrapperSize ? lowerMargin - (wrapperSize / 2.5 * (speed / 8)) : lowerMargin
      distance = Math.abs(destination - current)
      duration = distance / speed
    } else if (destination > 0) {
      destination = wrapperSize ? wrapperSize / 2.5 * (speed / 8) : 0
      distance = Math.abs(current) + destination
      duration = distance / speed
    }

    return {
      destination: Math.round(destination),
      duration: duration
    }
  },
  quadratic: {
    style: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
  },
  offset (el) {
    var left = -el.offsetLeft,
      top = -el.offsetTop

        // jshint -W084
    while (el = el.offsetParent) {
      left -= el.offsetLeft
      top -= el.offsetTop
    }
        // jshint +W084

    return {
      left: left,
      top: top
    }
  },
  getLasyLoadImage (el) {
    let imgs = el ? el.querySelectorAll('.lasy-load-img') : []
    let lasyImgs = []
    for (let i = 0, len = imgs.length; i < len; i++) {
      lasyImgs.push({
        dom: imgs[i],
        rect: imgs[i].getBoundingClientRect(),
        show: (imgs[i].src && imgs[i].src === imgs[i].getAttribute('data-src'))
      })
    }
    return lasyImgs
  },
  loadLasyImage (imgs, curX, curY, width, height, direction) {
    if (imgs && imgs.length > 0) {
      imgs.map((item, i) => {
        if (item.show) {
          return
        }
        if ((direction === 'x' && -curX > item.rect.left - width) ||
          (direction === 'y' && curY > item.rect.top - height)) {
          item.dom.src = item.dom.getAttribute('data-src')
          item.show = true
        }
      })
    }
  }
}

let canTap = true
class STM {
  constructor (obj) {
    Object.assign(this, obj)
  }

  setState (NextState, ...args) {
    this.exit()
    return new NextState(this, ...args)
  }

  exit () {

  }
}
class ScrollSTM extends STM {
  constructor (obj) {
    super(obj)
  }

  close () {
    this._scrollIns.changeState(super.setState(CloseScrollSTM))
  }

  open () {
    let stm = this.options.drag ? DragInitScrollSTM : InitScrollSTM
    this._scrollIns.changeState(super.setState(stm))
  }

  refresh () {
    const is = {}
    is.wrapper = this.element
    is.scroller = is.wrapper.children[0]
    is.wrapperWidth = is.wrapper.clientWidth
    is.wrapperHeight = is.wrapper.clientHeight
    is.maxOffsetWidth = is.wrapperWidth - is.scroller.clientWidth
    is.maxOffsetHeight = is.wrapperHeight - is.scroller.clientHeight
    if (is.maxOffsetWidth >= 0) is.maxOffsetWidth = -1
    if (is.maxOffsetHeight >= 0) is.maxOffsetHeight = -1
    is.scrollerStyle = is.scroller.style
    // is.scrollerStyle[utils.getPrefix('transform')] = `translate(${0}px,${0}px) translateZ(0)`;
    is.wrapperOffset = utils.offset(is.wrapper)
    this.staticData = is
    this.scroller = is.scroller
    if (this.options.lasyLoad) {
      this.loadLasy()
    }
  }

  loadLasy (curX = this.x, curY = this.y) {
    let lasyImgs = utils.getLasyLoadImage(this.element)
    utils.loadLasyImage(lasyImgs, curX, curY, this.staticData.wrapperWidth, this.staticData.wrapperHeight, this.options.direction)
  }

  touchStart (e) {
    let touch = e.touches[0]
    this.startY = this.y
    this.startX = this.x
    this.distX = 0
    this.distY = 0
    this.pointY = touch.pageY
    this.pointX = touch.pageX
    this.startTime = Date.now()
    this.directionLocked = null
    this.moved = null
  }

  touchMove (e) {
    let touch = e.touches[0]
    let pointY = touch.pageY, pointX = touch.pageX,
      deltaX = pointX - this.pointX,
      deltaY = pointY - this.pointY,
      moveTime = Date.now(),
      newX, newY,
      absDistX, absDistY
    newY = this.y + deltaY
    newX = this.x + deltaX
    this.distX += deltaX
    this.distY += deltaY
    absDistX = Math.abs(this.distX)
    absDistY = Math.abs(this.distY)
    if (this.directionLocked === null) {
      if (absDistY > absDistX) {
        this.directionLocked = 'y'
      } else {
        this.directionLocked = 'x'
      }
    }
    if (this.directionLocked !== this.options.direction) {
      this._scrollIns.changeState(super.setState(WrongDirectionScrollSTM))
      return
    }
        // We need to move at least 10 pixels for the scrolling to initiate
    if (moveTime - this.endTime > 300 && (absDistX < 10 && absDistY < 10)) {
      return
    }

    if (!this.options.bounce) {
      if (newX > 0) newX = 0
      if (newY > 0) newY = 0
    }
    if (this.options.direction === 'y') {
      newX = 0
      if (newY > 0 || newY < this.staticData.maxOffsetHeight) {
        newY = this.y + deltaY / 3
      }
    }
    if (this.options.direction === 'x') {
      newY = 0
      if (newX > 0 || newX < this.staticData.maxOffsetWidth) {
        newX = this.x + deltaX / 3
      }
      if (this.options.loadMore) {
        let opt = {}
        if (newX < this.staticData.maxOffsetWidth) {
          opt = {
            status: 'show',
            newX,
            deltaX,
            maxOffsetWidth: this.staticData.maxOffsetWidth
          }
        } else if (newX >= this.staticData.maxOffsetWidth - 10) {
          opt = {
            status: 'hide'
          }
        }
        this.refreshMoreTips(opt)
      }
    }
    e.preventDefault()
    this.moved = true
    this.pointY = pointY
    this.pointX = pointX
    this.to(newX, newY)
    if (moveTime > (this.startTime + 200)) {
      this.startTime = moveTime
      this.startX = this.x
      this.startY = this.y
    }
  }

  touchEnd () {
    let newX = Math.round(this.x), newY = Math.round(this.y), duration = Date.now() - this.startTime, time
    this.endTime = Date.now()
    this.to(newX, newY)

    if (this.options.direction === 'x' && this.options.loadMore) {
      this.refreshMoreTips({
        status: 'fade',
        maxOffsetWidth: this.staticData.maxOffsetWidth,
        newX
      })
    }

    if (this.resetPosition()) {
      return
    }
    if (duration < 300) {
      let momentum
      if (this.options.direction == 'y') {
        newX = 0
        momentum = utils.momentum(this.y, this.startY, duration, this.staticData.maxOffsetHeight, this.staticData.wrapperHeight)
        newY = momentum.destination
        if (!this.options.bounce) newY = this.staticData.maxOffsetHeight
        time = momentum.duration
      }
      if (this.options.direction == 'x') {
        newY = 0

        momentum = utils.momentum(this.x, this.startX, duration, this.staticData.maxOffsetWidth, this.staticData.wrapperWidth)
        newX = momentum.destination
        if (!this.options.bounce) newX = this.staticData.maxOffsetWidth
        time = momentum.duration

        if (newX >= this.staticData.offsetWidth - 10) {
          this.refresh({status: 'hide'})
        }
      }
    }
    this.to(newX, newY, time)
  }

  scroll () {
    this.scrollTop = this.options.container.scrollTop

    if (Math.floor(this.scrollTop) === 0 && this.scrollTop !== 0) {
      this.options.container.scrollTop = 0
    }
  }

  to (x, y, time) {
    if (x != this.x || y != this.y) {
      this.x = x
      this.y = y
      let inTransition = time > 0
      this.setTransitionTime(time)
      this.staticData.scrollerStyle[utils.getPrefix('transform')] = `translate(${x}px,${y}px) translateZ(0)`
      if (inTransition) {
        this._scrollIns.changeState(this.setState(AnimationScrollSTM))
      }
    }
  }

  refreshMoreTips (opt) {
    this.options.resetMoreTipsStyle && this.options.resetMoreTipsStyle(opt)
  }

  startLoading () {
    this.to(0, this.options.loadingThread, this.options.bounceTime)
    if (!this.inLoading) {
      this.inLoading = true
      this.loadingP.then(() => {
        this.loadingP = new Promise((resolve, reject) => {
          Promise.all(this.options.loadingFunc.map(func => func())).then(() => {
            this.loadingTimer && clearTimeout(this.loadingTimer)
            resolve()
          }, error => {
            resolve()
          })
          this.loadingTimer = setTimeout(() => {
            resolve()
          }, this.options.timeout)
        }).then(() => {
          this.forceReset()
        })
      })
    }
  }

  stopTransition () {
    let pos = this.getComputedPosition()
    this.to(pos.x, pos.y)
    setTimeout(() => {
      canTap = true
    }, 200)
  }

  resetPosition () {
    let newX = this.x, newY = this.y
    if (this.options.direction == 'y') {
      if (this.y < this.staticData.maxOffsetHeight) newY = this.staticData.maxOffsetHeight
      if (this.y > 0) newY = 0
    } else {
      if (this.x > 0) newX = 0
      if (this.x < this.staticData.maxOffsetWidth) newX = this.staticData.maxOffsetWidth
    }
    this.loadLasy()

    if (newX != this.x || newY != this.y) {
      this.to(newX, newY, this.options.bounceTime || 300)
      return true
    }
  }

  getComputedPosition () {
    let matrix = window.getComputedStyle(this.scroller, null),
      x, y
    matrix = matrix[utils.getPrefix('transform')].split(')')[0].split(', ')
    x = +(matrix[12] || matrix[4])
    y = +(matrix[13] || matrix[5])
    return {x, y}
  }

  setTransitionTime (time = 0) {
    this.staticData.scrollerStyle[utils.getPrefix('transitionDuration')] = time + 'ms'
  }

  setTransitionTimingFunction () {
    this.staticData.scrollerStyle[utils.getPrefix('transitionTimingFunction')] = utils.quadratic.style
  }

  transitionEnd () {
    this.resetPosition()
  }

  scrollToElement (el, time, offsetX, offsetY, easing) {
    el = el.nodeType ? el : this.staticData.scroller.querySelector(el)

    if (!el) {
      return
    }

    var pos = utils.offset(el)

    pos.left -= this.staticData.wrapperOffset.left
    pos.top -= this.staticData.wrapperOffset.top

        // if offsetX/Y are true we center the element to the screen
    if (offsetX === true) {
      offsetX = Math.round(el.offsetWidth / 2 - this.staticData.wrapper.offsetWidth / 2)
    }
    if (offsetY === true) {
      offsetY = Math.round(el.offsetHeight / 2 - this.staticData.wrapper.offsetHeight / 2)
    }

    pos.left -= offsetX || 0
    pos.top -= offsetY || 0

    pos.left = pos.left > 0 ? 0 : pos.left < this.staticData.maxOffsetWidth ? this.staticData.maxOffsetWidth : pos.left
    pos.top = pos.top > 0 ? 0 : pos.top < this.staticData.maxOffsetHeight ? this.staticData.maxOffsetHeight : pos.top

    time = time === undefined || time === null || time === 'auto' ? Math.max(Math.abs(this.x - pos.left), Math.abs(this.y - pos.top)) : time

    this.to(pos.left, pos.top, time)
  }

  getNewY (e) {
    let touch = e.touches[0]
    return this.y + (touch.pageY - this.pointY)
  }

  canForceLoading () {
    return this.getComputedPosition().y == 0
  }
}

class InitScrollSTM extends ScrollSTM {
  constructor (obj, alter = {}) {
    super(obj)
    if (this.staticData == undefined) {
      super.refresh()
      this.setTransitionTimingFunction()
    }
    if (typeof alter.lastEvent === 'object') {
      this[alter.lastEventName](alter.lastEvent)
    }
  }
}

class WrongDirectionScrollSTM extends ScrollSTM {
  constructor (obj) {
    super(obj)
  }

  touchMove () {

  }

  touchEnd () {
    let stm = this.options.drag ? DragInitScrollSTM : InitScrollSTM
    this._scrollIns.changeState(super.setState(stm))
  }
}
class CloseScrollSTM extends ScrollSTM {
  constructor (obj) {
    super(obj)
  }

  touchStart (e) {

  }

  touchMove (e) {

  }

  touchEnd (e) {

  }
}
class AnimationScrollSTM extends ScrollSTM {
  constructor (obj) {
    super(obj)
  }

  touchStart (e) {
    const {x, y} = super.getComputedPosition()
    this.to(x, y)
    super.touchStart(e)
    let stm = this.options.drag ? DragInitScrollSTM : InitScrollSTM
    this._scrollIns.changeState(super.setState(stm))
  }

  transitionEnd () {
    this.resetPosition()
    let stm = this.options.drag ? DragInitScrollSTM : InitScrollSTM
    this._scrollIns.changeState(super.setState(stm))
  }
}

class DragInitScrollSTM extends ScrollSTM {
  constructor (obj, alter = {}) {
    super(obj)
    if (this.staticData == undefined) {
      super.refresh()
      this.setTransitionTimingFunction()
    }
    if (typeof alter.lastEvent === 'object') {
      this[alter.lastEventName](alter.lastEvent)
    }
  }

  touchMove (e) {
    if (Math.floor(this.scrollTop) !== 0) {
      this._scrollIns.changeState(super.setState(DragIgnoreScrollSTM))
      return
    } else if (this.getNewY(e) < 0) {
      this._scrollIns.changeState(super.setState(DragIgnoreScrollSTM))
      return
    }
    super.touchMove(e)
  }

  touchEnd (e) {
    if (this.y > this.options.loadingThread) {
      this._scrollIns.changeState(super.setState(LoadingScrollSTM))
    } else {
      this.to(0, 0, 300)
    }
  }
}
class LoadingScrollSTM extends ScrollSTM {
  constructor (obj) {
    super(obj)
    this.to(0, this.options.loadingThread, 300)
  }

  to (x, y, time) {
    if (x != this.x || y != this.y) {
      this.x = x
      this.y = y
      let inTransition = time > 0
      this.setTransitionTime(time)
      this.staticData.scrollerStyle[utils.getPrefix('transform')] = `translate(${x}px,${y}px) translateZ(0)`
    }
  }

  touchStart (e) {
    e.preventDefault()
  }

  touchMove (e) {
    e.preventDefault()
  }

  touchEnd (e) {
    e.preventDefault()
  }

  transitionEnd () {
    if (this.y !== 0) {
      let lp = new Promise((resolve, reject) => {
        Promise.all(this.options.loadingFunc.map(func => func())).then(() => {
          resolve()
        }, error => {
          resolve()
        })
      }).then(() => {
        this.to(0, 0, 300)
        this._scrollIns.changeState(super.setState(AnimationScrollSTM))
      })
    }
  }
}
class DragIgnoreScrollSTM extends ScrollSTM {
  constructor (obj) {
    super(obj)
  }

  touchStart () {

  }

  touchMove (e) {

  }

  touchEnd (e) {
    if (Math.floor(this.scrollTop) === 0) {
      this.scrollTop = 0
      this._scrollIns.changeState(super.setState(DragInitScrollSTM))
    }
  }

  scroll () {
    super.scroll()
    if (Math.floor(this.scrollTop) === 0) {
      this.scrollTop = 0
      this._scrollIns.changeState(super.setState(DragInitScrollSTM))
    }
  }
}

export default class IScroll {
  constructor (element, options) {
    const stm = options.drag ? DragInitScrollSTM : InitScrollSTM
    this.wrapper = typeof element === 'string' ? document.querySelector(element) : element
    this.lasyImgs = []
    this.changeState(new stm({
      element: this.wrapper,
      _scrollIns: this,
      x: 0,
      y: 0,
      scrollTop: 0,
      options: Object.assign({
        bounceTime: 300,
        direction: 'x',
        bounce: true,
        drag: false,
        timeout: 2000
      }, options || {})
    }))

    this.bindEvents(options)
  }

  changeState (newState) {
    this._state = newState
  }

  dispatch (method) {
    return (e) => {
      this._state[method](e)
    }
  }

  close () {
    this.closeTag = true
    this._state.close()
  }

  open () {
    if (this.closeTag) {
      this._state.open()
      this.closeTag = false
    }
  }

  refresh () {
    this._state.refresh()
  }
  toTop (duration = 0) {
    this._state.to(0, 0, duration)
  }
  scrollTo (x, y, time) {
    this._state.to(x, y, time)
  }
  scrollToElement (el, time, offsetX, offsetY, easing) {
    this._state.scrollToElement(el, time, offsetX, offsetY, easing)
  }

  forceLoading () {
    if (this._state.canForceLoading()) {
      this.changeState(this._state.setState(LoadingScrollSTM))
      this._state.to(0, this._state.options.loadingThead, 300)
    }
  }

  bindEvents (options) {
    this.wrapper.addEventListener('touchstart', this.dispatch('touchStart'))
    this.wrapper.addEventListener('touchmove', this.dispatch('touchMove'))
    this.wrapper.addEventListener('touchend', this.dispatch('touchEnd'))
    this.wrapper.addEventListener('touchcancel', this.dispatch('touchEnd'))
    this.wrapper.addEventListener('transitionend', this.dispatch('transitionEnd'))
    this.wrapper.addEventListener('webkitTransitionEnd', this.dispatch('transitionEnd'))
    if (options.drag) {
      // this.wrapper.addEventListener('scroll', this.dispatch('scroll'))
      options.container.addEventListener('scroll', this.dispatch('scroll'))
    }
  }
}
