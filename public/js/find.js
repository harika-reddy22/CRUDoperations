
const foodSelect = document.getElementById("foodSelect");
const findForm = document.getElementById("findFoodForm");
const foodResult = document.getElementById("foodResult");
const findMessage = document.getElementById("findMessage");

// Images for each category
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

// LOAD DROPDOWN FROM MYSQL
async function loadFoodDropdown() {
    try {
        const response = await fetch("/food");

        if (!response.ok) {
            throw new Error("Unable to load food items");
        }

        const foods = await response.json();

        foodSelect.innerHTML = "";

        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.textContent = "-- Select Food ID & Name --";
        foodSelect.appendChild(placeholder);

        foods.forEach(food => {
            const option = document.createElement("option");

            option.value = food.food_id;
            option.textContent =
                food.food_id + " - " + food.food_name;

            foodSelect.appendChild(option);
        });

        if (foods.length === 0) {
            findMessage.textContent = "No food items available.";
        }

    } catch (error) {
        findMessage.textContent =
            "Unable to load food items. Check your backend.";
        console.error(error);
    }
}

// SEARCH SELECTED FOOD
findForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const foodId = foodSelect.value;

    if (!foodId) {
        findMessage.textContent = "Please select a food item.";
        return;
    }

    findMessage.textContent = "Searching...";
    foodResult.hidden = true;

    try {
        const response = await fetch(
            "/food/" + encodeURIComponent(foodId)
        );

        if (!response.ok) {
            throw new Error("Food item not found");
        }

        const food = await response.json();

        displayFood(food);
        findMessage.textContent = "";

    } catch (error) {
        findMessage.textContent =
            "Unable to find the selected food item.";
        console.error(error);
    }
});

// DISPLAY FOOD DETAILS
function displayFood(food) {
    foodResult.innerHTML = "";

    const image = document.createElement("img");
    image.src = getFoodImage(food.category);
    image.alt = food.food_name;

    const details = document.createElement("div");
    details.className = "find-food-details";

    const category = document.createElement("span");
    category.className = "food-category";
    category.textContent = food.category;

    const name = document.createElement("h2");
    name.textContent = food.food_name;

    const id = document.createElement("p");
    id.textContent = "Food ID: " + food.food_id;

    const description = document.createElement("p");
    description.textContent =
        food.description || "A delicious dish from our kitchen.";

    const price = document.createElement("h3");
    price.className = "find-price";
    price.textContent = "₹" + Number(food.price).toFixed(2);

    const availability = document.createElement("span");
    availability.className = food.availability
        ? "availability available"
        : "availability unavailable";

    availability.textContent = food.availability
        ? "Available"
        : "Unavailable";

    details.append(
        category,
        name,
        id,
        description,
        price,
        availability
    );

    foodResult.append(image, details);
    foodResult.hidden = false;
}

loadFoodDropdown();
