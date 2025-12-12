import React, { useEffect, useRef } from 'react';
// Chart.js must be installed: npm install chart.js
import Chart from 'chart.js/auto'; 

export default function ROIAnalysisChart() {
    // Use a ref to target the canvas element after it's rendered
    const chartRef = useRef(null);

    useEffect(() => {
        // Ensure we clean up the previous chart instance if the component unmounts
        let chartInstance = null;
        
        if (chartRef.current) {
            const ctx = chartRef.current.getContext("2d");

            chartInstance = new Chart(ctx, {
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
                            backgroundColor: [
                                "#E8A900", // Accent color for Garage Doors
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
                                label: function (context) {
                                    return context.raw + "% ROI";
                                },
                            },
                        },
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            grid: { color: "#f3f4f6" },
                            title: { display: true, text: "Return on Investment (%)" },
                        },
                        x: {
                            grid: { display: false },
                        },
                    },
                },
            });
        }
        
        // Cleanup function for React
        return () => {
            if (chartInstance) {
                chartInstance.destroy();
            }
        };
    }, []); // Empty dependency array ensures it runs once on mount

    return (
        <div className="chart-container" style={{ height: '400px', width: '100%' }}>
            {/* The ref links the canvas element to the chartRef variable in useEffect */}
            <canvas ref={chartRef}></canvas>
        </div>
    );
}