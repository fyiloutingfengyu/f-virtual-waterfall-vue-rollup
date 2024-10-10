<template>
  <div
    ref="containerRef"
    class="virtual-waterfall-component"
    :style="{
      height: setContainerHeight(),
      padding: `0 ${pxToVW(containerPadding)}`
    }"
  >
    <div
      ref="contentRef"
      class="content-box"
    >
      <template
        v-for="value in renderMap"
        :key="value.index"
      >
        <div
          class="waterfall-item"
          :id="`item_${value.index}`"
          :style="{
            width: `${value.width}px`,
            height: `${value.height}px`,
            transform: `translate(${value.left}px, ${value.top}px)`,
            ...waterfallItemStyle
          }"
        >
          <slot
            name="itemContent"
            :item="value"
          >
            <div
              class="img-box"
              :style="{ height: `${value.imgBoxHeight}px` }"
            >
              <span class="idx">{{ value.index }}</span>
            </div>
            <div class="text-box ellipsis-line-2">{{ value.text }}</div>
          </slot>
        </div>
      </template>
    </div>
    <div v-if="isLoadingNextPage">
      <slot name="loadingContent">
        <div class="loading-text">加载中...</div>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, reactive, watch } from 'vue';
import { pxToVW, throttle } from '../utils/common';

interface ColumnHeightItem {
  index: number;
  height: number;
}

interface DomeDataItem {
  index: number;
  columnIndex: number;
  width: number;
  height: number;
  imgBoxHeight: number;
  left: number;
  top: number;
  text: string;
  textBoxHeight: number;
}

interface RenderMap {
  [key: string | number]: DomeDataItem;
}

interface TextBoxParams {
  paddingLeft: number;
  paddingRight: number;
  marginTop: number;
  marginBottom: number;
  lineHeight: number;
  maxRows?: number;
}

type TextBoxParamsKey = keyof TextBoxParams;

defineOptions({
  name: 'VirtualWaterfall'
});

