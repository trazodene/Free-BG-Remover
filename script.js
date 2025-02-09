// Function to update history container dimensions and scroll
function updateHistoryContainer() {
    const historyWrapper = document.querySelector('.history-wrapper');
    const historyContainer = document.querySelector('.history-container');
    const hasItems = historyContainer.children.length > 0;

    // Ensure historyWrapper is visible when items exist
    historyWrapper.style.display = hasItems ? "flex" : "none";

    // Calculate available space dynamically
    const leftSection = document.querySelector('.left-section');
    const header = document.querySelector('.header');
    const uploadArea = document.querySelector('.upload-area');

    if (leftSection && header && uploadArea) {
        const otherElementsHeight = header.offsetHeight + uploadArea.offsetHeight;
        const maxAllowedHeight = (leftSection.offsetHeight - otherElementsHeight) * 0.6; // 60% of available space
        historyWrapper.style.maxHeight = hasItems ? `${maxAllowedHeight}px` : '0';
        historyContainer.style.overflowY = "auto"; // Enable scrolling inside history container
    }

    // Scrollbar spacing
    const needsScroll = historyContainer.scrollHeight > historyContainer.clientHeight;
    historyContainer.style.paddingRight = needsScroll ? '5px' : '0';
}

// Image Upload Handler
function showImage(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        const imgHistory = document.getElementById("historyContainer");
        const newImageCard = document.createElement("div");
        newImageCard.className = "history-card";
        newImageCard.setAttribute("data-original", e.target.result);

        // Card Content
        newImageCard.innerHTML = `
            <img src="${e.target.result}" alt="Uploaded Image" class="history-img">
            <div class="file-name">${shortenFileName(file.name)}</div>
            <i class="fa-solid fa-trash"></i>
        `;

        // Click to Show in Main View
        newImageCard.addEventListener("click", () => {
            document.getElementById("mainImage").src = newImageCard.querySelector("img").src;
        });

        // Delete Functionality
        const trashIcon = newImageCard.querySelector(".fa-trash");
        trashIcon.addEventListener("click", (e) => {
            e.stopPropagation();
            imgHistory.removeChild(newImageCard);

            if (imgHistory.children.length === 0) {
                document.getElementById("mainImage").src = "./trazodene.jpg";
            }

            updateHistoryContainer();
        });

        // Insert the new image at the top of history
        imgHistory.prepend(newImageCard);

        // Ensure history container is visible
        imgHistory.style.display = "flex";

        // Update container
        updateHistoryContainer();

        // Set initial main image if it's still the default
        const mainImage = document.getElementById("mainImage");
        if (mainImage.src.endsWith('701@2@b.jpg')) {
            mainImage.src = e.target.result;
        }
    };
    reader.readAsDataURL(file);
}

// Helper function to convert Data URL to Blob
function dataURLtoBlob(dataURL) {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
}

// Background Removal Function
async function removeBackground() {
    const mainImage = document.getElementById("mainImage");
    const activeCard = [...document.querySelectorAll('.history-card')].find(card => 
        card.querySelector('img').src === mainImage.src
    );

    if (!activeCard) {
        alert("No image available to process.");
        return;
    }

    const originalSrc = activeCard.getAttribute("data-original");
    if (!originalSrc) {
        alert("Original image data missing.");
        return;
    }

    // Show Loader
    const loader = document.createElement("div");
    loader.className = "loader";
    activeCard.appendChild(loader);

    try {
        const formData = new FormData();
        const blob = dataURLtoBlob(originalSrc);
        formData.append("image_file", blob, "image.png");
        formData.append("size", "auto");

        const response = await fetch("https://api.remove.bg/v1.0/removebg", {
            method: "POST",
            headers: {
                "X-Api-Key": "a31ZejMSxupdQyc3xQrGYJnK"
            },
            body: formData
        });

        if (!response.ok) throw new Error('API response error');

        const resultBlob = await response.blob();
        const newImageUrl = URL.createObjectURL(resultBlob);

        // Update card image and main view
        const cardImg = activeCard.querySelector("img");
        cardImg.src = newImageUrl;
        mainImage.src = newImageUrl;
        activeCard.setAttribute("data-removed-bg", newImageUrl);

    } catch (error) {
        console.error("Error removing background:", error);
        alert("Failed to remove background. Please try again.");
    } finally {
        loader.remove();
    }
}

// Download the background-removed image
function downloadImage() {
    const mainImage = document.getElementById("mainImage");
    const activeCard = [...document.querySelectorAll('.history-card')].find(card => 
        card.querySelector('img').src === mainImage.src
    );

    if (!activeCard) {
        alert("No image available to download.");
        return;
    }

    const removedBgSrc = activeCard.getAttribute("data-removed-bg");
    if (!removedBgSrc) {
        alert("Please remove the background first before downloading.");
        return;
    }

    fetch(removedBgSrc)
        .then(res => res.blob())
        .then(blob => {
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = "image-removed-bg.png";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        })
        .catch(error => {
            console.error("Download error:", error);
            alert("Failed to download image.");
        });
}

// Helper Functions
function shortenFileName(name, maxLength = 20) {
    return name.length > maxLength ? '*****' + name.slice(-maxLength) : name;
}

// Popup Controls
document.addEventListener('DOMContentLoaded', () => {
    const btn2 = document.getElementById('btn2');
    const btn1 = document.getElementById('btn1');
    const btn3 = document.getElementById('btn3');
    const popup = document.querySelector('.popup');
    const overlay = document.querySelector('.popupoverlay');
    const container = document.querySelector('.container');

    btn2.addEventListener('click', () => {
        const imgSrc = document.getElementById('mainImage').src;
        popup.innerHTML = `<img src="${imgSrc}" alt="Enlarged view">`;
        popup.style.display = overlay.style.display = 'flex';
        container.classList.add('background-blur');
    });

    overlay.addEventListener('click', () => {
        popup.style.display = overlay.style.display = 'none';
        container.classList.remove('background-blur');
    });

    btn1.addEventListener("click", removeBackground);
    btn3.addEventListener("click", downloadImage);
});

// Window Resize Handler
window.addEventListener('resize', updateHistoryContainer);

// Initial Setup
document.addEventListener('DOMContentLoaded', updateHistoryContainer);
