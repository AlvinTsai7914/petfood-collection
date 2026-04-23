<template>
  <div class="h-full overflow-y-auto">
    <div class="flex min-h-full flex-col bg-white">
      <LayoutAppHeader />
      <main class="flex-1">
        <slot />
      </main>
      <LayoutAppFooter />
    </div>
  </div>
</template>
