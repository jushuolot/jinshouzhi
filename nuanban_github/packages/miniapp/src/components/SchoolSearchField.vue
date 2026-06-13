<template>
  <view class="school-field">
    <text v-if="disabled" class="readonly">{{ modelValue || '未填' }}</text>
    <template v-else>
      <view class="input-row">
        <input
          v-model="query"
          class="input nb-input"
          type="text"
          placeholder="输入校名搜索，或点「浏览」从列表选"
          confirm-type="search"
          @focus="onFocus"
          @blur="onBlur"
          @input="onQueryInput"
        />
        <picker :range="catalog" :value="pickerIdx" @change="onPickerChange">
          <view class="browse-btn">浏览</view>
        </picker>
      </view>

      <view
        v-if="open && suggestions.length"
        class="dropdown"
        @mousedown.prevent.stop
      >
        <view
          v-for="name in suggestions"
          :key="name"
          class="option"
          :class="{ active: name === modelValue }"
          @mousedown.prevent.stop="select(name)"
          @click.stop="select(name)"
          @tap.stop="select(name)"
        >
          <text>{{ name }}</text>
        </view>
      </view>

      <view v-else-if="open && !loading && touched && query.trim()" class="empty-hint">
        <text>未找到匹配学校，请换关键词或点「浏览」</text>
      </view>

      <text v-if="modelValue && valid" class="picked">已选：{{ modelValue }}</text>
      <text v-else-if="touched && !valid" class="err">请从列表中点选学校</text>
    </template>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { fetchSchoolCatalog } from '../api/schools';
import {
  getSchoolCatalog,
  isKnownSchool,
  searchKnownSchools,
  setSchoolCatalog,
} from '../utils/known-schools';

const props = withDefaults(
  defineProps<{ modelValue: string; disabled?: boolean }>(),
  { disabled: false },
);
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();

const query = ref('');
const open = ref(false);
const touched = ref(false);
const loading = ref(false);
const pickerIdx = ref(0);
let selecting = false;
let blurTimer: ReturnType<typeof setTimeout> | null = null;

const catalog = computed(() => getSchoolCatalog());
const valid = computed(() => isKnownSchool(props.modelValue));
const suggestions = computed(() => searchKnownSchools(query.value, 12));

watch(
  () => props.modelValue,
  (v) => {
    if (v && v !== query.value) query.value = v;
  },
  { immediate: true },
);

onMounted(async () => {
  loading.value = true;
  try {
    const list = await fetchSchoolCatalog();
    if (list.length) setSchoolCatalog(list);
  } catch {
    /* 使用内置 KNOWN_SCHOOLS */
  } finally {
    loading.value = false;
  }
});

function onQueryInput() {
  open.value = true;
  touched.value = true;
  if (props.modelValue && query.value !== props.modelValue) {
    emit('update:modelValue', '');
  }
}

function onFocus() {
  if (blurTimer) {
    clearTimeout(blurTimer);
    blurTimer = null;
  }
  open.value = true;
  touched.value = true;
}

function onBlur() {
  if (selecting) return;
  blurTimer = setTimeout(() => {
    open.value = false;
    const trimmed = query.value.trim();
    if (trimmed && !isKnownSchool(trimmed)) {
      const exact = suggestions.value.find((s) => s === trimmed);
      if (exact) {
        emit('update:modelValue', exact);
        query.value = exact;
      } else if (props.modelValue) {
        query.value = props.modelValue;
      }
    }
    touched.value = true;
  }, 400);
}

function select(name: string) {
  selecting = true;
  if (blurTimer) {
    clearTimeout(blurTimer);
    blurTimer = null;
  }
  query.value = name;
  emit('update:modelValue', name);
  open.value = false;
  touched.value = true;
  setTimeout(() => {
    selecting = false;
  }, 420);
}

function onPickerChange(e: { detail: { value: string } }) {
  const idx = Number(e.detail.value);
  pickerIdx.value = idx;
  const name = catalog.value[idx];
  if (name) select(name);
}
</script>

<style scoped>
.school-field {
  position: relative;
  z-index: 50;
  margin-bottom: 8rpx;
}
.input-row {
  display: flex;
  align-items: stretch;
  gap: 12rpx;
  position: relative;
  z-index: 51;
}
.input {
  flex: 1;
  min-width: 0;
  height: 88rpx;
  background: var(--nb-surface, #fff);
  padding: 0 24rpx;
  border-radius: var(--nb-radius-sm, 12rpx);
  font-size: 28rpx;
  box-sizing: border-box;
  border: 2rpx solid var(--nb-border, #eee);
}
.browse-btn {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 100rpx;
  padding: 0 24rpx;
  font-size: 26rpx;
  color: var(--nb-primary, #c45c26);
  background: var(--nb-primary-soft, #fff5ef);
  border-radius: var(--nb-radius-sm, 12rpx);
  border: 1rpx solid rgba(196, 92, 38, 0.25);
  cursor: pointer;
}
.dropdown {
  position: absolute;
  left: 0;
  right: 0;
  top: 100%;
  margin-top: 8rpx;
  background: #fff;
  border-radius: 12rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.15);
  border: 1rpx solid #eee;
  max-height: 360rpx;
  overflow-y: auto;
  z-index: 100;
  -webkit-overflow-scrolling: touch;
}
.option {
  padding: 22rpx 24rpx;
  font-size: 28rpx;
  border-bottom: 1rpx solid #f5f5f5;
  cursor: pointer;
}
.option.active {
  color: var(--nb-primary, #c45c26);
  background: var(--nb-primary-soft, #fff5ef);
}
.empty-hint {
  margin-top: 8rpx;
  padding: 16rpx 20rpx;
  font-size: 24rpx;
  color: #999;
  background: #fafafa;
  border-radius: 12rpx;
}
.picked {
  display: block;
  margin-top: 10rpx;
  font-size: 22rpx;
  color: #2a9d8f;
}
.err {
  display: block;
  margin-top: 10rpx;
  font-size: 22rpx;
  color: #c45c26;
}
.readonly {
  display: block;
  background: var(--nb-surface, #fff);
  padding: 24rpx;
  border-radius: var(--nb-radius-sm, 12rpx);
  font-size: 28rpx;
  color: var(--nb-text, #333);
}
</style>
