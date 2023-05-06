<script setup lang="ts">
const emits = defineEmits(['update:infoShow'])
const close = () => {
  emits('update:infoShow', false)
}
const visible = ref<boolean>(true)
</script>

<template>
  <a-drawer width="640" placement="right" :closable="false" :visible="visible" @close="close">
    <template #title> xxxxxxxxx公司详情 </template>
    <a-descriptions title="信息1">
      <a-descriptions-item label="UserName">Zhou Maomao</a-descriptions-item>
      <a-descriptions-item label="Telephone">1810000000</a-descriptions-item>
      <a-descriptions-item label="Live">Hangzhou, Zhejiang</a-descriptions-item>
      <a-descriptions-item label="Remark">empty</a-descriptions-item>
      <a-descriptions-item label="Address">
        No. 18, Wantang Road, Xihu District, Hangzhou, Zhejiang, China
      </a-descriptions-item>
    </a-descriptions>
    <a-descriptions title="信息2" layout="vertical">
      <a-descriptions-item label="UserName">Zhou Maomao</a-descriptions-item>
      <a-descriptions-item label="Telephone">1810000000</a-descriptions-item>
      <a-descriptions-item label="Live">Hangzhou, Zhejiang</a-descriptions-item>
      <a-descriptions-item label="Address" :span="2">
        No. 18, Wantang Road, Xihu District, Hangzhou, Zhejiang, China
      </a-descriptions-item>
      <a-descriptions-item label="Remark">empty</a-descriptions-item>
    </a-descriptions>
  </a-drawer>
</template>
