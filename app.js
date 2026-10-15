
const express = require("express");
const mysql = require("mysql8");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const imageFolder = path.join(__dirname, "public", "images", "food");

fs.mkdirSync(imageFolder, { recursive: true });

app.use(express.static(path.join(__dirname, "public")));

// DATABASE CONNECTION
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    database: "food_ordering"
});

db.connect((err) => {
    if (err) {
        console.error("Database connection failed:", err);
        return;
    }

    console.log("Connected to Harika's Flavour House database!");
});

// IMAGE UPLOAD SETTINGS
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, imageFolder);
    },

    filename: (req, file, cb) => {
        const uniqueName =
            Date.now() + "-" +
            Math.round(Math.random() * 1000000000);

        const extension = {
            "image/jpeg": ".jpg",
            "image/png": ".png",
            "image/webp": ".webp"
        }[file.mimetype];

        cb(null, uniqueName + extension);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        const allowed = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Only JPG, PNG and WebP images are allowed"));
        }
    }
});

// FIND AN IMAGE BY FOOD ID
function getFoodImage(foodId) {
    const files = fs.readdirSync(imageFolder);

    const image = files.find(file =>
        file.startsWith(String(foodId) + ".")
    );

    return image ? "/images/food/" + image : null;
}

// FIND IMAGE USING AN ID PREFIX
function findFoodImage(foodId) {
    const files = fs.readdirSync(imageFolder);

    return files.find(file =>
        file.startsWith(String(foodId) + ".")
    );
}

// DELETE IMAGE ASSOCIATED WITH FOOD ID
function removeFoodImage(foodId) {
    const image = findFoodImage(foodId);

    if (image) {
        fs.unlinkSync(path.join(imageFolder, image));
    }
}

// ADD IMAGE URL TO FOOD DATA
function addImage(food) {
    return {
        ...food,
        image_url: getFoodImage(food.food_id)
    };
}

// READ ALL FOOD ITEMS
app.get("/food", (req, res) => {
    db.query("SELECT * FROM food_items", (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Error retrieving food items"
            });
        }

        res.json(result.map(addImage));
    });
});

// READ ONE FOOD ITEM
app.get("/food/:id", (req, res) => {
    const foodId = req.params.id;

    db.query(
        "SELECT * FROM food_items WHERE food_id = ?",
        [foodId],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    message: "Error retrieving food item"
                });
            }

            if (result.length === 0) {
                return res.status(404).json({
                    message: "Food item not found"
                });
            }

            res.json(addImage(result[0]));
        }
    );
});

// CREATE FOOD ITEM WITH IMAGE
app.post("/food", upload.single("food_image"), (req, res) => {
    const {
        food_id,
        food_name,
        category,
        price,
        description,
        availability
    } = req.body;

    const id = Number(food_id);

    if (!Number.isSafeInteger(id) || id <= 0 ||
        !food_name || !category ||
        price === "" || !Number.isFinite(Number(price)) ||
        Number(price) < 0 ||
        !["0", "1"].includes(String(availability))) {
        if (req.file) fs.unlinkSync(req.file.path);

        return res.status(400).json({
            message: "Please enter valid food details"
        });
    }

    const sql = `
        INSERT INTO food_items
        (food_id, food_name, category, price, description, availability)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [id, food_name, category, price, description, availability],
        (err, result) => {
            if (err) {
                if (req.file) fs.unlinkSync(req.file.path);

                console.error("MYSQL INSERT ERROR:", err);

                if (err.code === "ER_DUP_ENTRY") {
                    return res.status(409).json({
                        message: "Food ID already exists"
                    });
                }

                return res.status(500).json({
                    message: "Unable to add food item"
                });
            }

            if (req.file) {
                const extension = path.extname(req.file.filename);
                const newPath = path.join(
                    imageFolder,
                    String(id) + extension
                );

                try {
                    removeFoodImage(id);
                    fs.renameSync(req.file.path, newPath);
                } catch (imageError) {
                    console.error("IMAGE SAVE ERROR:", imageError);
                    return res.status(500).json({
                        message: "Food saved, but image could not be saved"
                    });
                }
            }

            res.status(201).json({
                message: "Food item added successfully!",
                food_id: id
            });
        }
    );
});

// UPDATE FOOD ITEM
app.put("/food/:id", upload.single("food_image"), (req, res) => {
    const foodId = req.params.id;

    const {
        food_name,
        category,
        price,
        description,
        availability
    } = req.body;

    const sql = `
        UPDATE food_items
        SET food_name = ?,
            category = ?,
            price = ?,
            description = ?,
            availability = ?
        WHERE food_id = ?
    `;

    db.query(
        sql,
        [
            food_name,
            category,
            price,
            description,
            availability,
            foodId
        ],
        (err, result) => {
            if (err) {
                if (req.file) fs.unlinkSync(req.file.path);

                console.error(err);
                return res.status(500).json({
                    message: "Unable to update food item"
                });
            }

            if (result.affectedRows === 0) {
                if (req.file) fs.unlinkSync(req.file.path);

                return res.status(404).json({
                    message: "Food item not found"
                });
            }

            if (req.file) {
                try {
                    removeFoodImage(foodId);

                    const extension = path.extname(req.file.filename);
                    const newPath = path.join(
                        imageFolder,
                        String(foodId) + extension
                    );

                    fs.renameSync(req.file.path, newPath);
                } catch (imageError) {
                    console.error("IMAGE UPDATE ERROR:", imageError);
                    return res.status(500).json({
                        message: "Food updated, but image update failed"
                    });
                }
            }

            res.json({
                message: "Food item updated successfully!"
            });
        }
    );
});

// DELETE FOOD ITEM
app.delete("/food/:id", (req, res) => {
    const foodId = req.params.id;

    db.query(
        "DELETE FROM food_items WHERE food_id = ?",
        [foodId],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    message: "Unable to delete food item"
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "Food item not found"
                });
            }

            try {
                removeFoodImage(foodId);
            } catch (imageError) {
                console.error("IMAGE DELETE ERROR:", imageError);
            }

            res.json({
                message: "Food item deleted successfully!"
            });
        }
    );
});

// UPLOAD ERROR HANDLING
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({
            message: err.code === "LIMIT_FILE_SIZE"
                ? "Image must be smaller than 5 MB"
                : err.message
        });
    }

    if (err) {
        return res.status(400).json({
            message: err.message
        });
    }

    next();
});

// START SERVER
app.listen(3000, () => {
    console.log("Harika's Flavour House is running on port 3000");
});
