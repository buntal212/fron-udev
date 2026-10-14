<template>
  <q-input
    :model-value="modelValue"
    outlined
    dense
    label="Rentang tanggal"
    placeholder="Pilih rentang"
    readonly
    ><template #append><q-icon name="date_range" /></template
  ></q-input>
</template>
<script setup>
defineProps({ modelValue: { type: String, default: '' } })
</script>
