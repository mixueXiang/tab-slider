<template>
  <div class='tabs-wrapper'>
    <div class='tabs-bar' id='scroll-wrapper'>
      <div class='tabs-bar-nav' id='tab-scroller'>
        <div class='tabs-tab' v-for='tab in tabList' @click='changeTab(tab)'
        :class="[index == tab.index ? (option.activeClass || 'tabs-active'): '']"
        >
          {{tab.name}}
        </div>
      </div>
    </div>
    <div class='line'></div>
    <div class='tabs-content' :style='tabWraperStyObj' :class='{shift: isMove}'
      @touchstart='start($event)'
      @touchmove='move($event)'
      @touchend='end($event)'
    >
      <slot></slot>
    </div>
  </div>
</template>

<script>
  import Iscroll from '../../utils/iscroll'

  const TabView = {
    name: 'TabView',
    props: {
      tabList: {
        type: Array,
        required: true
      },
      option: Object
    },
    data () {
      return {
        clientW: 0,
        scrollLeft: 0, // tabbar滚动位置
        scroll: null,
        tabNum: 1, // tab 切换的页面宽度 ( 通过接口的数据计算 )
        index: 0, // 选中了第几个选项卡
        boxNum: 1, // 容器宽度
        marginLeft: 0, // 偏移量
        isMove: true, // 是否在滑动
        startX: 0, // 手指开始滑动时X位置
        startY: 0, // 手指开始滑动时Y位置
        moveX: 0, // 滑动过程中X位置
        movrY: 0, // 滑动过程中Y位置
        endX: 0, // 手指结束滑动时X位置
        endY: 0, // 手指结束滑动时Y位置
        m_sX: 0,
        m_sY: 0,
        e_sX: 0,
        e_xY: 0,
        sML: 0 // 记录移动完后的外层元素的margin-left
      }
    },
    mounted () {
      this.boxNum = this.tabList.length || 1
      this.setScroll()
      this.setItemWidth()
    },
    updata () {
    },
    watch: {
      index: function (newValue, oldValue) {
        this.marginLeft = 0 - this.index * this.clientW
      }
    },
    computed: {
      tabWraperStyObj: function () {
        return {
          width: this.boxNum * this.clientW + 'px',
          marginLeft: this.marginLeft + 'px'
        }
      }
    },
    methods: {
      start (ev) {
        ev.stopPropagation()
        ev.preventDefault()
        this.isMove = false
        this.startX = ev.changedTouches[0].clientX
        this.startY = ev.changedTouches[0].clientY
        this.sMl = this.marginLeft
      },
      move (ev) {
        ev.stopPropagation()
        this.moveX = ev.changedTouches[0].clientX
        this.moveY = ev.changedTouches[0].clientY
        this.m_sX = this.moveX - this.startX
        this.m_sY = this.moveY - this.startY
        let marginLeft = this.sMl + this.m_sX

        marginLeft = marginLeft > 0 ? 0 : marginLeft
        marginLeft = marginLeft < this.clientW - this.boxNum * this.clientW ? this.clientW - this.boxNum * this.clientW : marginLeft
        this.marginLeft = marginLeft
      },
      end (ev) {
        this.isMove = true
        ev.preventDefault()
        this.moveX = ev.changedTouches[0].clientX
        this.moveY = ev.changedTouches[0].clientY
        this.m_sX = this.moveX - this.startX
        this.m_sY = this.moveY - this.startY
        if (Math.abs(this.m_sX) > Math.abs(this.m_sY) && Math.abs(this.m_sX) > 60) {
          let multi = this.m_sX > 0 ? -1 : 1
          let index = multi + this.index
          index = index < 0 ? 0 : index
          index = index > this.boxNum - 1 ? this.boxNum - 1 : index
          this.index = index
          let moveX = -1 * Math.floor(this.tabItemWidth * 3 / 4) * (index - 1)
          if (index >= 3) {
            this.scroll.scrollTo(moveX, 0)
          } else {
            this.scroll.scrollTo(0, 0)
          }
        } else {
          this.marginLeft = 0 - this.index * this.clientW
        }
      },
      changeTab (tab) {
        this.index = tab.index
      },
      setScroll () {
        if (document.querySelector('#scroll-wrapper')) {
          let wrapper = document.querySelector('#scroll-wrapper')
          let scroller = document.querySelector('#tab-scroller')
          // let scroller = document.querySeletor('#tab-scroller')
          let tabItem = wrapper.querySelectorAll('.tabs-tab')
          this.tabItemWidth = tabItem[0].offsetWidth
          scroller.style.width = this.boxNum * this.tabItemWidth + 'px' // 设置元素宽度时一定要在item的上一级设置  否则滚动到末尾时会自动滑动到起始位置
          let option = {
            direction: 'x',
            bounce: false
          }
          if (!this.scroll) {
            this.scroll = new Iscroll(wrapper, option)
          } else {
            this.scroll.refresh()
          }
        }
      },
      setItemWidth () {
        let el = this.option.el
        this.clientW = document.body.clientWidth
        let tabConItems = typeof el === 'string' ? document.querySelectorAll(el) : el
        for (let i = 0; i < tabConItems.length; i++) {
          let item = tabConItems[i]
          item.style.width = this.clientW + 'px'
        }
      }
    }
  }

  export default TabView
</script>

<style>
  .tabs-wrapper {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: stretch;
  }
  .tabs-bar-nav {
    /* display: flex;
    justify-content: space-between; */
    padding-top: 20px;
  }
  .tabs-tab {
    padding: 0 30px;
    padding-bottom: 10px;
    display: inline-block;
  }
  .tabs-content {
    height: 100%;
  }
  .tabs-active {
    border-bottom: 2px solid #ff2d4b;
  }
  .line {
    width: 100%;
    height: 1px;
    background-color: #e6e6e6;
    margin-top: -2px;
  }
  .shift {
    transition-property: margin-left;
    transition-duration: 1s;
  }
</style>
