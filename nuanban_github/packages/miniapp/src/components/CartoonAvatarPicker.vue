<template>
  <view class="cartoon-picker">
    <view class="current" @tap="toggleOpen">
      <image :src="currentUrl" class="current-img" mode="aspectFill" />
      <view v-if="editable" class="edit-badge">
        <text class="edit-icon">🎨</text>
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
        <text class="option-label">{{ item.label }}</text>
      </view>
    </view>
    <text v-if="editable" class="hint">卡通头像 · 点击选择风格（非真实照片）</text>
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
    size?: 'md' | 'lg';
  }>(),
  { editable: true, size: 'lg' },
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
  align-items: flex-start;
}
.current {
  position: relative;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  border: 4rpx solid var(--nb-border, #f0e0d4);
  background: var(--nb-primary-soft, #fff5ef);
}
.current.lg,
.cartoon-picker .current {
  width: 120rpx;
  height: 120rpx;
}
.current-img {
  width: 100%;
  height: 100%;
}
.edit-badge {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
}
.edit-icon {
  font-size: 22rpx;
  line-height: 1;
}
.grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-top: 20rpx;
  padding: 20rpx;
  background: var(--nb-surface, #fff);
  border-radius: var(--nb-radius-sm, 12rpx);
  width: 100%;
  box-sizing: border-box;
}
.option {
  width: calc(33.33% - 12rpx);
  text-align: center;
}
.option.active .option-img {
  border-color: var(--nb-primary, #c45c26);
  box-shadow: 0 0 0 4rpx rgba(196, 92, 38, 0.2);
}
.option-img {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 50%;
  border: 4rpx solid transparent;
  background: #f5f5f5;
}
.option-label {
  display: block;
  margin-top: 6rpx;
  font-size: 20rpx;
  color: var(--nb-text-muted, #888);
}
.hint {
  margin-top: 12rpx;
  font-size: 22rpx;
  color: var(--nb-text-muted, #999);
}
</style>
