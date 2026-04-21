<script setup lang="ts">
defineProps<{
  label: string
  value: string
  count?: number
  modelValue: boolean
}>()
defineEmits<{ 'update:modelValue': [v: boolean] }>()
</script>

<template>
  <label
    class="group flex cursor-pointer select-none items-center gap-2.5 py-1 text-small text-neutral-700 hover:text-neutral-900"
  >
    <input
      type="checkbox"
      :checked="modelValue"
      :value="value"
      class="peer sr-only"
      @change="$emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
    />
    <span
      class="flex h-4 w-4 flex-none items-center justify-center border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-accent/40"
      :class="
        modelValue
          ? 'border-neutral-900 bg-neutral-900'
          : 'border-neutral-300 group-hover:border-neutral-500'
      "
    >
      <svg
        v-if="modelValue"
        class="h-2.5 w-2.5 text-white"
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
    <span class="flex-1" :class="{ 'text-neutral-900': modelValue }">{{ label }}</span>
    <span
      v-if="count !== undefined"
      class="font-mono text-caption tabular-nums text-neutral-400"
    >
      {{ count }}
    </span>
  </label>
</template>
