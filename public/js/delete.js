
const foodSelect = document.getElementById("foodSelect");
const deletePreview = document.getElementById("deletePreview");
const deleteButton = document.getElementById("deleteButton");
const deleteMessage = document.getElementById("deleteMessage");

const previewImage = document.getElementById("previewImage");
const previewCategory = document.getElementById("previewCategory");
const previewName = document.getElementById("previewName");
const previewId = document.getElementById("previewId");
const previewDescription = document.getElementById("previewDescription");
const previewPrice = document.getElementById("previewPrice");
const previewAvailability = document.getElementById("previewAvailability");

let selectedFood = null;

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
    return foodImages[String(category).toLowerCase()] || defaultImage;
}

// LOAD FOOD DROPDOWN
async function loadFoodDropdown() {
    try {
        const response = await fetch("/food");

        if (!response.ok) {
            throw new Error("Unable to load food items");
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
        deleteMessage.textContent =
            "Unable to load food items. Check your server.";
        console.error(error);
    }
}

// SHOW SELECTED FOOD PREVIEW
foodSelect.addEventListener("change", async () => {
    const foodId = foodSelect.value;

    selectedFood = null;
    deletePreview.hidden = true;
    deleteButton.disabled = true;
    deleteMessage.textContent = "";

    if (!foodId) return;

    try {
        const response = await fetch(
            "/food/" + encodeURIComponent(foodId)
        );

        if (!response.ok) {
            throw new Error("Food item not found");
        }

        const food = await response.json();
        selectedFood = food;

       // Show uploaded image first
previewImage.src = food.image_url || getFoodImage(food.category);
previewImage.alt = food.food_name;

// If uploaded image fails, show category image
previewImage.onerror = function () {
    this.onerror = null;
    this.src = getFoodImage(food.category);
};
        previewCategory.textContent = food.category;
        previewName.textContent = food.food_name;
        previewId.textContent = "Food ID: " + food.food_id;
        previewDescription.textContent =
            food.description || "No description available.";

        previewPrice.textContent =
            "₹" + Number(food.price).toFixed(2);

        previewAvailability.textContent =
            food.availability ? "Available" : "Unavailable";

        deletePreview.hidden = false;
        deleteButton.disabled = false;

    } catch (error) {
        deleteMessage.textContent =
            "Unable to load selected food details.";
        console.error(error);
    }
});

// DELETE SELECTED FOOD
deleteButton.addEventListener("click", async () => {
    if (!selectedFood) return;

    const foodId = selectedFood.food_id;
    const foodName = selectedFood.food_name;

    const confirmed = confirm(
        "Are you sure you want to delete " +
        foodName + " (ID: " + foodId + ")?\n\n" +
        "This action cannot be undone."
    );

    if (!confirmed) return;

    deleteButton.disabled = true;
    deleteMessage.textContent = "Deleting food item...";

    try {
        const response = await fetch(
            "/food/" + encodeURIComponent(foodId),
            { method: "DELETE" }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Delete failed");
        }

        deleteMessage.textContent =
            "✓ Food item deleted successfully!";
        deleteMessage.style.color = "#287A42";

        selectedFood = null;
        deletePreview.hidden = true;

        await loadFoodDropdown();

    } catch (error) {
        deleteMessage.textContent = error.message;
        deleteMessage.style.color = "#B53B3B";
        deleteButton.disabled = false;
        console.error(error);
    }
});

loadFoodDropdown();
