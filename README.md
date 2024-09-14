# f-virtual-waterfall-vue-rollup

## Installation
```
npm install f-virtual-waterfall-vue-rollup --save
```
or
```
yarn add f-virtual-waterfall-vue-rollup
```

##Usage
```
import VirtualWaterfall from 'f-virtual-waterfall-vue-rollup';
import 'f-virtual-waterfall-vue-rollup/dist/main.css';

// 从后台获取数据
const getList = () => {
  // 这里是模拟数据请求，需要改成真实的从后台接口获取数据
  return new Promise((resolve) => {
    // 从后台接口获取的数据
    const demoData = [];
    resolve(demoData);
  });
};

<VirtualWaterfall
   :get-list="getList"
>
   <template #itemContent="{item}">
      <div
        class="img-box"
        :style="{height: pxToVW(item.imgBoxHeight)}"
      >
        <span class="idx">{{ item.index }}</span>
      </div>
      <div class="text-box ellipsis-line-2">{{ item.text }}</div>
   </template>
   <template #loadingContent>
      <div class="loading-text">加载中~</div>
   </template>
</VirtualWaterfall>
```
