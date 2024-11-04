<template>
  <view class="container">
    <view class="time">{{ time }}</view>
    <!-- <uni-icons class="statistic" type="info" size="28" @click="showStatistic"></uni-icons> -->
    <view class="menu">
      <button class="uni-error-bg color-bg-btn" @click="clearData">
        清空
      </button>
      <view class="time-info">
        {{ tipText }}{{ timeLength }}
      </view>
      <button class="uni-primary-bg color-bg-btn" @click="exportData">导出</button>
    </view>
    <button class="event-btn uni-success-bgs" @click="pointRecord">点事件</button>
    <button :class="{
      'event-btn': true,
      'color-bg-btn': true,
      'uni-success-bg': segmentEventText === '段事件开始',
      'uni-warning-bg': segmentEventText === '段事件结束',
    }" @click="segmentRecord">{{ segmentEventText }}</button>
    <view class="event-item">
      <uni-combox placeholder="默认位置" v-model="defaultEvent.position" :candidates="posOptions"></uni-combox>
      <uni-combox placeholder="默认事件" v-model="defaultEvent.event" :candidates="eventOptions"></uni-combox>
      <uni-combox placeholder="默认备注" v-model="defaultEvent.remark" :candidates="remarkOptions"></uni-combox>
    </view>
    <scroll-view class="scroll-board event-list" scroll-y enable-flex scroll-with-animation :scroll-top="scrollTop">
      <view class="scorll-content" hover-class="press-item" v-for="event, index in recordEvents" :key="event.start.toISOString()">
        <view v-if="index > 0" class="h-line">
        </view>
        <view class="item-header" @longpress="delEvent(event)">
          <view class="item-index">{{ index + 1 }}.</view>
          <view v-if="event.type === 'segment'" class="time-label">
            {{ getTimeString(event.start) }} - {{ getTimeString(event.end) }}
          </view>
          <view v-else class="time-label">
            {{ getTimeString(event.start) }}
          </view>
        </view>
        <view class="event-item">
          <uni-combox placeholder="位置" v-model="event.position" :candidates="posOptions"></uni-combox>
          <uni-combox placeholder="事件" v-model="event.event" :candidates="eventOptions"></uni-combox>
          <uni-combox placeholder="备注" v-model="event.remark" :candidates="remarkOptions"></uni-combox>
        </view>
      </view>
      <view v-if="segmentStart" class="scorll-content">
        <view class="h-line" v-if="recordEvents.length > 0"></view>
        <view class="item-header">
          <view class="item-index">{{ recordEvents.length + 1 }}.</view>
          <view class="time-label">
            {{ getTimeString(segmentStart) }} - ???
          </view>
        </view>
      </view>
      <view style="min-height: 60%; width: 100%;"></view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue';
import { saveText } from '@/utils/utils';

class Event {
  constructor(type, start, position, event, remark) {
    this.type = type;
    this.start = new Date(start);
    this.position = position;
    this.event = event;
    this.remark = remark;
  }
}

class PointEvent extends Event {
  constructor(...args) {
    super('point', ...args);
  }
  toJSON() {
    return [this.type, this.start, this.position, this.event, this.remark];
  }
}

class SegmentEvent extends Event {
  constructor(start, end, ...args) {
    super('segment', start, ...args);
    this.end = new Date(end);
  }
  toJSON() {
    return [this.type, this.start, this.end, this.position, this.event, this.remark];
  }
}

const scrollTop = ref(0);

const recordEventsInit = JSON.parse(uni.getStorageSync('recordEvents') || "[]");
const segmentStartInit = JSON.parse(uni.getStorageSync('segmentStart') || "null");

const defaultEvent = ref(new Event('example', new Date()));

const time = ref('');
const tipText = computed(() => {
  if (segmentStart.value) {
    return '事件时长：';
  } else if (recordEvents.value.length === 0) {
    return '';
  } else {
    return '事件间隔：';
  }
});
const timeLength = ref('');

const recordEvents = ref(recordEventsInit.map((event) => {
  // 如果不是数组，说明是旧版本的数据，转换为新版本的数据
  if (!Array.isArray(event)) {
    if (!event.start) {
      event.start = event.time;
    }
    if (event.type === 'segment') {
      return new SegmentEvent(event.start, event.end, event.position, event.event, event.remark);
    } else {
      return new PointEvent(event.start, event.position, event.event, event.remark);
    }
  }
  const [eventType, ...args] = event;
  if (eventType === 'segment') {
    return new SegmentEvent(...args);
  } else {
    return new PointEvent(...args);
  }
}));
// 监听recordEvents变化，保存到本地
watch(recordEvents, (newVal) => {
  uni.setStorage({
    key: 'recordEvents',
    data: JSON.stringify(newVal.map(event => event.toJSON())),
  });
}, { deep: true });

const segmentStart = ref(segmentStartInit ? new Date(segmentStartInit) : null);
const segmentEventText = computed(() => segmentStart.value ? '段事件结束' : '段事件开始');
watch(segmentStart, (newVal) => {
  uni.setStorage({
    key: 'segmentStart',
    data: JSON.stringify(newVal),
  });
});