// 按 750 设计稿下的尺寸和字体大小
const props = defineProps({
  // 两列水平方向的间距
  gapX: {
    type: Number,
    default: 16
  },
  // 两行垂直方向的间距
  gapY: {
    type: Number,
    default: 16
  },
  // 每页请求回来的数据条数
  pageSize: {
    type: Number,
    default: 20
  },
  // 展示的列数
  columnNumber: {
    type: Number,
    default: 2
  },
  // 外层包裹容器的高度
  containerHeight: {
    type: [Number, String],
    default: '100vh'
  },
  // 外层包裹容器的top属性或margin-top的值
  containerTop: {
    type: Number,
    default: 0
  },
  // 外层包裹容器的左右 padding 值
  containerPadding: {
    type: Number,
    default: 20
  },
  // 文字的字体
  textFont: {
    type: String,
    default: '16px sans-serif'
  },
  // 底部加载中盒子高度
  loadingBoxHeight: {
    type: Number,
    default: 60
  },
  // 传入的值需要和样式文件中的值保持一致
  textBoxParams: {
    type: Object,
    default: () => {
      return {
        paddingLeft: 10,
        paddingRight: 10,
        marginTop: 10,
        marginBottom: 10,
        lineHeight: 24,
        maxRows: 2
      };
    }
  },
  // 每项的样式
  waterfallItemStyle: {
    type: Object,
    default: () => {
      return {};
    }
  },
  // 从后台获取数据的方法
  getList: {
    type: Function,
    default: () => {
      return new Promise((resolve) => {
        resolve([]);
      });
    }
  }
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const slots = defineSlots<{
  itemContent(props: { item: DomeDataItem }): any;
  loadingContent(props: any): any;
}>();

const designWidth = 750;
const containerRef = ref<HTMLDivElement | null>(null);
const contentRef = ref<HTMLDivElement | null>(null);
// 当前渲染的页码
const page = ref(1);
const hasNextPage = ref(true);
// 每列的宽度
const columnWidth = ref(0);
// 对后台返回的数据处理后的数据，增加了位置信息，存放总的数据
const domDataList = ref<DomeDataItem[]>([]);
// 每列的高度列表
const columnHeightList = ref<ColumnHeightItem[]>([]);
// 存放当前被渲染出来的元素
const renderMap = ref<RenderMap>({});
// 当前被渲染出来的元素的开头位置的下标
const startIndex = ref(0);
// 当前被渲染出来的元素的结尾位置的下标
const endIndex = ref(0);
// 上下各展示半屏的余量
const containerOffset = window.innerHeight / 2;
// 是否正在加载下一页的数据
const isLoadingNextPage = ref(false);
// 页面滑动方向，上滑为 1（页面底部追加数据），下滑为 -1（页面顶部追加数据）
const scrollDirection = ref(1);
// 垂直方向上上次滚动的距离
const lastScrollTop = ref(0);
// 转换为当前视口下的 textBoxParams 尺寸
const realTextBoxParams = reactive<TextBoxParams>({
  paddingLeft: 10,
  paddingRight: 10,
  marginTop: 10,
  marginBottom: 10,
  lineHeight: 24
});
const canvas = document.createElement('canvas');
const getTextBoxHeightCtx: any = canvas.getContext('2d');

if (getTextBoxHeightCtx) {
  getTextBoxHeightCtx.font = props.textFont;
}

// 将750设计稿对应的尺寸转为当前容器视口下的大小
// 用于页面计算的尺寸全部都需要通过此方法转换
const getSizeByViewport = (size: number) => {
  let containerWidth = 375;

  if (containerRef.value) {
    containerWidth = containerRef.value.offsetWidth;
  }

  return containerWidth / (designWidth / size);
};

watch(
  () => props.textBoxParams,
  (newVal) => {
    for (const key in realTextBoxParams) {
      if (Object.hasOwn(realTextBoxParams, key)) {
        if (newVal) {
          realTextBoxParams[key as TextBoxParamsKey] = getSizeByViewport(
            newVal[key]
          );
        }
      }
    }
  },
  {
    immediate: true,
    deep: true
  }
);

onMounted(() => {
  if (containerRef.value) {
    containerRef.value.addEventListener('scroll', handleScroll);
  }
});

onUnmounted(() => {
  if (containerRef.value) {
    containerRef.value.removeEventListener('scroll', handleScroll);
  }
});

// 初始化数据
const init = async () => {
  if (!props.getList) {
    return;
  }

  // 获取列表数据
  const list: any = await props.getList((page.value - 1) * props.pageSize);

  if (Array.isArray(list)) {
    hasNextPage.value = list.length === props.pageSize;
  }

  // 计算每列的宽度
  computedColumnWidth();
  // 初始化每列高度
  initColumnHeightList();
  // 给后台返回的数据设置位置信息
  computedDomData(list);
  // 渲染元素节点
  renderDomByDataList();
};

init();

// 设置外层容器的高度
const setContainerHeight = () => {
  if (typeof props.containerHeight === 'number') {
    return pxToVW(props.containerHeight);
  } else {
    return props.containerHeight;
  }
};

// 设置每列的宽度
const computedColumnWidth = () => {
  const allGapWidth = props.gapX * (props.columnNumber - 1);

  // 使用当前视口的宽高尺寸
  const containerWidth = containerRef.value?.offsetWidth || 375;

  columnWidth.value =
    (containerWidth -
      getSizeByViewport(allGapWidth + props.containerPadding * 2)) /
    props.columnNumber;
};

// 初始化每列高度列表
const initColumnHeightList = () => {
  const tempList: ColumnHeightItem[] = [];

  for (let i = 0; i < props.columnNumber; i++) {
    tempList.push({
      index: i + 1,
      height: 0
    });
  }

  columnHeightList.value = tempList;
};

// 对后台请求回来的数据进行处理，生成带位置信息的数据
const computedDomData = (list: any[], startRenderIndex = 0) => {
  const tempDomDataList: DomeDataItem[] = [];

  for (let i = 0, len = list.length; i < len; i++) {
    const imgHeight = Math.ceil((columnWidth.value / list[i].w) * list[i].h);

    const item = {
      // 是下标也是唯一标识，可以用作ID
      index: startRenderIndex + i,
      columnIndex: 0,
      width: columnWidth.value,
      // 后台返回的数据中需要包含图片的宽高信息（h和w）
      // 根据后台返回的图片的宽高比计算实际展示的高度
      height: imgHeight,
      imgBoxHeight: imgHeight,
      left: 0,
      top: 0,
      text: list[i].text,
      textBoxHeight:
        realTextBoxParams.lineHeight +
        realTextBoxParams.marginTop +
        realTextBoxParams.marginBottom
    };

    // 将当前数据放入高度最短的列
    columnHeightList.value.sort((a, b) => a.height - b.height);

    item.columnIndex = columnHeightList.value[0].index;
    item.left =
      (item.columnIndex - 1) *
      (getSizeByViewport(props.gapX as number) + columnWidth.value);

    item.top = columnHeightList.value[0].height;

    let textWidth = 0;

    if (getTextBoxHeightCtx) {
      textWidth = getSizeByViewport(
        getTextBoxHeightCtx.measureText(item.text).width
      );
    }

    const rows = Math.ceil(
      (textWidth +
        realTextBoxParams.paddingLeft +
        realTextBoxParams.paddingRight) /
        columnWidth.value
    );

    if (rows >= props.textBoxParams.maxRows) {
      item.textBoxHeight +=
        realTextBoxParams.lineHeight * (props.textBoxParams.maxRows - 1);
    }

    item.height += item.textBoxHeight;

    columnHeightList.value[0].height +=
      item.height + getSizeByViewport(props.gapY as number);

    tempDomDataList.push(item);
  }

  domDataList.value = domDataList.value.concat(tempDomDataList);
  // 每次追加完数据后，更新瀑布流内容容器的高度
  updateContentHeight();
};

// 更新瀑布流内容容器的高度
const updateContentHeight = () => {
  columnHeightList.value.sort((a, b) => a.height - b.height);

  if (contentRef.value) {
    // 瀑布流列表区域的高度为最高的列的高度
    contentRef.value.style.height =
      columnHeightList.value[columnHeightList.value.length - 1].height +
      getSizeByViewport(props.loadingBoxHeight as number) +
      'px';
  }
};

// 根据处理后的数据渲染列表
const renderDomByDataList = (startRenderIndex = 0) => {
  if (!domDataList.value.length) return;

  const tempRenderMap: RenderMap = {};

  // 渲染上下边界之间的元素
  // 从当前渲染出来的元素的后一个元素的位置开始遍历，直到总数据的结尾
  for (let i = startRenderIndex, len = domDataList.value.length; i < len; i++) {
    const { index } = domDataList.value[i];
    const { isOverTopLine, isUnderBottomLine } = getBoundaryInfo(
      domDataList.value[i]
    );

    // 移除渲染区域之外的元素,并跳出本次循环
    if (isOverTopLine) {
      delete renderMap.value[i];
      continue;
    }

    // 遇到第一个在渲染下线之下的元素时，停止循环
    if (isUnderBottomLine) {
      delete renderMap.value[i];
      break;
    }

    tempRenderMap[index] = domDataList.value[i];
  }

  // 初始化或追加数据的时候，将本次符合渲染条件的数据追加到渲染列表中
  Object.assign(renderMap.value, tempRenderMap);

  const keys = Object.keys(renderMap.value);

  // 通过加号转为数字
  startIndex.value = +keys[0];
  endIndex.value = +keys[keys.length - 1];
};

// 获取当前元素的边界信息
const getBoundaryInfo = (item: DomeDataItem) => {
  const { top, height } = item;

  // 当前元素的底部的位置
  const y = top + height + getSizeByViewport(props.containerTop as number);

  let topLine = -containerOffset;
  let bottomLine = containerOffset;

  if (containerRef.value) {
    // 向上扩展半屏
    topLine = containerRef.value.scrollTop - containerOffset;

    // 向下扩展半屏
    bottomLine =
      containerRef.value.scrollTop +
      containerRef.value.offsetHeight +
      containerOffset;
  }

  // 是否在上线之上
  const isOverTopLine = topLine > y;

  // 是否在下线之下
  const isUnderBottomLine = top > bottomLine;

  return {
    isOverTopLine,
    isUnderBottomLine
  };
};

// 处理容器的滚动事件
const handleScroll = throttle(async () => {
  let scrollTop = 0;
  let offsetHeight = 0;
  let scrollHeight = 0;

  if (containerRef.value) {
    scrollTop = containerRef.value.scrollTop;
    offsetHeight = containerRef.value.offsetHeight;
    scrollHeight = containerRef.value.scrollHeight;
  }

  scrollDirection.value = scrollTop - lastScrollTop.value > 0 ? 1 : -1;
  lastScrollTop.value = scrollTop;

  updateDomPosition(scrollDirection.value);

  if (isLoadingNextPage.value || !hasNextPage.value) return;

  // 当已经展示出来的内容高度大于当前数据内容总高度的80%的时候开始加载新数据
  if (scrollTop + offsetHeight >= scrollHeight * 0.8) {
    isLoadingNextPage.value = true;

    // page 加1，获取下一页数据
    page.value += 1;

    let list: any = [];

    if (!props.getList) {
      return;
    }

    try {
      list = await props.getList((page.value - 1) * props.pageSize);

      if (Array.isArray(list)) {
        hasNextPage.value = list.length === props.pageSize;
      }
    } catch (err) {
      console.log(err);
      isLoadingNextPage.value = false;
    }

    isLoadingNextPage.value = false;
    // 处理下一页数据，从下一页数据的开始位置的下标开始操作数据
    const startIdx = (page.value - 1) * props.pageSize;
    // 给当前请求回来的数据添加位置信息
    computedDomData(list, startIdx);
    // 渲染当次请求回来的数据
    renderDomByDataList(startIdx);
  }
}, 150);

// 页面滚动时，更新渲染的数据列表
const updateDomPosition = (direction: number) => {
  const tempRenderMap: RenderMap = {};

  // 检查当前已经渲染的列表中的元素，不在渲染区域内的元素删除,渲染区域内的保留
  for (let i = startIndex.value; i <= endIndex.value; i++) {
    const { isOverTopLine, isUnderBottomLine } = getBoundaryInfo(
      domDataList.value[i]
    );

    if (isOverTopLine || isUnderBottomLine) {
      continue;
    }

    tempRenderMap[i] = domDataList.value[i];
  }

  // 下滑（页面顶部追加数据）
  if (direction < 0) {
    // 从现有渲染列表第一个元素的上一个元素依次取新元素，对符合条件的元素进行渲染
    for (let j = startIndex.value - 1; j >= 0; j--) {
      const { isOverTopLine } = getBoundaryInfo(domDataList.value[j]);

      // 遇到第一个在上线之上的元素，则停止渲染新数据
      if (isOverTopLine) break;

      tempRenderMap[j] = domDataList.value[j];
    }
  } else {
    // 上滑（页面底部追加数据）
    // 从现有列表最后一个元素的下一个元素依次取新元素，对符合条件的元素进行渲染
    for (let k = endIndex.value + 1; k < domDataList.value.length; k++) {
      const { isUnderBottomLine } = getBoundaryInfo(domDataList.value[k]);
      // 遇到第一个在下线之下的元素，则停止渲染新数据
      if (isUnderBottomLine) break;

      tempRenderMap[k] = domDataList.value[k];
    }
  }

  // 使用新的渲染列表替换旧的渲染列表
  renderMap.value = tempRenderMap;

  // 数字字符串类型的key值，会按从小到大的顺序排列
  const keys = Object.keys(renderMap.value);

  startIndex.value = +keys[0];
  endIndex.value = +keys[keys.length - 1];
};
</script>

<style scoped lang="scss">
.virtual-waterfall-component {
  box-sizing: border-box;
  overflow: hidden scroll;

  .content-box {
    position: relative;
    width: 100%;

    .waterfall-item {
      position: absolute;
      display: flex;
      flex-direction: column;
      transition: all 0.12s;
      overflow: hidden;
    }

    /* default item content styles */
    .img-box {
      position: relative;
      width: 100%;
      background-color: #eee;
      overflow: hidden;

      .idx {
        position: absolute;
        top: 20px;
        left: 20px;
      }

      .main-img {
        width: 100%;
        height: auto;
      }
    }

    .text-box {
      box-sizing: border-box;
      padding: 0 10px;
      margin: 10px 0;
      font-family: sans-serif;
      font-size: 16px;
      line-height: 24px;
      background-color: skyblue;
    }

    .ellipsis-line-2 {
      display: -webkit-box;
      text-overflow: ellipsis;
      overflow: hidden;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
  }

  .loading-text {
    height: 60px;
    padding-bottom: 60px;
    line-height: 60px;
    text-align: center;
  }
}
</style>
