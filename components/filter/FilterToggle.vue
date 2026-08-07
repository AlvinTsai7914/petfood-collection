<script setup lang="ts">
// 單一布林開關,sidebar 5 + 1 組的「+1」就用這個
// 之後 Phase 2 的「無穀」/「腎貓友善」等 toggle 也可重用

defineProps<{
  modelValue: boolean
  label: string
  count?: number
}>()
defineEmits<{ 'update:modelValue': [v: boolean] }>()
</script>

<template>
  <section class="py-4">
    <button
      type="button"
      class="flex w-full items-center justify-between border px-3 py-2 text-small font-medium transition-colors"
      :class="
        modelValue
          ? 'border-neutral-900 bg-neutral-900 text-white'
          : 'border-neutral-300 text-neutral-700 hover:border-neutral-500 hover:text-neutral-900'
      "
      :aria-pressed="modelValue"
      @click="$emit('update:modelValue', !modelValue)"
    >
      <span class="flex items-center gap-2.5">
        <!-- 視覺勾選方塊;沿用 FilterCheckbox 的方塊風格 -->
        <span
          class="flex h-4 w-4 flex-none items-center justify-center border transition-colors"
          :class="modelValue ? 'border-white' : 'border-neutral-400'"
        >
          <svg
            v-if="modelValue"
            class="h-2.5 w-2.5"
            viewBox="0 0 10 8"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M1 4L4 7L9 1"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="square"
            />
          </svg>
        </span>
        {{ label }}
      </span>
      <span
        v-if="count !== undefined"
        class="font-mono text-caption tabular-nums"
        :class="modelValue ? 'text-neutral-300' : 'text-neutral-400'"
      >
        {{ count }}
      </span>
    </button>
  </section>
</template>
