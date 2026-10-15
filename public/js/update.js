
const foodSelect = document.getElementById("foodSelect");
const updateForm = document.getElementById("updateFoodForm");
const updateMessage = document.getElementById("updateMessage");

const foodIdInput = document.getElementById("food_id");
const foodNameInput = document.getElementById("food_name");
const categoryInput = document.getElementById("category");
const priceInput = document.getElementById("price");
const descriptionInput = document.getElementById("description");
const availabilityInput = document.getElementById("availability");

// IMAGE ELEMENTS
const foodImageInput = document.getElementById("food_image");
const currentFoodImage = document.getElementById("currentFoodImage");
const currentImageMessage = document.getElementById("currentImageMessage");
const newImagePreviewBox = document.getElementById("newImagePreviewBox");
const newImagePreview = document.getElementById("newImagePreview");

let previewURL = null;
let selectionVersion = 0;

const foodImages = {
    pizza: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800",
    burger: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800",
    pasta: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=800",
    biryani: "https://images.unsplash.com/photo-1563379091339-03246963d96c?w=800",
    dessert: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800",
    beverage: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800"
};

const defaultImage =
    "https://images.unsplash.com/photo-1547592180-85f173990554?w=800";

function getFoodImage(category) {
    return foodImages[String(category || "").trim().toLowerCase()]
        || defaultImage;
}

// CLEAR SELECTED NEW IMAGE
function clearNewImage() {
    if (previewURL) {
        URL.revokeObjectURL(previewURL);
        previewURL = null;
    }

    foodImageInput.value = "";
    newImagePreview.removeAttribute("src");
    newImagePreviewBox.hidden = true;
}

// SHOW EXISTING FOOD IMAGE
function showCurrentImage(food) {
    currentFoodImage.src =
        food.image_url || getFoodImage(food.category);

    currentFoodImage.alt = food.food_name;
    currentImageMessage.textContent =
        food.image_url
            ? "Currently uploaded food image"
            : "Category image (no uploaded photo yet)";

    currentFoodImage.onerror = function () {
        this.onerror = null;
        this.src = getFoodImage(food.category);
    };
}

// LOAD FOOD DROPDOWN
async function loadFoodDropdown() {
    try {
        const response = await fetch("/food");

        if (!response.ok) {
            throw new Error("Unable to load foods");
        }

        const foods = await response.json();

        foodSelect.innerHTML =
            '<option value="">-- Select Food ID & Name --</option>';

        foods.forEach(food => {
            const option = document.createElement("option");

            option.value = food.food_id;
            option.textContent =
                food.food_id + " - " + food.food_name;

            foodSelect.appendChild(option);
        });

    } catch (error) {
        updateMessage.textContent =
            "Unable to load food items. Check your server.";
        updateMessage.style.color = "#B53B3B";
        console.error(error);
    }
}

// LOAD SELECTED FOOD DETAILS
foodSelect.addEventListener("change", async () => {
    const foodId = foodSelect.value;
    const currentSelection = ++selectionVersion;

    updateForm.hidden = true;
    updateMessage.textContent = "";
    clearNewImage();

    if (!foodId) return;

    try {
        const response = await fetch(
            "/food/" + encodeURIComponent(foodId)
        );

        if (!response.ok) {
            throw new Error("Food item not found");
        }

        const food = await response.json();

        // Ignore an old response if the user changed selection
        if (currentSelection !== selectionVersion) return;

        foodIdInput.value = food.food_id;
        foodNameInput.value = food.food_name;
        priceInput.value = food.price;
        descriptionInput.value = food.description || "";
        availabilityInput.value =
            String(Number(food.availability));

        // HANDLE EXISTING MYSQL CATEGORIES
        const existingOption = Array.from(categoryInput.options)
            .find(option => option.value === food.category);

        if (!existingOption) {
            const option = document.createElement("option");
            option.value = food.category;
            option.textContent = food.category;
            categoryInput.appendChild(option);
        }

        categoryInput.value = food.category;

        // DISPLAY CURRENT FOOD IMAGE
        showCurrentImage(food);

        updateForm.hidden = false;

    } catch (error) {
        if (currentSelection !== selectionVersion) return;

        updateMessage.textContent =
            "Unable to load selected food details.";
        updateMessage.style.color = "#B53B3B";
        console.error(error);
    }
});

