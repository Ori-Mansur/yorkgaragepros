<template>
  <div class="chart-container" style="height: 400px; width: 100%">
    <canvas ref="roiChartCanvas"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
// Chart.js must be installed globally or locally
import Chart from "chart.js/auto";

const roiChartCanvas = ref(null); // Ref to link to the <canvas> element

onMounted(() => {
  if (roiChartCanvas.value) {
    const ctx = roiChartCanvas.value.getContext("2d");

    // --- Your original Chart.js initialization code goes here ---
    new Chart(ctx, {
      type: "bar",
      data: {
        labels: [
          "Garage Door Replacement",
          "Manufactured Stone Veneer",
          "Wood Deck Addition",
          "Minor Kitchen Remodel",
          "Bath Remodel",
        ],
        datasets: [
          {
            label: "Cost Recouped at Resale (%)",
            data: [93.8, 91.4, 65.8, 72.2, 60.1],
            // ... rest of dataset properties
            backgroundColor: ["#E8A900", "#E5E7EB", "#E5E7EB", "#E5E7EB", "#E5E7EB"],
            borderRadius: 4,
          },
        ],
      },
      options: {
        // ... all your chart options remain the same ...
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            grid: { color: "#f3f4f6" },
            title: { display: true, text: "Return on Investment (%)" },
          },
          x: { grid: { display: false } },
        },
      },
    });
  }
});
</script>

<style scoped>
/* Optional: Component-specific styles can go here */
.chart-container {
  /* Ensure this matches your component sizing needs */
}
</style>
