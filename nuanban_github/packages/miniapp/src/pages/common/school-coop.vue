<template>
  <view class="page nb-page">
    <text class="title">学校合作配置</text>
    <text class="sub">维护机构与学校的合作关系 · 学生端「发现」页按此筛选</text>

    <view class="form-card nb-card">
      <text class="form-title">新增合作</text>
      <text class="label">机构</text>
      <picker
        :range="orgNames"
        :value="orgIdx"
        :disabled="!orgs.length"
        @change="onOrgPick"
      >
        <view class="picker nb-input">{{ orgNames[orgIdx] || '请先添加机构与老人档案' }}</view>
      </picker>
      <text class="label">合作学校</text>
      <SchoolSearchField v-model="schoolName" />
      <button class="btn-add" :loading="adding" :disabled="!orgs.length" @tap="addCoop">
        添加合作
      </button>
    </view>

    <view v-if="loading" class="state">加载中…</view>
    <view v-else-if="!groups.length" class="empty">
      暂无合作配置。添加后，学生开启「学校合作」时仅看到对应机构老人。
    </view>

    <view v-for="g in groups" :key="g.orgId" class="group-card nb-card">
      <text class="org-name">{{ g.orgName || '未命名机构' }}</text>
      <view v-if="!g.items.length" class="no-school">暂无合作学校</view>
      <view v-for="item in g.items" :key="item.id" class="school-row">
        <text class="school">{{ item.schoolName }}</text>
        <text class="remove" @tap="removeCoop(item.id)">移除</text>
      </view>
    </view>

    <view class="hint">
      说明：某机构若未配置任何合作学校，则学生端对该机构不做限制；配置后仅合作学校的学生可见该机构老人。
    </view>

    <OpsTabBar current="/pages/common/school-coop" />
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import OpsTabBar from '../../components/OpsTabBar.vue';
import SchoolSearchField from '../../components/SchoolSearchField.vue';
import {
  addSchoolCooperation,
  disableSchoolCooperation,
  fetchOpsOrganizations,
  fetchSchoolCooperationGroups,
  type SchoolCoopGroup,
} from '../../api/platform';
import { requireOpsSession } from '../../utils/ops-mode';
import { clearOrgSchoolPartnersCache } from '../../utils/school-coop';
import { pbErrorMessage } from '../../utils/request';

const groups = ref<SchoolCoopGroup[]>([]);
const orgs = ref<{ id: string; name: string }[]>([]);
const orgIdx = ref(0);
const schoolName = ref('');
const loading = ref(false);
const adding = ref(false);

const orgNames = computed(() => orgs.value.map((o) => o.name || '未命名机构'));

async function reload() {
  loading.value = true;
  try {
    const [g, o] = await Promise.all([fetchSchoolCooperationGroups(), fetchOpsOrganizations()]);
    groups.value = g;
    orgs.value = o;
    if (orgIdx.value >= orgs.value.length) orgIdx.value = 0;
  } catch (e) {
    groups.value = [];
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  } finally {
    loading.value = false;
  }
}

onShow(() => {
  if (!requireOpsSession()) return;
  void reload();
});

function onOrgPick(e: { detail: { value: string } }) {
  orgIdx.value = Number(e.detail.value);
}

async function addCoop() {
  const org = orgs.value[orgIdx.value];
  if (!org) {
    uni.showToast({ title: '请先配置机构', icon: 'none' });
    return;
  }
  if (!schoolName.value.trim()) {
    uni.showToast({ title: '请选择学校', icon: 'none' });
    return;
  }
  adding.value = true;
  try {
    await addSchoolCooperation(org.id, schoolName.value.trim());
    clearOrgSchoolPartnersCache();
    schoolName.value = '';
    uni.showToast({ title: '已添加', icon: 'success' });
    await reload();
  } catch (e) {
    uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
  } finally {
    adding.value = false;
  }
}

function removeCoop(id: string) {
  uni.showModal({
    title: '移除合作',
    content: '确定移除该学校合作？',
    success: async (res) => {
      if (!res.confirm) return;
      try {
        await disableSchoolCooperation(id);
        clearOrgSchoolPartnersCache();
        uni.showToast({ title: '已移除', icon: 'success' });
        await reload();
      } catch (e) {
        uni.showToast({ title: pbErrorMessage(e), icon: 'none' });
      }
    },
  });
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 24rpx 24rpx calc(140rpx + env(safe-area-inset-bottom));
}
.title {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
}
.sub {
  display: block;
  margin: 8rpx 0 24rpx;
  font-size: 24rpx;
  color: #888;
}
.form-card {
  padding: 24rpx;
  margin-bottom: 24rpx;
}
.form-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  margin-bottom: 16rpx;
}
.label {
  display: block;
  margin: 16rpx 0 8rpx;
  font-size: 24rpx;
  color: #666;
}
.picker {
  padding: 20rpx 24rpx;
}
.btn-add {
  margin-top: 24rpx;
  background: var(--nb-primary, #c45c26);
  color: #fff;
  border-radius: 12rpx;
}
.group-card {
  padding: 24rpx;
  margin-bottom: 16rpx;
}
.org-name {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  margin-bottom: 12rpx;
}
.school-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}
.school-row:last-child {
  border-bottom: none;
}
.school {
  font-size: 26rpx;
  color: #333;
}
.remove {
  font-size: 24rpx;
  color: #c45c26;
}
.no-school {
  font-size: 24rpx;
  color: #999;
}
.state,
.empty {
  text-align: center;
  color: #999;
  padding: 48rpx 24rpx;
  font-size: 26rpx;
  line-height: 1.5;
}
.hint {
  margin-top: 16rpx;
  padding: 20rpx;
  font-size: 24rpx;
  color: #888;
  background: #fff;
  border-radius: 12rpx;
  line-height: 1.5;
}
</style>
