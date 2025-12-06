const maxFiles = 5;
const maxFileSize = 5 * 1024 * 1024; // 5MB
let selectedFilesArray = [];

// Show message
function showMessage(title, content) {
    const box = document.getElementById('messageBox');
    document.getElementById('messageTitle').textContent = title;
    document.getElementById('messageContent').innerHTML = content;
    box.style.display = 'flex';
}

// Update Garage Size requirement
function updateGarageSizeRequirement() {
    const service = document.getElementById('service').value;
    const garageSize = document.getElementById('garageSize');
    const label = document.getElementById('garageSizeLabel');

    const required = service === 'NewDoorInstall' || service === 'FloorCoating';
    garageSize.required = required;
    if (required) label.innerHTML = 'Garage Size <span class="required">*</span>';
    else label.textContent = 'Garage Size (Optional for Repair)';
}

// Remove image
window.removeImage = function (index) {
    selectedFilesArray.splice(index, 1);
    renderPreviews();
}

// Render previews
function renderPreviews() {
    const container = document.getElementById('imagePreviewContainer');
    const preview = document.getElementById('imagePreview');

    preview.innerHTML = '';
    if (selectedFilesArray.length === 0) {
        container.style.display = 'none';
        return;
    }
    container.style.display = 'block';

    selectedFilesArray.forEach((file, i) => {
        const reader = new FileReader();
        reader.onload = function (e) {
            const wrapper = document.createElement('div');
            wrapper.style.position = 'relative';

            const img = document.createElement('img');
            img.src = e.target.result;
            img.alt = file.name;

            const btn = document.createElement('button');
            btn.textContent = 'X';
            btn.className = 'remove-btn';
            btn.onclick = () => window.removeImage(i);

            wrapper.appendChild(img);
            wrapper.appendChild(btn);
            preview.appendChild(wrapper);
        }
        reader.readAsDataURL(file);
    });
}

// Handle file selection
function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    selectedFilesArray = [];

    files.forEach(file => {
        if (selectedFilesArray.length < maxFiles && file.type.startsWith('image/') && file.size <= maxFileSize) {
            selectedFilesArray.push(file);
        }
    });

    renderPreviews();
}

// Form submission
document.getElementById('bookingForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const service = document.getElementById('service').value;
    if (!service) return showMessage("Error", "Please select a service.");

    const garage = document.getElementById('garageSize');
    if (garage.required && !garage.value) return showMessage("Error", "Garage size required.");

    const phone = document.getElementById('phone').value;
    if (!phone) return showMessage("Error", "Phone required.");

    const formData = {
        service: service,
        garageSize: garage.value,
        date: document.getElementById('date').value,
        time: document.getElementById('time').value,
        name: document.getElementById('name').value,
        phone: phone,
        email: document.getElementById('email').value,
        address: document.getElementById('address').value,
        notes: document.getElementById('notes').value,
        fileCount: selectedFilesArray.length
    };

    let content = `Thank you, <strong>${formData.name}</strong>!<br>
    Appointment: <strong>${formData.service}</strong><br>
    Date: ${formData.date} at ${formData.time}<br>
    Address: ${formData.address}<br>
    Garage Size: ${formData.garageSize || "Not specified"}<br>
    ${formData.fileCount ? formData.fileCount + " photo(s) attached" : "No photos"}<br>
    We will call you at ${formData.phone}. Confirmation sent to ${formData.email}.`;

    showMessage("Booking Confirmed!", content);

    this.reset();
    selectedFilesArray = [];
    renderPreviews();
    updateGarageSizeRequirement();
});

// Initialize
window.onload = function () {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    document.getElementById('date').min = `${yyyy}-${mm}-${dd}`;
    updateGarageSizeRequirement();
}

document.getElementById('service').addEventListener('change', updateGarageSizeRequirement);
document.getElementById('photos').addEventListener('change', handleFileSelect);
