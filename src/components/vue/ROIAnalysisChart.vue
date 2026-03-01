<template>
  <div>
    <div class="chart-container" style="height: 400px; width: 100%">
      <canvas ref="roiChartCanvas"></canvas>
    </div>
    <p class="source-note">
      Source:
      <a
        href="https://zondahome.com/2025-cost-vs-value-report/"
        target="_blank"
        rel="noopener noreferrer"
      >
        Zonda 2025 Cost vs. Value Report
      </a>
      — Garage door replacement ranked #1 out of 28 home improvement projects for the second consecutive year.
    </p>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import Chart from "chart.js/auto";

const roiChartCanvas = ref(null);

onMounted(() => {
  if (roiChartCanvas.value) {
    const ctx = roiChartCanvas.value.getContext("2d");

    new Chart(ctx, {
      type: "bar",
      data: {
        labels: [
          "Garage Door Replacement",
          "Steel Entry Door",
          "Manufactured Stone Veneer",
          "Minor Kitchen Remodel",
          "Midrange Bath Remodel",
        ],
        datasets: [
          {
            label: "Return on Investment at Resale (%)",
            // 2025 Cost vs. Value Report — Zonda / Remodeling Magazine
            data: [268, 216, 208, 113, 80],
            backgroundColor: [
              "#E8A900", // Gold — your brand highlight for garage door
              "#E5E7EB",
              "#E5E7EB",
              "#E5E7EB",
              "#E5E7EB",
            ],
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => ` ${context.parsed.y}% ROI`,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 300,
            grid: { color: "#f3f4f6" },
            ticks: {
              callback: (value) => `${value}%`,
            },
            title: {
              display: true,
              text: "Return on Investment at Resale (%)",
            },
          },
          x: {
            grid: { display: false },
          },
        },
      },
    });
  }
});
</script>

<style scoped>
.source-note {
  margin-top: 0.75rem;
  font-size: 0.75rem;
  color: #6b7280;
  text-align: center;
}

.source-note a {
  color: #6b7280;
  text-decoration: underline;
}

.source-note a:hover {
  color: #111827;
}
</style>