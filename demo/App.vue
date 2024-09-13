<template>
  <div class="app-base-layout">
    <VirtualWaterfall
      :loading-box-height="100"
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
  </div>
</template>

<script setup lang="ts">
import { pxToVW } from '../src/utils/common';
import VirtualWaterfall from '../src/components/VirtualWaterfall.vue';

// 直接使用打包后的文件
// import VirtualWaterfall from '../dist/index.js';

import { testData } from './test/data';

const pageSize = 20;

// 模拟从后台获取数据
const getList = (start: number) => {
  // 这里是模拟数据请求，需要改成真实的从后台接口获取数据
  return new Promise((resolve) => {
    const nextList = testData.slice(start, start + pageSize);

    // 模拟接口返回，第一页直接返回，后面页面延迟返回
    setTimeout(
      () => {
        resolve(nextList);
      },
      start === 0 ? 0 : 1000
    );
  });
};

</script>

<style lang="scss">
.app-base-layout {
  background-color: #eee;
  opacity: 0.1;

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

  .loading-text {
    height: 60px;
    padding-bottom: 40px;
    line-height: 60px;
    color: blue;
    text-align: center;
  }
}
</style>
