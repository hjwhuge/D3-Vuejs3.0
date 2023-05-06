// @ts-nocheck
/* eslint-disable */
import * as d3 from 'd3'

let defaultConfigs = {
  duration: 500, // 动画持续时间
  scaleRange: [0.2, 2], // container缩放范围
  direction: ['r', 'l'], // 分为左右2个方向
  centralPoint: [0, 0], // 画布中心点坐标x,y
  root: { r: {}, l: {} }, // 左右2块数据源
  rootNodeLength: 0, // 根节点名称长度
  rootName: ['根节点', ''], // 根节点名称
  textSpace: 15, // 多行文字间距
  themeColor: '#1db887', // 主色
  nodeSize: [50, 100], // 节点间距(高/水平)
  fontSize: 13, // 字体大小，也是单字所占宽高
  rectMinWidth: 50, // 节点方框默认最小，
  textPadding: 5, // 文字与方框间距,注：固定值5
  circleR: 5, // 圆圈半径
  dirRight: '',
  pageSize: 10, // 一次显示多少条
}

let svg
let dirRight
let forUpward
let className
let nodes
let links
let leng
let circlewidth1
let circlewidth2
let margin1 = { top: 50, right: 0, bottom: -20, left: 100 }

function throttle(fun, delay) {
  let last
  let deferTimer
  return function (args) {
    const that = this
    const _args = arguments
    const now = Number(new Date())
    if (last && now < last + delay) {
      clearTimeout(deferTimer)
      deferTimer = setTimeout(() => {
        last = now
        fun.apply(that, _args)
      }, delay)
    } else {
      last = now
      fun.apply(that, _args)
    }
  }
}
export default class RelationChart {
  constructor(selector, data, configs = {}) {
    this.configs = Object.assign(defaultConfigs, configs) || defaultConfigs
    this.container = selector || document.querySelector('body')
    this.treeData = data || []
    this.configs.rootName[0] = data.name ?? '根节点'
    this.getData(data)
    this.getChildData = configs.callbackGetChild
    this.getQuery = configs.getQuery
    window.onresize = () => {
      throttle(() => {
        setTimeout(() => {
          const svg = document.querySelector('.tree-svg')
          if (svg) {
            svg.style.width = selector.clientWidth + 'px'
            svg.style.height = selector.clientHeight + 'px'
          }
        })
      }, 1000)()
    }
    window.onscroll = () => {
      throttle(() => {
        const svg = document.querySelector('.tree-svg')
        if (svg) {
          svg.style.height = selector.offsetHeight + 'px'
        }
      }, 1000)()
    }
  }

  getData(data) {
    let mynodes
    let left = data.l
    let right = data.r

    for (var i = 0; i < left.children.length; i++) {
      if (left.children[i].counts > this.configs.pageSize) {
        mynodes = left.children[i].children
        left.children[i].children = left.children[i].children.slice(0, this.configs.pageSize)
        left.children[i].children[this.configs.pageSize] = {
          name: '更多',
          type: -1,
          val: left.children[i].counts - this.configs.pageSize,
          children: [],
          entId: data.entId,
          dataType: left.children[i].dataType,
          page: 1,
        }
      }
    }
    for (var i = 0; i < right.children.length; i++) {
      if (right.children[i].counts > this.configs.pageSize) {
        mynodes = right.children[i].children
        right.children[i].children = right.children[i].children.slice(0, this.configs.pageSize)
        right.children[i].children[this.configs.pageSize] = {
          name: '更多',
          type: -1,
          val: right.children[i].counts - this.configs.pageSize,
          children: [],
          entId: data.entId,
          dataType: right.children[i].dataType,
          page: 1,
        }
      }
    }
    this.treeInit(data)
  }

