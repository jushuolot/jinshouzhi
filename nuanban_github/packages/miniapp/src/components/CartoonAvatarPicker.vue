<template>
  <view class="cartoon-picker" :class="{ compact }">
    <view class="current" @tap="toggleOpen">
      <image :src="currentUrl" class="current-img" mode="aspectFill" />
      <view v-if="editable" class="edit-badge">
        <text class="edit-icon">选</text>
      </view>
    </view>
    <view v-if="editable && open" class="grid">
      <view
        v-for="item in CARTOON_AVATARS"
        :key="item.id"
        class="option"
        :class="{ active: item.id === selectedId }"
        @tap="pick(item.id)"
      >
        <image :src="item.url" class="option-img" mode="aspectFill" />
      </view>
    </view>
    <text v-if="editable && !open" class="tap-hint">点击选择</text>
  </view>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { CARTOON_AVATARS, defaultCartoonAvatarId, resolveCartoonAvatarUrl } from '../utils/cartoon-avatars';

const props = withDefaults(
  defineProps<{
    avatarId?: string;
    name?: string;
    editable?: boolean;
    compact?: boolean;
  }>(),
  { editable: true, compact: false },
);

const emit = defineEmits<{ change: [avatarId: string] }>();

const open = ref(false);
const selectedId = ref('');

const currentUrl = computed(() => resolveCartoonAvatarUrl(selectedId.value));

watch(
  () => [props.avatarId, props.name] as const,
  ([id, name]) => {
    selectedId.value = id || defaultCartoonAvatarId(name || '');
  },
  { immediate: true },
);

function toggleOpen() {
  if (!props.editable) return;
  open.value = !open.value;
}

function pick(id: string) {
  selectedId.value = id;
  open.value = false;
  emit('change', id);
}
</script>

<style scoped>
.cartoon-picker {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.cartoon-picker.compact {
  align-items: flex-start;
}
.current {
  position: relative;
  border-radius: 20rpx;
  overflow: hidden;
  flex-shrink: 0;
  background: #f5f5f5;
}
.current-img {
  width: 140rpx;
  height: 140rpx;
  display: block;
}
.compact .current-img {
  width: 120rpx;
  height: 120rpx;
}
.edit-badge {
  position: absolute;
  right: 0;
  bottom: 0;
  padding: 4rpx 10rpx;
  border-radius: 8rpx 0 0 0;
  background: rgba(0, 0, 0, 0.55);
}
.edit-icon {
  font-size: 20rpx;
  color: #fff;
  line-height: 1;
}
.grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 16rpx;
  padding: 16rpx;
  background: var(--nb-surface, #fff);
  border-radius: 12rpx;
  width: 100%;
  box-sizing: border-box;
}
.option {
  width: calc(25% - 10rpx);
}
.option.active .option-img {
  box-shadow: 0 0 0 4rpx var(--nb-primary, #c45c26);
}
.option-img {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 16rpx;
  background: #f5f5f5;
}
.tap-hint {
  margin-top: 8rpx;
  font-size: 22rpx;
  color: var(--nb-text-muted, #aaa);
}
</style>
