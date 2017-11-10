<template>
  <TabView :tabList='tabList' :option='option'>
      <One></One>
      <Two></Two>
      <Three></Three>
      <Four></Four>
      <Five></Five>
      <Six></Six>
  </TabView>
</template>

<script>
  import TabView from './common/TabView'
  import One from './One'
  import Two from './Two'
  import Three from './Three'
  import Four from './Four'
  import Five from './Five'
  import Six from './Six'

  const HomePage = {
    name: 'HomePage',
    data () {
      return {
        option: {
          el: '.tab-con', // 需要滑动的元素 require
          activeClass: 'tab-active' // tab选项卡自定义样式
        },
        tabList: [
          {
            index: 0,
            name: '选项1',
            component: 'One'
          }, {
            index: 1,
            name: '选项2',
            component: 'Two'
          }, {
            index: 2,
            name: '选项3',
            component: 'Three'
          }, {
            index: 3,
            name: '选项4',
            component: 'Four'
          }, {
            index: 4,
            name: '选项5',
            component: 'Five'
          }, {
            index: 5,
            name: '选项6',
            component: 'Six'
          }
        ]
      }
    },
    components: {
      TabView,
      One,
      Two,
      Three,
      Four,
      Five,
      Six
    },
    methods: {
    }

  }

  export default HomePage
</script>

<style>
  .tab-con {
    height: 250px;
    line-height: 250px;
    text-align: center;
    float: left;
  }
  .tab-active {
    border-bottom: 2px solid green;
  }
</style>