  // 初始化
  treeInit(data) {
    const margin = { top: 0, right: 0, bottom: 0, left: 0 }
    const treeWidth = this.container.clientWidth - margin.left - margin.right // tree容器宽
    const treeHeight = this.container.clientHeight - margin.top - margin.bottom // tree容器高
    const centralY = treeWidth / 2 + margin.left
    const centralX = treeHeight / 2 + margin.top
    this.configs.centralPoint = [centralX, centralY] // 中心点坐标
    // 根节点字符所占宽度
    this.configs.rootNodeLength = this.configs.rootName[0]?.length * this.configs.fontSize + 50

    // svg标签
    svg = d3
      .select('#relation')
      .append('svg')
      .attr('class', 'tree-svg')
      .attr('xmlns', 'http://www.w3.org/2000/svg')
      .attr('width', treeWidth)
      .attr('height', treeHeight)
      .attr('font-size', this.configs.fontSize)
      .attr('fill', '#555')

    // g标签
    this.container = svg
      .append('g')
      .attr('class', 'container1')
      .attr('transform', 'translate(' + margin1.left + ',' + margin1.top + ')scale(0.8)')

    // 画出根节点
    this.drawRoot()
    // 指定缩放范围
    const zoom = d3.zoom().scaleExtent(this.configs.scaleRange).on('zoom', this.zoomFn.bind(this))
    // 动画持续时间
    this.container.transition().duration(this.configs.duration).call(zoom.transform, d3.zoomIdentity)
    svg.call(zoom)
    svg.on('dblclick.zoom', null)
    // 数据处理
    this.dealData(data)
  }

  // 数据处理
  dealData(data) {
    this.configs.direction.forEach((item) => {
      this.configs.root[item] = d3.hierarchy(data[item])
      this.configs.root[item].x0 = this.configs.centralPoint[0] // 根节点x坐标
      this.configs.root[item].y0 = this.configs.centralPoint[1] // 根节点Y坐标

      this.porData(this.configs.root[item], item)
    })
  }

  zoomFn() {
    let weizhi = document.getElementsByClassName('container1')[0]
    weizhi.style.transform = '' // 偏移位置
    let zoom = d3.event.transform
    return this.container.attr(
      'transform',
      'translate(' +
        (Number(zoom.x) + Number(margin1.left)) +
        ',' +
        (zoom.y + margin1.top) +
        ')scale(' +
        zoom.k * 0.8 +
        ')',
    )
  }
  // 数据重组
  DataReor(d, direction, source, appendData) {
    let setDepth = function (node, num, appendLeaf) {
      // 重新设置depth

      node.depth = num
      if (node.children && node.children.length) {
        // 遍历children
        node.children.forEach((item) => {
          setDepth(item, num + 1, appendLeaf)
        })
      } else {
        appendLeaf.push(node)
      }
    }

    let setHeight = function (arr, num) {
      // 重新设置height
      let parent = []
      arr.forEach((node) => {
        node.height = Math.max(num, node.height)
        if (node.parent && parent.indexOf(node.parent) == -1) {
          parent.push(node.parent)
        }
      })

      if (parent.length) {
        setHeight(parent, num + 1)
      }
    }

    let appendLeaf = [] // 增加的叶子节点

    if (appendData.children.length) {
      d.children = []
      appendData.children.forEach((item, index) => {
        let newNode = d3.hierarchy(item)
        newNode.parent = d
        newNode.height = -1
        setDepth(newNode, d.depth + 1, appendLeaf)
        d.children.push(newNode)
      })
    }

    if (appendLeaf.length) {
      setHeight(appendLeaf, 0)
    }

    if (source.data.name == '更多') {
      source.parent.descendants().forEach((d) => {
        d._children = d.children
        d.id = direction + this.uuid()
      })
    } else {
      source.descendants().forEach((d) => {
        d._children = d.children
        d.id = direction + this.uuid()
      })
    }
    this.update(d, direction)
  }

  // 遍历
  porData(obj, item) {
    obj.descendants().forEach((d) => {
      d._children = d.children
      d.id = item + this.uuid()
    })
    this.update(obj, item)
  }

