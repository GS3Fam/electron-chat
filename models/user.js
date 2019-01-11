var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');

//user schema
var UserSchema = mongoose.Schema({
	created: {
    	type: Date,
    	default: Date.now
	  },
	companyCode: {
		type: String
	},
	username: {
		type: String,
		index: true
	},
	password: {
		type: String
	},
	email: {
		type: String
	},
	name: {
		type: String
	},
	code: {
		type: String
	},
	subUnit: {
		type: String
	},
	unit: {
		type: String
	},
	status: {
		type: Boolean
	},
	modified: {
		type: Date
	},
	role: {
		type: String
	},
	iconPortal: {
		type: String
	},
	labelPortal: {
		type: String
	},
	landingPage: String,
	nextPage: String
}, {
	minimize: false
});

//sample methods
/*UserSchema.methods.combine = function(){
	this.code=this.username + this.email;
};
UserSchema.methods.computeNickName = function(){
	this.nickname=this.username + this.name;
};*/

var User = module.exports = mongoose.model('User', UserSchema);

module.exports.listAll = function(callback) {
	//User.find(callback);
	User.find().sort('name').exec(callback)
}

module.exports.updateUser = function(userToUpdate, id, callback) {
	User.model('User').findByIdAndUpdate(id, { $set: userToUpdate}, null, callback)
}

module.exports.activateUserAccount = function(id, callback) {
	User.model('User').findByIdAndUpdate(id, { $set: { 'status': true }}, null, callback)
}

module.exports.deactivateUserAccount = function(id, callback) {
	User.model('User').findByIdAndUpdate(id, { $set: { 'status': false }}, null, callback)
}

module.exports.deleteUserAccount = function(id, callback) {
	User.model('User').findByIdAndRemove(id, callback)
}

module.exports.isAdmin = function(id, callback) {
	User.findById(id, function(err, user) {
		if (err) {return false};

		var i;
		var str = user.role.split(",");

		return false;

		for(i=0; i<str.length; i++) {
			//set user access determining menu link visibility here to TRUE subject to condition
			if (str[i] === 'Admin') {return true;}
		};
	});
}

module.exports.createUser = function(newUser, callback) {
	bcrypt.genSalt(10, function(err, salt) {
		bcrypt.hash(newUser.password, salt, function(err, hash) {
			newUser.password = hash;
			newUser.save(callback);
		});
	});
}


module.exports.getUserByUserName = function(username, callback) {
	var query = {username: { $regex: new RegExp(`^${username}$`, 'i') }};
	User.findOne(query, callback);
}

module.exports.getUserById = function(id, callback) {
	User.findById(id, callback);
}

module.exports.getUserByName = function(Name, callback) {
	User.findOne({'name': Name}, callback);
}

module.exports.getUserByUsername = function(UserName, callback) {
	var query = {username: { $regex: new RegExp(`^${UserName}$`, 'i') }};
	User.findOne(query, callback);
}

module.exports.getUserByEmail = function(Email, callback) {
	User.findOne({'email': Email}, callback);
}

module.exports.comparePassword = function (candidatePassword, hash, callback) {
	bcrypt.compare(candidatePassword, hash, function(err, isMatch) {
		if (err) throw err;
		callback(null, isMatch);
	})
}

module.exports.getUserEmails = function(callback, query={}, select='') {
	User.find(query, { _id:0 , email:1 }).select(select).exec(callback);
}

module.exports.hashPassword = function(_id, password, _callback=function(){}) {
	bcrypt.genSalt(10, function(err, salt) {
		bcrypt.hash(password, salt, function(err, hash) {
			User.findOneAndUpdate({_id: _id}, {$set: { password: hash }}, _callback);
		});
	});
}

module.exports.hashForFPass = function(item, _callback=function(){}) {
	bcrypt.genSalt(10, (err, salt) => {
		bcrypt.hash(item, salt, (err, hash) => {
			if(err)
				_callback(err);
			else
				_callback(null, hash);
		});
	});
}

module.exports.setnewFPass = function(password, email, _callback=function(){}) {
	bcrypt.genSalt(10, (err, salt) => {
		bcrypt.hash(password, salt, (err, hash) => {
			User.update({ email: {$regex: new RegExp(email, 'i')} },
						{ $set: { password: hash } })
				.exec(_callback);
		});
	});
}