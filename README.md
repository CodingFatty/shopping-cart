# Shopping-Cart-Api
![Heroku](https://heroku-badge.herokuapp.com/?app=shopping-cart-challenge)

## What you need
- [Node.js](https://nodejs.org/)
- a cup of coffee or tea

## Installation
Shopping-cart requires [Node.js](https://nodejs.org/) v9.5.0 to run.
```sh
git clone https://github.com/CodingFatty/shopping-cart.git
cd shopping-cart
git checkout extra-credit-version
npm install
node app.js
```
Then, navigating to your server address in your preferred beowser.
 ```sh
 localhost:3000
```

## APIs
| Method | Link | Description | Request Body | Remarks |
| ------| -----| ------ | ----- | ---- |
| POST | product/insert | To add one or more products into database| [{"title": String, "price": Number, "invectory_count": Number}]
| POST | product/fetch | Get infomation of one item or a list of all products from database | {"title": String} or {"inStockOnly": Boolean} |
| POST | product/addItemToCart | Add one selected product into shopping cart | {"title" String}|
| POST | product/checkout | Finish checkout with items in shopping-cart | | I made it POST because I think it will accept  customer infomation when they are going to finish the purchase. However, It has empty body in the Postman template now.| 

## Live testing
It is running live on [Heroku](http://shopping-cart-challenge.herokuapp.com/)!

Click the icon below to test the API in Postman!
[![Run in Postman](https://run.pstmn.io/button.svg)](https://www.getpostman.com/collections/4ab7f0f916b181d0f975)