<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    ><q-card style="min-width: 320px"
      ><q-card-section class="text-h6">{{ title }}</q-card-section
      ><q-card-section>{{ message }}</q-card-section
      ><q-card-actions align="right"
        ><q-btn flat label="Batal" v-close-popup /><q-btn
          unelevated
          color="primary"
          label="Lanjutkan"
          @click="$emit('confirm')" /></q-card-actions></q-card
  ></q-dialog>
</template>
<script setup>
defineProps({
  modelValue: Boolean,
  title: { type: String, default: 'Konfirmasi' },
  message: { type: String, default: 'Lanjutkan tindakan ini?' }
})
defineEmits(['update:modelValue', 'confirm'])
</script>
