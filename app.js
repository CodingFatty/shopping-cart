const express = require('express');
const mongoose = require('mongoose'); 
const Product = require('./models/product');

const app = express();

mongoose.connect('mongodb://localhost:27017/shopping_cart');

app.use(express.json());

app.post('/product/fetch', (req, res) => {
  let product_name = req.body.title? { title: req.body.title } : null;

  Product.find(product_name, '-__v').then((result) => {
    res.send(result);
  })
});

app.post('/product/add', (req, res) => {
  let product_list = req.body;

  for (let item of product_list) {
    let product = new Product(item);
    product.save(() => {
      console.log(`${item.title} saved`);
    })
  }
  res.send('ok');
});

app.listen(3000);