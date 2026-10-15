
const addFoodForm = document.getElementById("addFoodForm");
const addMessage = document.getElementById("addMessage");

const foodImageInput = document.getElementById("food_image");
const imagePreviewBox = document.getElementById("imagePreviewBox");
const imagePreview = document.getElementById("imagePreview");

let previewURL = null;

// IMAGE PREVIEW
foodImageInput.addEventListener("change", () => {
    const file = foodImageInput.files[0];

    if (previewURL) {
        URL.revokeObjectURL(previewURL);
        previewURL = null;
    }

    imagePreviewBox.hidden = true;
    imagePreview.removeAttribute("src");

    if (!file) return;

    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    if (!allowedTypes.includes(file.type)) {
        alert("Please choose a JPG, PNG or WebP image.");
        foodImageInput.value = "";
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        alert("Image must be smaller than 5 MB.");
        foodImageInput.value = "";
        return;
    }

    previewURL = URL.createObjectURL(file);
    imagePreview.src = previewURL;
    imagePreviewBox.hidden = false;
});

// ADD FOOD WITH IMAGE
addFoodForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const foodId = document.getElementById("food_id").value;
    const foodName = document.getElementById("food_name").value.trim();
    const category = document.getElementById("category").value;
    const price = document.getElementById("price").value;
    const description = document.getElementById("description").value.trim();
    const availability = document.getElementById("availability").value;

    const imageFile = foodImageInput.files[0];

    if (!foodId || !foodName || !category ||
        price === "" || availability === "" || !imageFile) {
        addMessage.textContent = "Please fill all required fields and choose an image.";
        addMessage.style.color = "#B53B3B";
        return;
    }

    // FormData sends both text fields and image
    const formData = new FormData();

    formData.append("food_id", foodId);
    formData.append("food_name", foodName);
    formData.append("category", category);
    formData.append("price", price);
    formData.append("description", description);
    formData.append("availability", availability);

    formData.append("food_image", imageFile);

    const submitButton = addFoodForm.querySelector(
        'button[type="submit"]'
    );

    submitButton.disabled = true;

    addMessage.textContent = "Adding food item...";
    addMessage.style.color = "#641E32";

    try {
        const response = await fetch("/food", {
            method: "POST",
            body: formData
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.message || "Unable to add food item"
            );
        }

        addMessage.textContent =
            "✓ Food item and image added successfully!";

        addMessage.style.color = "#287A42";

        addFoodForm.reset();

        imagePreviewBox.hidden = true;

        if (previewURL) {
            URL.revokeObjectURL(previewURL);
            previewURL = null;
        }

        imagePreview.removeAttribute("src");

    } catch (error) {
        addMessage.textContent = error.message;
        addMessage.style.color = "#B53B3B";
        console.error(error);

    } finally {
        submitButton.disabled = false;
    }
});