  uuid() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1)
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4()
  }

  update(source, direction) {
    dirRight = direction === 'r' ? 1 : -1 // 方向为右/左
    forUpward = direction == 'r'
    className = `${direction}gNode`
    let tree = d3
      .tree()
      .nodeSize(this.configs.nodeSize)
      .separation((a, b) => {
        let result = a.parent === b.parent && !a.children && !b.children ? 1 : 2
        return result
      })
    let treeData = tree(this.configs.root[direction])
    nodes = treeData.descendants()
    links = treeData.links()
    const that = this
    let data = []
    if (nodes.length > 1) {
      for (let i = 0; i < nodes.length; i++) {
        if (!data[nodes[i].depth]) {
          let arr = []
          arr.push(nodes[i])
          data[nodes[i].depth] = arr
        } else {
          data[nodes[i].depth].push(nodes[i])
        }
      }
      // 检测最大长度
      this.testLength(data, dirRight)
    }
    nodes.forEach((d) => {
      d.y = dirRight * (d.y + this.configs.rootNodeLength / 2) + this.configs.centralPoint[1]
      d.x = d.x + this.configs.centralPoint[0]
    })

    // 根据class名称获取左或者右的g节点，达到分块更新
    const node = this.container.selectAll(`g.${className}`).data(nodes, (d) => d.id)

    // 新增节点，tree会根据数据内的children扩展相关节点
    const nodeEnter = node
      .enter()
      .append('g')
      .attr('id', (d) => `g${d.id}`)
      .attr('class', className)
      .attr('style', 'cursor: pointer;')
      .attr('transform', (d) => `translate(${source.y0},${source.x0})`)
      .attr('fill-opacity', 0)
      .attr('stroke-opacity', 0)
      .on('click', (d) => {
        clearTimeout(that.timer)
        that.timer = setTimeout(() => {
          if (d.data.name == '更多') {
            that.clickNode(d, direction, source)
            return
          }
          that.configs.callbackClick(d.data)
        }, 300)
      })
      .on('dblclick', function (d) {
        clearTimeout(that.timer)

        d3.select(this)
          .selectAll('.node-circle .node-circle-vertical')
          .transition()
          .duration(that.configs.duration)
          .attr('stroke-width', (d) => {
            if (d.children) {
              return 1
            } else {
              return 0
            }
          })

        if (d.data.name == '更多') {
          return that.clickNode(d, direction, source)
        } else if (d.depth !== 0) {
          return that.clickNode(d, direction, source)
        }
      })
    nodeEnter.each((d) => {
      if (d.depth > 0) {
        this.drawText(`g${d.id}`, dirRight)
        if (d.data.attName) {
          this.drawCodeText(`g${d.id}`, dirRight)
        }
        if (d.data.value) {
          this.drawTsText(`g${d.id}`, dirRight)
        }

        this.drawRect(`g${d.id}`, dirRight)
        this.marker(`g${d.id}`, dirRight)
      }

      if (d.depth > 0) {
        const width = Math.min(d.data.name.toString().length * 14, this.configs.rectMinWidth)
        let right = dirRight > 0
        let xDistance = right ? width : -width
        // 如果存在子集 则绘图 + 号
        if (d.data?.counts > 0 && !['供应商', '对外投资', '分支机构'].includes(d.data?.name)) {
          this.drawCircle(`g${d.id}`, dirRight, source, direction)
        }
        this.drawSign(`g${d.id}`, dirRight) // 画标记
      }

      // 画节点数量
      if (d.data.type == -1) {
        this.drawLength(`g${d.id}`, dirRight)
      }
    })

    // 更新节点：节点enter和exit时都会触发tree更新
    const nodeUpdate = node
      .merge(nodeEnter)
      .transition()
      .duration(this.configs.duration)
      .attr('transform', function (d) {
        if (d.data.isNextNode) {
          d3.select(this)
            .selectAll('.node-circle .node-circle-vertical')
            .transition()
            .duration(that.configs.duration)
            .attr('stroke-width', (d) => {
              if (d.children) {
                return 0
              } else {
                return 1
              }
            })
        }

        let index = 0

        return 'translate(' + d.y + ',' + d.x + ')'
      })
      .attr('fill-opacity', 1)
      .attr('stroke-opacity', 1)

    // 移除节点:tree移除掉数据内不包含的节点(即，children = false)
    const nodeExit = node
      .exit()
      .transition()
      .duration(that.configs.duration)
      .remove()
      .attr('transform', (d) => `translate(${source.y},${source.x})`)
      .attr('fill-opacity', 0)
      .attr('stroke-opacity', 0)

    // Update the links 根据 className来实现分块更新
    const link = this.container.selectAll(`path.${className}`).data(links, (d) => d.target.id)

    // Enter any new links at the parent's previous position.
    // insert是在g标签前面插入，防止连接线挡住G节点内容
    const linkEnter = link
      .enter()
      .insert('path', 'g')
      .attr('class', className)
      .attr('d', (d) => {
        const o = { x: source.x0, y: source.y0 }

        return this.diagonal({ source: o, target: o })
      })
      .attr('fill', 'none')
      .attr('stroke-width', 0.5)
      .attr('stroke', '#D8D8D8')

    // Transition links to their new position.
    link.merge(linkEnter).transition().duration(this.configs.duration).attr('d', this.diagonal)

    // Transition exiting nodes to the parent's new position.
    link
      .exit()
      .transition()
      .duration(this.configs.duration)
      .remove()
      .attr('d', (d) => {
        const o = { x: source.x, y: source.y }

        return this.diagonal({ source: o, target: o })
      })

    // Stash the old positions for transition.
    this.configs.root[direction].eachBefore((d) => {
      d.x0 = d.x
      d.y0 = d.y
    })
  }

  // 检测最大长度
  testLength(data, dirRight) {
    let level = []
    let width1
    let width2

    let testG = svg.append('g').attr('class', 'testG')

    for (let i = 0; i < data.length; i++) {
      let newArr = []

      for (let j = 0; j < data[i].length; j++) {
        if (data[i][j].data.attName) {
          testG
            .append('text')
            .style('font-size', this.configs.fontSize)
            .text((d) => '(' + data[i][j].data.attName + ')')
            .attr('class', 'test')
            .attr('width', function (d) {
              width3 = d3.select(this.getComputedTextLength())._groups[0][0]
            })
        }
        if (data[i][j].data.value) {
          testG
            .append('text')
            .style('font-size', this.configs.fontSize)
            .text((d) => {
              const len = data[i][j].data.name.length
              if (len > 20) {
                return data[i][j].data.name.substring(0, 20) + '...'
              } else {
                return data[i][j].data.name
              }
            })
            .attr('class', 'test')
            .attr('width', function (d) {
              width1 = d3.select(this.getComputedTextLength())._groups[0][0]
            })
          testG
            .append('text')
            .style('font-size', this.configs.fontSize)
            .text((d) => data[i][j].data.value)
            .attr('class', 'test')
            .attr('width', function (d) {
              width2 = d3.select(this.getComputedTextLength())._groups[0][0]
            })

          if (data[i][j].data.attName) {
            if (Number(width1) + Number(width3) > Number(width2)) {
              newArr.push(Number(width1) + Number(width3) + 100)
            } else {
              newArr.push(Number(width2) + 100)
            }
          } else {
            if (Number(width1) > Number(width2)) {
              newArr.push(Number(width1) + 100)
            } else {
              newArr.push(Number(width2) + 100)
            }
          }
        } else {
          testG
            .append('text')
            .style('font-size', this.configs.fontSize)
            .text((d) => {
              if (data[i][j].data.name) {
                const len = data[i][j].data.name.length
                if (len > 20) {
                  return data[i][j].data.name.substring(0, 20) + '...'
                } else {
                  return data[i][j].data.name
                }
              }
            })
            .attr('class', 'test')
            .attr('width', function (d) {
              width1 = d3.select(this.getComputedTextLength())._groups[0]

              newArr.push(Number(width1) + 100)
              data.width1 = d3.select(this.getComputedTextLength())._groups[0]
            })
        }
      }
      level.push(Math.max.apply(null, newArr))
    }
    d3.select('body').selectAll('.testG').remove()
    this.seat(level, dirRight, data)
  }

  seat(newArr, dirRight, data) {
    for (let j = 0; j < newArr.length; j++) {
      if (j != 0) {
        for (let i = 0; i < data[j].length; i++) {
          data[j][i].y = data[j - 1][0].y + newArr[j - 1] - 40
        }
      }
    }
  }

  // 点击某个节点
  clickNode(d, direction, source) {
    if (d.children || d.children) {
      this.collapse(d, direction, 1)
    } else {
      this.expand(d, direction, source)
    }
  }

  async getNode(d, direction, source, type) {
    let mynodes
    // if (!d.data.isNextNode && d.data.type != -1) {
    //   return;
    // }

    if (d.data.name == '更多') {
      let isType = false
      const pname = d.parent.data.name.split('(')[0].trim()
      if (['供应商', '分支机构', '对外投资'].includes(pname)) {
        isType = true
      }
      let res = (await this.getQuery(d.data, isType)) || []
      let data = res.results

      d.parent.data.children = d.parent.data.children.slice(0, d.parent.data.children.length - 1)
      if (data.length == 0) {
        return
      }
      mynodes = data
      const residue = res.count - res.page * res.page_size
      const newArr = d.parent.data.children.concat(data)
      d.parent.data.children = newArr
      if (residue > 0) {
        d.parent.data.children[d.parent.data.children.length + 1] = {
          name: '更多',
          type: -1,
          val: residue,
          children: [],
          page: res.page,
          entId: d.data.entId,
          dataType: d.data.dataType,
        }
      }
      var appendData = {
        children: newArr,
      }
      this.DataReor(d.parent, direction, source, appendData)
    } else if (type == 1) {
      var appendData = {
        children: [],
      }
      this.DataReor(d, direction, source, appendData)
    } else {
      // 请求数据

      let res = (await this.getChildData(d.data)) || []

      let data = res.results
      if (data.length == 0) {
        return
      }
      mynodes = data

      if (res.count > this.configs.pageSize) {
        data = data.slice(0, this.configs.pageSize)
        data[this.configs.pageSize + 1] = {
          name: '更多',
          type: -1,
          val: res.count - this.configs.pageSize,
          children: [],
          page: 1,
          entId: d.data.entId,
          dataType: '',
        }
      }
      d.data.children = data
      var appendData = {
        children: data,
      }
      this.DataReor(d, direction, source, appendData)
    }
  }

  expand(d, direction, source) {
    if (d.data.name == '更多') {
      this.getNode(d, direction, source)
      return
    }
    if (d._children) {
      d.children = d._children

      d._children = null
      this.update(d, direction)
    } else {
      // 异步获取数据
      this.getNode(d, direction, source)
    }
  }

  collapse(d, direction, obj) {
    if (d.children) {
      d._children = d.children
      d.children = null
    }
    if (obj == 1) {
      this.update(d, direction)
    }
  }

  getTsTextColor(name) {
    switch (name) {
      default:
        return 'black'
    }
  }
  // 末 节点 边框颜色
  getRectStorke(type) {
    switch (type) {
      case 'suppliers':
        return 'rgb(139, 195, 74)'
      case 'branch':
        return 'rgb(249, 123, 114)'
      case 'investment':
        return 'rgb(18, 139, 237)'
      default:
        return '#16968c'
    }
  }
  isNull(val) {
    return val ? val : ''
  }

  // 画根节点
  drawRoot() {
    const title = this.container
      .append('g')
      .attr('id', 'rootTitle')
      .attr('transform', `translate(${this.configs.centralPoint[1]},${this.configs.centralPoint[0]})`)
    title
      .append('svg:rect')
      .attr('class', 'rootTitle')
      .attr('y', 0)
      .attr('x', -this.configs.rootNodeLength / 2)
      .attr('width', this.configs.rootNodeLength)
      .attr('height', 0)
      .attr('rx', 5) // 圆角
      .style('fill', this.configs.themeColor)
    this.configs.rootName.forEach((name, index) => {
      title
        .append('text')
        .attr('fill', 'white')
        .attr('y', () => {
          return 5
        })
        .attr('text-anchor', 'middle')
        .style('font-size', () => {
          if (index == 1) {
            return '10px'
          } else {
            return '15px'
          }
        })
        .text(name)

      let lineHeight = (index + 2) * this.configs.textSpace
      d3.select('#rootTitle rect')
        .attr('height', lineHeight)
        .attr('y', -lineHeight / 2)
    })
  }

  // 画连接线
  diagonal({ source, target }) {
    let s = source
    let d = target

    if (forUpward) {
      return (
        'M' +
        s.y +
        ',' +
        s.x +
        'L' +
        (s.y + (d.y - s.y) - 20) +
        ',' +
        s.x +
        'L' +
        (s.y + (d.y - s.y) - 20) +
        ',' +
        d.x +
        'L' +
        d.y +
        ',' +
        d.x
      )
    } else {
      return (
        'M' +
        s.y +
        ',' +
        s.x +
        'L' +
        (s.y + (d.y - s.y) + 20) +
        ',' +
        s.x +
        'L' +
        (s.y + (d.y - s.y) + 20) +
        ',' +
        d.x +
        'L' +
        d.y +
        ',' +
        d.x
      )
    }
  }

  // 画箭头
  marker(id, dirRight) {
    let gMark = d3
      .select(`#${id}`)
      .append('g')
      .attr('transform', dirRight > 0 ? 'translate(-20,0)' : 'translate(12,0)')
    return gMark
      .insert('path', 'text')

      .attr('d', (d) => {
        if (d.data.nodeType == 0 && dirRight > 0) {
          return 'M0,0L0,3L9,0L0,-3Z'
        } else if (d.data.nodeType == 0 && dirRight < 0) {
          return 'M0,0L9,-3L9,3Z'
        }
      })
      .style('fill', (d) => this.getRectStorke(d.data.dataType))
  }

  // 华标记
  drawSign(id, dirRight) {
    return d3
      .select(`#${id}`)
      .insert('circle', 'text')
      .attr('cx', dirRight > 0 ? -5 : 5)
      .attr('y', -2.5)
      .attr('r', (d) => {
        if (d.data.nodeType == 0) {
          return 4
        }
      })
      .style('fill', (d) => this.getRectStorke(d.data.dataType))
  }
  // 画文本
  drawText(id, dirRight) {
    dirRight = dirRight > 0 // 右为1，左为-1
    let that = this
    return d3
      .select(`#${id}`)
      .append('text')
      .attr('y', (d) => {
        if (d.data.value) {
          return that.configs.textPadding - 8
        } else {
          return that.configs.textPadding
        }
      })
      .attr('x', (d) => (dirRight ? that.configs.textPadding : -that.configs.textPadding))
      .attr('text-anchor', dirRight ? 'start' : 'end')
      .style('font-size', that.configs.fontSize)
      .text((d) => {
        if (d.data && d.data.name) {
          const len = d.data.name.toString().length
          if (len > 20) {
            return d.data.name.substring(0, 20) + '...'
          } else {
            return d.data.name
          }
        } else {
          return d.data.nodeName
        }
      })
      .attr('fill', (d) => {
        if (d.data.nodeType == -1) {
          return 'rgb(33, 150, 243)'
        } else if (d.data.nodeType == 0 || d.data.attName) {
          return '#fff'
        } else {
          return '#333'
        }
      })

      .attr('width', function (d) {
        circlewidth1 = d3.select(this.getComputedTextLength())._groups[0][0]
        return d3.select(this.getComputedTextLength())._groups[0][0]
      })
  }
  // 画子文本
  drawTsText(id, dirRight) {
    let that = this
    return d3
      .select(`#${id} text`)
      .append('tspan')
      .attr('fill', (d) => (d.data.attName ? '#fff' : '#999'))
      .attr('y', (d) => {
        if (d.data.value) {
          return that.configs.textPadding + 8
        }
      })
      .attr('x', (d) => {
        if (dirRight > 0) {
          return that.configs.textPadding
        } else {
          return -5
        }
      })
      .style('font-size', '11px')
      .text((d) => {
        return d.data.value
      })

      .attr('width', function (d) {
        circlewidth2 = d3.select(this.getComputedTextLength())._groups[0][0]
        return d3.select(this.getComputedTextLength())._groups[0][0]
      })
  }
  // 画股票代码
  drawCodeText(id, dirRight) {
    let that = this
    return d3
      .select(`#${id} text`)
      .append('tspan')
      .attr('fill', (d) => '#fff')
      .attr('y', (d) => {
        if (d.data.value) {
          return that.configs.textPadding + 8
        }
      })
      .style('font-size', '11px')
      .attr('x', (d) => {
        if (dirRight > 0) {
          return that.configs.textPadding
        } else {
          return -5
        }
      })
      .text((d) => {
        return d.data.attName + ' '
      })

      .attr('width', function (d) {
        circlewidth3 = d3.select(this.getComputedTextLength())._groups[0][0]
        return d3.select(this.getComputedTextLength())._groups[0][0]
      })
  }
  // 节点数量
  drawLength(id) {
    return d3
      .select(`#${id} text`)
      .append('tspan')
      .attr('fill', (d) => '#999')
      .text((d) => {
        if (d.data.type == -1) {
          return ' (' + d.data.val + ')'
        }
        return ' [' + d.data.value + ']'
      })
      .attr('fill', 'rgb(33, 150, 243)')
      .attr('width', function (d) {
        return d3.select(this.getComputedTextLength())._groups[0]
      })
  }
  // 画方框阴影
  drawFilter(id) {
    return d3
      .select(`#${id}`)
      .insert('defs', 'rect')
      .append('filter')
      .attr('id', `f${id}`)
      .attr('x', 0)
      .attr('y', 0)
      .append('feGaussianBlur')
      .attr('in', 'SourceGraphic')
      .attr('stdDeviation', '5')
  }

  // 画方框
  drawRect(id, dirRight) {
    let realw = document.getElementById(id).getBBox().width + 25 // 获取g实际宽度后，设置rect宽度
    if (document.getElementById(id).getBBox().width > 400) {
      realw = 400
    }
    let that = this
    return d3
      .select(`#${id}`)
      .insert('rect', 'text')
      .attr('x', (d) => {
        if (dirRight < 0) {
          return -realw
        } else {
          0
        }
      })
      .attr('y', (d) => {
        if (d.data.value) {
          return -that.configs.textSpace + that.configs.textPadding - 11
        } else {
          return -that.configs.textSpace + that.configs.textPadding - 4
        }
      })
      .attr('width', (d) => {
        // if (d.data.isNextNode) {//判断是否有下级节点
        //     return realw
        // } else {
        //     return realw - 15
        // }
        return realw
      })
      .attr('height', (d) => {
        if (d.data.value) {
          return that.configs.textSpace + that.configs.textPadding + 22
        } else {
          return that.configs.textSpace + that.configs.textPadding + 8
        }
      })
      .attr('stroke-width', (d) => (d.data.nodeType == 0 || d.data.type == -1 || d.data.attName ? 0 : 0.5))
      .attr('rx', 2) // 圆角

      .style('stroke', (d) => (d.data.nodeType == -1 ? '' : that.getRectStorke(d.data.dataType)))
      .style('fill', (d) => {
        if (d.data.nodeType == -1) {
          return 'rgb(241, 241, 241)'
        } else if (d.data.nodeType == 0) {
          return that.getRectStorke(d.data.dataType)
        } else if (d.data.attName) {
          return 'rgb(33, 150, 243)'
        } else {
          return '#fff'
        }
      })
  }

  // 画circle
  drawCircle(id, dirRight, source, direction) {
    let that = this
    let gMark = d3
      .select(`#${id}`)
      .append('g')
      .attr('class', 'node-circle')
      .attr('stroke', 'rgb(153, 153, 153)')
      .attr('transform', (d) => {
        if (d.data.value) {
          if (circlewidth1 > circlewidth2) {
            leng = Number(circlewidth1) + 15
          } else {
            leng = Number(circlewidth2) + 15
          }

          // leng = Number(circlewidth1) + Number(circlewidth2) + 25;
          if (leng > 390) {
            leng = 390
          }
          if (dirRight == 1) {
            return 'translate(' + leng + ',0)'
          } else {
            return 'translate(' + -leng + ',0)'
          }
        } else {
          leng = Number(circlewidth1) + 15
          if (dirRight == 1) {
            return 'translate(' + leng + ',0)'
          } else {
            return 'translate(' + -leng + ',0)'
          }
        }
      })
      // .attr('stroke-width', d => d.data.isNextNode ? 1 : 0);   判断是否有下级节点
      .attr('stroke-width', (d) => (d.data.type == '-1' ? 0 : 1))
      .on('click', function (d) {
        d3.event.stopPropagation()
        // == 更新图标
        d3.select(this)
          .selectAll('.node-circle .node-circle-vertical')
          .transition()
          .duration(that.configs.duration)
          .attr('stroke-width', (d) => {
            if (d.children) {
              return 1
            } else {
              return 0
            }
          })
        if (d.depth !== 0) {
          return that.clickNode(d, direction, source)
        }
      })
      .on('mouseover', function (d) {
        d3.select(this).attr('stroke', 'rgb(18, 139, 237)')
      })
      .on('mouseout', function (d) {
        d3.select(this).attr('stroke', 'rgb(153, 153, 153)')
      })

    gMark
      .append('circle')
      .attr('fill', 'none')
      .attr('r', (d) => {
        if (d.data.type == '-1') {
          return 0
        }
        return 5
      }) // 根节点不设置圆圈
      .attr('fill', '#ffffff')
    let padding = this.configs.circleR - 2

    gMark.append('path').attr('d', `m -${padding} 0 l ${2 * padding} 0`) // 横线

    gMark
      .append('path') // 竖线，根据展开/收缩动态控制显示
      .attr('d', `m 0 -${padding} l 0 ${2 * padding}`)
      .attr('stroke-width', (d) => {
        if (d.data.type == '-1') {
          return 0
        }
        return 1
      })
      .attr('class', 'node-circle-vertical')
    return gMark
  }
}

;(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined'
    ? (module.exports = factory)
    : ((global = global || self), (global.RelationChart = factory))
})(this, RelationChart)
