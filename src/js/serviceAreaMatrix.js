export const serviceAreaMatrix = {
    'vaughan': {
        'installation': {
            cityName: 'Vaughan',
            serviceName: 'Installation',
            title: 'Vaughan Garage Door Repair, Installation & Service...',
            h1: 'Expert Garage Door Repair & Installation Services in Vaughan',
            bodyHtml: `
                <h2>Broken Spring or Malfunctioning Opener in Vaughan? ... </h2>
                `
        }
    },
    'markham': {
        'spring-repair': {
            cityName: 'Markham',
            serviceName: 'Spring Repair',
            // ... the rest of the unique Markham content
        }
    },
    // ... and 'richmond-hill'
};

export function getServiceData(city, service) {
    return serviceAreaMatrix[city] ? serviceAreaMatrix[city][service] : null;
}