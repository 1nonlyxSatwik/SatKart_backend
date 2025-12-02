const mongoose = require("mongoose");

mongoose.connect("mongodb+srv://satwik_db_user:YKE4vKEkrOCek5FM@cluster0.h5bxcbf.mongodb.net/satkart");

const Product = mongoose.model("Product", {
    id: { type: Number, required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String, required: true },
    category: { type: String, required: true },
    new_price: { type: Number },
    old_price: { type: Number },
    date: { type: Date, default: Date.now },
    avilable: { type: Boolean, default: true },
});

async function updateImages() {
    const products = await Product.find({});
    for (const product of products) {
        if (!product.image.startsWith("/images/")) {
            product.image = "/images/" + product.image;
            await product.save();
            console.log(`Updated ${product.name} image to ${product.image}`);
        }
    }
    console.log("All images updated");
    mongoose.connection.close();
}

updateImages();
