const mongoose = require('mongoose');

//////////
// Mongoose schemas
const userSchema = mongoose.Schema({

});
const emailSchema = mongoose.Schema({

});
const bankSchema = mongoose.Schema({

});

//////////
// Mongoose models
const User = mongoose.model('User', userSchema);
const Email = mongoose.model('Email', emailSchema);
const Bank = mongoose.model('Bank', bankSchema);

//////////
// Mongoose model exports
module.exports = {
  User,
  Email,
  Bank
};