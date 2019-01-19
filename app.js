const express = require('express');
const mongoose = require('mongoose'); 
const Product = require('./models/product');
const _ = require('lodash');

const app = express();

mongoose.connect('mongodb://localhost:27017/shopping_cart', { useNewUrlParser: true });

app.use(express.json());

app.post('/product/fetch', (req, res) => {
  if (_.isEmpty(req.body) && !req.body.title && !req.body.inStockOnly) {
    return res.send('error');
  }

  let query_condition = req.body.title? { title: req.body.title } : req.body.inStockOnly? { inventory_count: { $gt: 0 } } : null ;

  Product.find(query_condition, '-__v').then((result) => {
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

app.post('/product/buy', (req, res) => {
  Product.findOne({ title: req.body.title }, (err, product) => {
    if (product.inventory_count > 0 ) {
      product.inventory_count--;
      product.save().then((product2) => {
        res.send({ 'message': `You have purchased an ${product2.title}. Stock left: ${product.inventory_count}`});
      })
    } else {
      res.send({ 'message': `${product.title} is out of stock` });
    }
  })
})

app.listen(3000, () => {
  console.log(`Server is running`)
});