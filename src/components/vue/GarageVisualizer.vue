<template>
  <div class="emulator-wrapper">
    <div 
      class="stage" 
      ref="stage"
      @pointermove="onPointerMove"
    >
      <img :src="houseImage" class="house-bg" draggable="false" />

      <div class="door-layer" :style="{ transform: matrixStyle }">
        <div class="door-texture" :style="{ backgroundColor: overlayColor }">
          <img :src="doorStyleImage" class="texture-img" draggable="false" />
        </div>
      </div>

      <div 
        v-for="(pos, i) in corners" 
        :key="i"
        class="handle"
        :class="{ active: activeHandle === i }"
        :style="{ left: pos.x + 'px', top: pos.y + 'px' }"
        @pointerdown="startDrag($event, i)"
        @pointerup="stopDrag"
      >
        <span class="handle-number">{{ i + 1 }}</span>
      </div>
    </div>

    <div class="controls">
      <div class="swatches">
        <button 
          v-for="color in colors" 
          :key="color" 
          :style="{ background: color }"
          @click="overlayColor = color"
          :class="{ selected: overlayColor === color }"
        ></button>
      </div>
      <button class="reset-btn" @click="resetCorners">Reset Door Position</button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';

// 1. ASSETS
const houseImage = ref('/src/assets/sample-house.jpg'); 
const doorStyleImage = ref('/src/assets/doorTypes/carriage-house-panels.webp');
const colors = ['#FFFFFF', '#4A3222', '#2C2C2C', '#1B2631', '#8D6E63'];

// 2. STATE
const overlayColor = ref('#FFFFFF');
const activeHandle = ref(null);
const stage = ref(null);
const corners = reactive([
  { x: 100, y: 100 }, { x: 400, y: 100 },
  { x: 400, y: 300 }, { x: 100, y: 300 }
]);

// 3. DRAG LOGIC
const startDrag = (event, index) => {
  activeHandle.value = index;
  // This locks the mouse/touch to this specific handle even if it moves fast
  event.target.setPointerCapture(event.pointerId);
};

const stopDrag = (event) => {
  activeHandle.value = null;
};

const onPointerMove = (e) => {
  if (activeHandle.value === null) return;
  
  const rect = stage.value.getBoundingClientRect();
  corners[activeHandle.value].x = e.clientX - rect.left;
  corners[activeHandle.value].y = e.clientY - rect.top;
};

const resetCorners = () => {
  corners[0] = { x: 100, y: 100 }; corners[1] = { x: 400, y: 100 };
  corners[2] = { x: 400, y: 300 }; corners[3] = { x: 100, y: 300 };
};

// 4. THE MATH (Matrix Solver)
const matrixStyle = computed(() => {
  const src = [0, 0, 1000, 0, 1000, 1000, 0, 1000];
  const dst = [
    corners[0].x, corners[0].y, corners[1].x, corners[1].y,
    corners[2].x, corners[2].y, corners[3].x, corners[3].y
  ];
  const h = solveHomography(src, dst);
  return `matrix3d(${h[0]}, ${h[3]}, 0, ${h[6]}, ${h[1]}, ${h[4]}, 0, ${h[7]}, 0, 0, 1, 0, ${h[2]}, ${h[5]}, 0, 1)`;
});

function solveHomography(src, dst) {
  const A = [];
  for (let i = 0; i < 4; i++) {
    const [x, y] = [src[i * 2], src[i * 2 + 1]];
    const [u, v] = [dst[i * 2], dst[i * 2 + 1]];
    A.push([x, y, 1, 0, 0, 0, -x * u, -y * u], [0, 0, 0, x, y, 1, -x * v, -y * v]);
  }
  const b = [dst[0], dst[1], dst[2], dst[3], dst[4], dst[5], dst[6], dst[7]];
  return gaussian(A, b);
}

function gaussian(A, b) {
  const n = A.length;
  for (let i = 0; i < n; i++) {
    let max = i;
    for (let j = i + 1; j < n; j++) if (Math.abs(A[j][i]) > Math.abs(A[max][i])) max = j;
    [A[i], A[max]] = [A[max], A[i]]; [b[i], b[max]] = [b[max], b[i]];
    for (let j = i + 1; j < n; j++) {
      const f = A[j][i] / A[i][i];
      b[j] -= f * b[i];
      for (let k = i; k < n; k++) A[j][k] -= f * A[i][k];
    }
  }
  const x = new Array(n);
  for (let i = n - 1; i >= 0; i--) {
    let s = 0;
    for (let j = i + 1; j < n; j++) s += A[i][j] * x[j];
    x[i] = (b[i] - s) / A[i][i];
  }
  return x;
}
</script>

<style scoped>
.emulator-wrapper { width: 100%; max-width: 900px; margin: auto; }

.stage {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #333;
  overflow: hidden;
  touch-action: none; /* Prevents mobile scrolling while dragging */
  user-select: none;
}

.house-bg {
  width: 100%; height: 100%;
  object-fit: cover;
  pointer-events: none; /* Allows clicks to "pass through" to handles */
}

.door-layer {
  position: absolute; top: 0; left: 0;
  width: 1000px; height: 1000px; /* Fixed ref for math */
  transform-origin: 0 0;
  pointer-events: none;
  z-index: 5;
}

.door-texture { width: 100%; height: 100%; mix-blend-mode: multiply; }
.texture-img { width: 100%; height: 100%; opacity: 0.9; }

.handle {
  position: absolute;
  width: 40px; height: 40px;
  background: #FFD700;
  border: 3px solid #FFF;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  cursor: grab;
  z-index: 100;
  display: flex; align-items: center; justify-content: center;
  touch-action: none;
}

.handle.active { background: #FFF; scale: 1.2; cursor: grabbing; }
.handle-number { font-weight: bold; font-size: 12px; pointer-events: none; }

.controls { padding: 20px; background: #eee; display: flex; gap: 20px; align-items: center; }
.swatches { display: flex; gap: 10px; }
.swatches button { width: 30px; height: 30px; border-radius: 50%; border: 2px solid #ccc; cursor: pointer; }
.swatches button.selected { border-color: #000; transform: scale(1.2); }
.reset-btn { padding: 10px; cursor: pointer; }
</style>