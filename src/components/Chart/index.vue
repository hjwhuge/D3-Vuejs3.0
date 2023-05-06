<template>
  <div class="c-org -enter-x">
    <div id="org-box" class="d3-context org-content border shadow">
      <div class="org-btn-list">
        鼠标
        <span>（单击查看）</span>I
        <span>（双击展开 / 隐藏）</span>

        <fullscreen-outlined v-if="!isfull" class="btn-icon" @click="screen" />
        <fullscreen-exit-outlined v-else class="btn-icon" @click="screen" />
      </div>
      <!-- line -->
      <div class="line-list">
        <div v-for="(line, index) of lineList" :key="index" class="line-item">
          <div class="line" :style="{ background: line.bg }"></div>
          {{ line.name }}
        </div>
      </div>
      <!-- 信息框 -->
      <Info v-if="infoShow" v-model:infoShow="infoShow" :info="state.activeInfo" />
      <!-- d3 box -->
      <div id="relation" ref="relation" :class="[isfull ? 'fullscreen' : '', 'relation']"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { FullscreenOutlined, FullscreenExitOutlined } from '@ant-design/icons-vue'

import RelationChart from '/plugins/Chart/RelationChart.js'
import { onUnmounted, reactive, ref, watchEffect } from 'vue'
import Info from './info.vue'

// 初始默认数据
const myData = {
  name: '北京XX软件技术有限公司',
  children: [],
  dataType: '',
  l: {
    children: [
      {
        dataType: 'suppliers',
        name: '供应商 (1)',
        children: [
          {
            name: '北京XX科技股份有限公司',
            dataType: 'suppliers',
            counts: 35,
            children: [],
            value: '风险资产数 [3]',
          },
        ],
        nodeType: 0,
        value: '',
        counts: 1,
      },
      {
        dataType: 'branch',
        name: '分支机构 (1)',
        children: [
          {
            name: '北京XX软件技术有限公司成都分公司',
            dataType: 'branch',
            counts: 0,
            children: [],
            value: '风险资产数 [0]',
          },
        ],
        nodeType: 0,
        value: '',
        counts: 1,
      },
    ],
  },
  r: {
    children: [
      {
        dataType: 'investment',
        name: '对外投资 (2)',
        nodeType: 0,
        children: [
          {
            name: '天津XX软件技术有限公司',
            dataType: 'investment',
            counts: 6,
            children: [],
            value: '风险资产数 [0] 投资比例 [100%]',
          },
          {
            name: '杭州XX软件技术有限公司',
            dataType: 'investment',
            counts: 0,
            children: [],
            value: '风险资产数 [0] 投资比例 [100%]',
          },
        ],
        value: '',
        counts: 2,
      },
    ],
  },
  value: '[风险资产数]2',
  type: 'mainType',
}

// 展开子级数据
const relationsData = {
  count: 6,
  page: 1,
  results: [
    {
      risk_asset_count: 0,
      name: '天津XX软件技术有限公司深圳分公司',
      entId_branches_source:
        '40af952a4a5dd7d7d3d64df644dd9902549215d210e5fb28e67fae4f6bd396b1d96aa42b59151a9e9b5925fc9d95adaf',
      relation_type: 'branch',
      sub_count: 0,
      vul_point: 0,
      fundedRatio: null,
    },
    {
      risk_asset_count: 0,
      name: '天津XX软件技术有限公司杭州分公司',
      entId_branches_source:
        '40af952a4a5dd7d7d3d64df644dd9902549215d210e5fb28e67fae4f6bd396b1d96aa42b59151a9e9b5925fc9d95adaf',
      relation_type: 'branch',
      sub_count: 0,
      vul_point: 0,
      fundedRatio: null,
    },
    {
      risk_asset_count: 0,
      name: '天津XX软件技术有限公司广州分公司',
      entId_branches_source:
        '40af952a4a5dd7d7d3d64df644dd9902549215d210e5fb28e67fae4f6bd396b1d96aa42b59151a9e9b5925fc9d95adaf',
      relation_type: 'branch',
      sub_count: 0,
      vul_point: 0,
      fundedRatio: null,
    },
    {
      risk_asset_count: 0,
      name: '天津XX软件技术有限公司上海分公司',
      entId_branches_source:
        '40af952a4a5dd7d7d3d64df644dd9902549215d210e5fb28e67fae4f6bd396b1d96aa42b59151a9e9b5925fc9d95adaf',
      relation_type: 'branch',
      sub_count: 0,
      vul_point: 0,
      fundedRatio: null,
    },
    {
      risk_asset_count: 0,
      name: '天津XX软件技术有限公司成都分公司',
      entId_branches_source:
        '40af952a4a5dd7d7d3d64df644dd9902549215d210e5fb28e67fae4f6bd396b1d96aa42b59151a9e9b5925fc9d95adaf',
      relation_type: 'branch',
      sub_count: 0,
      vul_point: 0,
      fundedRatio: null,
    },
    {
      risk_asset_count: 0,
      name: '天津XX软件技术有限公司南京分公司',
      entId_branches_source:
        '40af952a4a5dd7d7d3d64df644dd9902549215d210e5fb28e67fae4f6bd396b1d96aa42b59151a9e9b5925fc9d95adaf',
      relation_type: 'branch',
      sub_count: 0,
      vul_point: 0,
      fundedRatio: null,
    },
  ],
  page_size: 10,
}

const lineList = [
  {
    bg: '#f97b72',
    name: '分支机构',
  },
  {
    bg: '#8bc34a',
    name: '供应商',
  },
  {
    bg: '#2196f3',
    name: '对外投资',
  },
]

