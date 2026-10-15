
const foodContainer = document.getElementById("foodContainer");
const categoryFilter = document.getElementById("categoryFilter");
const menuMessage = document.getElementById("menuMessage");

let allFoods = [];

// DEFAULT IMAGES BASED ON CATEGORY
const foodImages = {
    pizza: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800",
    burger: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800",
    pasta: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=800",
    biryani: "https://images.unsplash.com/photo-1563379091339-03246963d96c?w=800",
    dessert: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800",
    beverage: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800"
};

const defaultImage = "/images/default-food.jpg";

// GET CATEGORY IMAGE
function getFoodImage(category) {
    const key = String(category || "").trim().toLowerCase();
    return foodImages[key] || defaultImage;
}

// FETCH FOOD ITEMS FROM BACKEND
async function loadFoods() {
    try {
        const response = await fetch("/food");

        if (!response.ok) {
            throw new Error("Unable to load food items");
        }

        allFoods = await response.json();

        populateCategories();
        displayFoods(allFoods);

    } catch (error) {
        menuMessage.textContent =
            "Unable to load menu. Please check your server.";

        console.error("MENU ERROR:", error);
    }
}

// POPULATE CATEGORY DROPDOWN
function populateCategories() {
    categoryFilter.innerHTML =
        '<option value="All">All Categories</option>';

    const categories = [
        ...new Set(
            allFoods
                .map(food => food.category)
                .filter(Boolean)
        )
    ];

    categories.sort();

    categories.forEach(category => {
        const option = document.createElement("option");

        option.value = category;
        option.textContent = category;

        categoryFilter.appendChild(option);
    });
}

// DISPLAY FOOD CARDS
function displayFoods(foods) {
    foodContainer.innerHTML = "";

    if (foods.length === 0) {
        menuMessage.textContent = "No food items found.";
        return;
    }

    menuMessage.textContent = "";

    foods.forEach(food => {
        const card = document.createElement("div");
        card.className = "menu-food-card";

        // FOOD IMAGE
        const image = document.createElement("img");

        // Uploaded image gets first priority
        image.src = food.image_url || getFoodImage(food.category);

        image.alt = food.food_name;
        image.loading = "lazy";

        // If uploaded image fails, try category image.
        // If that also fails, use local default image.
        image.onerror = function () {
            const categoryImage = getFoodImage(food.category);

            if (this.src !== new URL(categoryImage, location.href).href) {
                this.src = categoryImage;
            } else {
                this.onerror = null;
                this.src = defaultImage;
            }
        };

        // FOOD CONTENT
        const content = document.createElement("div");
        content.className = "menu-food-content";

        const category = document.createElement("span");
        category.className = "food-category";
        category.textContent = food.category;

        const name = document.createElement("h3");
        name.textContent = food.food_name;

        const description = document.createElement("p");
        description.textContent =
            food.description || "Delicious freshly prepared food.";

        // PRICE AND AVAILABILITY
        const bottom = document.createElement("div");
        bottom.className = "food-bottom";

        const price = document.createElement("strong");
        price.className = "food-price";
        price.textContent = "₹" + Number(food.price).toFixed(2);

        const status = document.createElement("span");

        status.className = food.availability
            ? "availability available"
            : "availability unavailable";

        status.textContent = food.availability
            ? "Available"
            : "Unavailable";

        bottom.append(price, status);
        content.append(category, name, description, bottom);
        card.append(image, content);

        foodContainer.appendChild(card);
    });
}

// FILTER FOOD BY CATEGORY
categoryFilter.addEventListener("change", () => {
    const selected = categoryFilter.value;

    const filtered = selected === "All"
        ? allFoods
        : allFoods.filter(food => food.category === selected);

    displayFoods(filtered);
});

// INITIAL LOAD
loadFoods();

