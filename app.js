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

app.post('/product/add', async (req, res) => {
  let products = req.body;

  async function valid_schema() {
    let error_list = [];
    for (let item of products) {
      let product = new Product(item);
      let error = product.validateSync();
      if (error) {
        error_list.push({product, error})
      }
    }
    return error_list;
  }

  let result = await valid_schema();

  if (!_.isEmpty(result)) {
    return res.send(result);
  }

  async function inserting() {
    let product_list = [];
    for (let item of products) {
      let product = new Product(item);
      await product.save();
      product_list.push(product.title);
    }
    return product_list;
  }

  inserting().then((prod) => {
    res.send({ 'message': `You have added ${prod} to the inventory`});
  }).catch(err => res.send(err));
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