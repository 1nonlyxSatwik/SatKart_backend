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

async function getImages() {
    const products = await Product.find({});
    products.forEach(p => console.log(p.image));
    mongoose.connection.close();
}

getImages();