// PREVIEW NEW FOOD IMAGE
foodImageInput.addEventListener("change", () => {
    clearPreviewOnly();

    const file = foodImageInput.files[0];

    if (!file) return;

    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    if (!allowedTypes.includes(file.type)) {
        foodImageInput.value = "";
        updateMessage.textContent =
            "Please choose a JPG, PNG or WebP image.";
        updateMessage.style.color = "#B53B3B";
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        foodImageInput.value = "";
        updateMessage.textContent =
            "Image must be smaller than 5 MB.";
        updateMessage.style.color = "#B53B3B";
        return;
    }

    previewURL = URL.createObjectURL(file);
    newImagePreview.src = previewURL;
    newImagePreviewBox.hidden = false;

    updateMessage.textContent = "";
});

// CLEAR PREVIEW WITHOUT CLEARING THE INPUT
function clearPreviewOnly() {
    if (previewURL) {
        URL.revokeObjectURL(previewURL);
        previewURL = null;
    }

    newImagePreview.removeAttribute("src");
    newImagePreviewBox.hidden = true;
}

// SAVE UPDATED FOOD DETAILS AND OPTIONAL IMAGE
updateForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const foodId = foodIdInput.value;

    const foodName = foodNameInput.value.trim();
    const category = categoryInput.value;
    const price = Number(priceInput.value);
    const description = descriptionInput.value.trim();
    const availability = availabilityInput.value;
    const imageFile = foodImageInput.files[0];

    if (
        !foodId ||
        !foodName ||
        !category ||
        priceInput.value === "" ||
        !Number.isFinite(price) ||
        price < 0 ||
        !["0", "1"].includes(availability)
    ) {
        updateMessage.textContent =
            "Please enter valid food details.";
        updateMessage.style.color = "#B53B3B";
        return;
    }

    // BUILD MULTIPART FORM DATA
    const formData = new FormData();

    formData.append("food_name", foodName);
    formData.append("category", category);
    formData.append("price", priceInput.value);
    formData.append("description", description);
    formData.append("availability", availability);

    // IMAGE IS OPTIONAL
    if (imageFile) {
        formData.append("food_image", imageFile);
    }

    const submitButton =
        updateForm.querySelector('button[type="submit"]');

    submitButton.disabled = true;
    updateMessage.textContent = "Updating food item...";
    updateMessage.style.color = "#641E32";

    try {
        const response = await fetch(
            "/food/" + encodeURIComponent(foodId),
            {
                method: "PUT",
                body: formData
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Update failed");
        }

        updateMessage.textContent =
            "✓ Food item updated successfully!";
        updateMessage.style.color = "#287A42";

        // REFRESH DROPDOWN AND KEEP SELECTED FOOD
        await loadFoodDropdown();
        foodSelect.value = foodId;

        // GET FRESH IMAGE URL AND DETAILS
        const refreshedResponse = await fetch(
            "/food/" + encodeURIComponent(foodId),
            { cache: "no-store" }
        );

        if (refreshedResponse.ok) {
            const refreshedFood = await refreshedResponse.json();

            showCurrentImage(refreshedFood);

            // Avoid cached old image after replacement
            if (refreshedFood.image_url) {
                const separator =
                    refreshedFood.image_url.includes("?") ? "&" : "?";

                currentFoodImage.src =
                    refreshedFood.image_url +
                    separator +
                    "v=" + Date.now();
            }
        }

        clearNewImage();

    } catch (error) {
        updateMessage.textContent = error.message;
        updateMessage.style.color = "#B53B3B";
        console.error("UPDATE ERROR:", error);

    } finally {
        submitButton.disabled = false;
    }
});

// INITIAL LOAD
loadFoodDropdown();
