const mongoose = require("mongoose");

mongoose.connect("mongodb+srv://satwik_db_user:YKE4vKEkrOCek5FM@cluster0.h5bxcbf.mongodb.net/satkart");

const Product = mongoose.model("Product", {
    id: { type: Number },
    name: { type: String },
    description: { type: String },
    image: { type: String },
    category: { type: String },
    new_price: { type: Number },
    old_price: { type: Number },
    date: { type: Date, default: Date.now },
    avilable: { type: Boolean, default: true },
});

async function updateImages() {
    const products = await Product.find({});
    console.log(`Found ${products.length} products`);
    for (const product of products) {
        if (product.image && !product.image.startsWith("/images/")) {
            const newImage = "/images/" + product.image;
            await Product.updateOne({ _id: product._id }, { $set: { image: newImage } });
            console.log(`Updated ${product.name} image to ${newImage}`);
        }
    }
    console.log("All images updated");
    mongoose.connection.close();
}

updateImages();
