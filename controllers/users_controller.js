var crypto = require('crypto');
var mongoose = require('mongoose'),
    User = mongoose.model('User');
function hashPW(pwd){
  return crypto.createHash('sha256').update(pwd).
         digest('base64').toString();
}
exports.signup = function(req, res){
  var user = new User({username:req.body.username});
  user.set('hashed_password', hashPW(req.body.password));
  user.set('email', req.body.email);
  user.save(function(err) {
    msg = 'There was an issue with setting up your account. Please try again.'
    console.log(err);
    if (err){
      res.session.error = err;
      req.session.msg = msg;
      res.redirect('/signup');
    } else {
      req.session.user = user.id;
      req.session.username = user.username;
      req.session.msg = 'Logged in as: ' + user.username;
      res.redirect('/');
    }
  });
};

exports.login = function(req, res){
  User.findOne({ username: req.body.username })
  .exec(function(err, user) {
    if (!user){
      err = 'User Not Found.';
    } else if (user.hashed_password ===
               hashPW(req.body.password.toString())) {
      req.session.regenerate(function(){
        console.log("login");
        console.log(user);
        req.session.user = user.id;
        req.session.username = user.username;
        req.session.msg = 'Logged in as: ' + user.username;
        req.session.color = user.color;
        req.session.quote = user.quote;
        req.session.email = user.email;
        req.session.avatarURL = user.avatarURL;
        res.redirect('/');
      });
    }else{
      msg = 'Authentication failed.';
    }
    if(err){
      req.session.regenerate(function(){
        req.session.msg = msg;
        res.redirect('/login');
      });
    }
  });
};

exports.getUserProfile = function(req, res) {
  User.findOne({ _id: req.session.user })
  .exec(function(err, user) {
    if (!user){
      res.json(404, {err: 'User Not Found.'});
    } else {
      res.json(user);
    }
  });
};

exports.updateUser = function(req, res){
  User.findOne({ _id: req.session.user })
  .exec(function(err, user) {
    user.set('email', req.body.email);
    user.set('color', req.body.color);
    user.set('quote', req.body.quote);
    user.set('avatarURL', req.body.avatarURL);
    user.save(function(err) {
      if (err){
        req.session.msg = 'There was an issue with updating your info. Please try again.'
        res.sessor.error = err;
      } else {
        req.session.msg = 'User Updated.';
        req.session.color = req.body.color;
        req.session.quote = req.body.quote;
        req.session.email = req.body.email;
        req.session.avatarURL = req.body.avatarURL;
      }
      res.redirect('/');
    });
  });
};

exports.deleteUser = function(req, res){
  User.findOne({ _id: req.session.user })
  .exec(function(err, user) {
    if(user){
      user.remove(function(err){
        if (err){
          req.session.msg = 'User successfully deleted';
          req.session.msg = err;
        }
        req.session.destroy(function(){
          res.redirect('/login');
        });
      });
    } else{
      req.session.msg = "User Not Found!";
      req.session.destroy(function(){
        res.redirect('/login');
      });
    }
  });
};