const state: { activeInfo: any } = reactive({
  activeInfo: {
    id: '',
    isLoading: false,
    name: '',
    industry: {
      Industry: '',
    },
    profileTel: '',
    counts: 0,
  },
})

const infoShow = ref<boolean>(false)

const isfull = ref<boolean>(false)

/**
 * @description: 全屏效果
 * @param {*}
 * @return {*}
 * @author: hjm
 */
const screen = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element: any = document.getElementById('org-box')
  if (isfull.value) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cfs = document as any
    if (cfs.exitFullscreen) {
      cfs.exitFullscreen()
    } else if (cfs.webkitCancelFullScreen) {
      cfs.webkitCancelFullScreen()
    } else if (cfs.mozCancelFullScreen) {
      cfs.mozCancelFullScreen()
    } else if (cfs.msExitFullscreen) {
      cfs.msExitFullscreen()
    }
  } else if (element.requestFullscreen) {
    element.requestFullscreen()
    renderSvg()
  } else if (element.webkitRequestFullScreen) {
    element.webkitRequestFullScreen()
    renderSvg()
  } else if (element.mozRequestFullScreen) {
    element.mozRequestFullScreen()
    renderSvg()
  } else if (element.msRequestFullscreen) {
    // IE11
    element.msRequestFullscreen()
    renderSvg()
  }
  isfull.value = !isfull.value
}

// 判断全屏
const checkFull = () => {
  // 判断浏览器是否处于全屏状态 （需要考虑兼容问题）
  const doc: any = document
  // 火狐浏览器
  let isFull =
    doc.mozFullScreen ||
    doc.fullScreen ||
    // 谷歌浏览器及Webkit内核浏览器
    doc.webkitIsFullScreen ||
    doc.webkitRequestFullScreen ||
    doc.mozRequestFullScreen ||
    doc.msFullscreenEnabled
  if (isFull === undefined) {
    isFull = false
  }
  return isFull
}

const exitScreen = () => {
  if (!checkFull()) {
    // 退出全屏后要执行的动作
    isfull.value = false
  }
}

/**
 * @description: 整理关系数据
 * @param {*} relationInfo
 * @param {*} isMain 判断是否为第一层
 * @return {*}
 * @author: hjm
 */

const fmArr = (originArr: any, type?: string) => {
  const arr = originArr.map((item: any) => {
    let text = item.risk_asset_count >= 0 ? `风险资产数 [${item.risk_asset_count}]` : ''
    const dataType = type || item.relationType
    if (dataType === 'investment') {
      text += ` 投资比例 [${item.fundedRatio}]`
    }
    return {
      name: item.name,
      dataType,
      counts: item.sub_count,
      children: [],
      value: text,
    }
  })
  return arr
}

const initRelation = () => {
  const relation = document.querySelector('#relation')
  relation!.innerHTML = ''
  // 组装数据 格式 data:{r:{},l:{},name:"",value:"",nodeType: 0,children:[],string:any}
  const data = myData
  // eslint-disable-next-line no-new
  new RelationChart(relation as HTMLElement, data, {
    callbackClick: (d: any) => {
      // console.log('callbackClick', d)
      if (d.nodeType == 0) {
        return
      }

      infoShow.value = true
    },
    callbackGetChild: async () => {
      // console.log('callbackGetChild')
      const res = relationsData
      const arr = fmArr(res.results)
      res.results = arr
      return res || {}
    },
    getQuery: async () => {
      // console.log('getQuery')
      const res = relationsData
      const arr = fmArr(res.results)
      res.results = arr
      return res || {}
    },
  })
}

onUnmounted(() => {
  window.removeEventListener('resize', exitScreen) // 移除
})

const renderSvg = () => {
  nextTick(() => {
    initRelation()
  })
}

watchEffect(() => {
  renderSvg()
})
</script>

<style lang="scss">
$content-bg: #fff; //各个浏览器下 全屏状态下背景色设置  :
:-webkit-full-screen {
  background-color: $content-bg !important;
}
:-moz-full-screen {
  background-color: $content-bg !important;
}
:-ms-fullscreen {
  background-color: $content-bg !important;
}
:fullscreen {
  background-color: $content-bg !important;
}
</style>

<style lang="scss" scoped>
.org-content {
  height: calc(100vh - 315px);
  width: 100%;
  position: relative;
  margin-top: -20px;
  overflow-y: hidden;
  .org-btn-list {
    position: absolute;

    right: 30px;
    top: 30px;
    z-index: 1;
    color: #aeb2b8;
    font-size: 12px;
    .btn-icon {
      margin-left: 10px;
      cursor: pointer;
      color: #333;
      font-size: 14px;
    }
  }
  .line-list {
    position: absolute;
    bottom: 10px;
    left: 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #f5f5f5;
    padding: 5px 15px;
    width: 270px;
    border-radius: 5px;
    .line-item {
      display: flex;
      align-items: center;
      justify-content: center;
      div {
        height: 12px;
        width: 12px;
        margin-right: 5px;
      }
    }
  }
}
.fullscreen {
  height: 100vh !important;
  width: 100vw !important;
}
#relation {
  height: 100%;
  width: 100%;
  overflow: hidden;
}

.color-bar {
  width: 8px;
  height: 40%;
  background: #ddd;
  position: absolute;
  z-index: 5;
  left: 15px;
  bottom: 15px;
  border-radius: 5px;
  flex-direction: column;
  justify-content: space-between;
  display: flex;
  span {
    padding-left: 15px;
  }
}
</style>
