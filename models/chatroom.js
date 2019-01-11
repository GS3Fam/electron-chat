let
  mongoose = require('mongoose'),
  ChatRoomSchema = mongoose.Schema({
    name: { type : String , "default" : "New chat room" },
    members: { type : Array , "default" : [] },
    organization: { type : String , "default" : 0 },
    type: { type : String , "default" : "private" }
  })

let model = module.exports = mongoose.model('chatroom', ChatRoomSchema, 'chatroom');