// const showStatistic = () => {
//   let msg = `共${recordEvents.value.length}条记录\n`
//   let posCount = {};
//   let eventCount = {};
//   let remarkCount = {};
//   recordEvents.value.forEach((event) => {
//     if (event.position) {
//       posCount[event.position] = (posCount[event.position] || 0) + 1;
//     } else {
//       posCount['null'] = (posCount['null'] || 0) + 1;
//     }
//     if (event.event) {
//       eventCount[event.event] = (eventCount[event.event] || 0) + 1;
//     } else {
//       eventCount['null'] = (eventCount['null'] || 0) + 1;
//     }
//     if (event.remark) {
//       remarkCount[event.remark] = (remarkCount[event.remark] || 0) + 1;
//     } else {
//       remarkCount['null'] = (remarkCount['null'] || 0) + 1;
//     }
//   });
//   msg += `位置统计： ${JSON.stringify(posCount)}\n`;
//   msg += `事件统计： ${JSON.stringify(eventCount)}\n`;
//   msg += `备注统计： ${JSON.stringify(remarkCount)}\n`;
//   uni.showModal({
//     title: '统计',
//     content: msg,
//     showCancel: false,
//   });
// };

const getOptions = key => {
  const result = new Set();
  recordEvents.value.forEach((event) => {
    if (event[key]) {
      result.add(event[key]);
    }
  });
  return Array.from(result);
}

const posOptions = computed(() => getOptions('position'));
const eventOptions = computed(() => getOptions('event'));
const remarkOptions = computed(() => getOptions('remark'));

const delEvent = async event => {
  const res = await uni.showModal({
    title: '删除事件',
    content: `确定删除事件${event.type === "segment" ? getTimeString(event.start) + "-" + getTimeString(event.end) : getTimeString(event.start)
      }(${event.event || 'null'})吗？`,
    showCancel: true,
    cancelText: '取消',
    confirmText: '确定',
  });
  if (res.confirm) {
    recordEvents.value = recordEvents.value.filter((e) => e !== event);
  }
};

const getTimeString = (date) => {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const milliseconds = String(date.getMilliseconds()).padStart(3, '0').slice(0, -2);
  return `${hours}:${minutes}:${seconds}.${milliseconds}`;
};

const getTimeLengthString = (start, end) => {
  const length = end - start;
  const minutes = String(Math.floor(length / 60000)).padStart(2, '0');
  const seconds = String(Math.floor((length % 60000) / 1000)).padStart(2, '0');
  const milliseconds = String(length % 1000).padStart(3, '0').slice(0, -2);
  return `${minutes}:${String(seconds).padStart(2, '0')}.${milliseconds}`;
};

let intervalId;

const updateTime = () => {
  time.value = getTimeString(new Date());
  if (segmentStart.value) {
    timeLength.value = getTimeLengthString(segmentStart.value, new Date());
  } else if (recordEvents.value.length > 0) {
    const latestEvent = recordEvents.value[recordEvents.value.length - 1];
    if (latestEvent.type === 'segment') {
      timeLength.value = getTimeLengthString(latestEvent.end, new Date());
    } else {
      timeLength.value = getTimeLengthString(latestEvent.start, new Date());
    }
  } else {
    timeLength.value = '';
  }
  intervalId = setTimeout(updateTime, 100);
};

onMounted(() => {
  updateTime();
});

onUnmounted(() => {
  clearInterval(intervalId);
});

const scrollToEnd = async () => {
  await nextTick();
  const eventList = uni.createSelectorQuery().select('.scroll-board');
  eventList.fields({
    scrollOffset: true,
  }, (data) => {
    scrollTop.value = data.scrollHeight;
  }).exec();
};

const segmentRecord = () => {
  if (!segmentStart.value) {
    segmentStart.value = new Date();
  } else {
    recordEvents.value.push(new SegmentEvent(segmentStart.value, new Date(), defaultEvent.value.position, defaultEvent.value.event, defaultEvent.value.remark));
    segmentStart.value = null;
  }
  scrollToEnd();
};

const pointRecord = () => {
  recordEvents.value.push(new PointEvent(new Date(), defaultEvent.value.position, defaultEvent.value.event, defaultEvent.value.remark));
  scrollToEnd();
};

const exportData = () => {
  const date = new Date();
  saveText(`${date.toISOString()}.json`, JSON.stringify(recordEvents.value.map(event => event.toJSON())));
  console.log("导出成功", recordEvents.value);
}

const clearData = async () => {
  const res = await uni.showModal({
    title: '清空事件',
    content: '确定清空所有事件吗？',
    showCancel: true,
    cancelText: '取消',
    confirmText: '确定',
  });
  if (res.confirm) {
    recordEvents.value = [];
    segmentStart.value = null;
  }
};

</script>

<style lang="scss" scoped>
.press-item {
  background-color: #f5f5f5;
}

.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
}

.h-line {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background-color: #e5e5e5;
}

.statistic {
  position: absolute;
  top: 0.2rem;
  right: 0.5rem;
}

.time {
  font-size: 2rem;
  font-weight: bold;
}

.event-btn {
  display: block;
  width: 10rem;
  margin-bottom: 0.5rem;
  font-size: 1rem;
  cursor: pointer;
}

.scroll-board {
  align-self: center;
  background-color: #fff;
  margin-top: 0.5rem;
  padding: 0.2rem;
  box-shadow: inset 0 0 2px #000000a1;
  display: flex;
  flex-grow: 1;
  height: 50vh;
}

.scorll-content {
  padding: 0.3rem 0 0.5rem;
  position: relative;
  width: 95vw;
}

.event-list {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.event-item {
  max-width: 95vw;
  font-size: 1rem;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  align-items: center;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1rem;
}

.time-label {
  font-size: 1rem;
  color: #666;
}

.menu {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 85vw;
  margin-bottom: 0.5rem;

  button {
    font-size: 0.8rem;
    margin: 0;
  }

  .time-info {
    font-size: 1rem;
  }
}

.color-bg-btn {
  color: $uni-white;

  &::after {
    border: none;
  }

  &.button-hover {
    color: $uni-white;
  }
}
</style>
