// *********************************************************** //
//  Loading packages to support the server
// *********************************************************** //
// First we load in all of the packages we need for the server...
const createError = require("http-errors"); // to handle the server errors
const express = require("express");
const path = require("path");  // to refer to local paths
const cookieParser = require("cookie-parser"); // to handle cookies
const session = require("express-session"); // to handle sessions using cookies
const debug = require("debug")("personalapp:server"); 
const layouts = require("express-ejs-layouts");

// *********************************************************** //
//  Loading models
const Message = require('./models/Message');

// *********************************************************** //
//  Loading JSON datasets

// *********************************************************** //

const mongoose = require( 'mongoose' );
// const mongodb_URI = 'mongodb://localhost:27017'
const mongodb_URI = 'mongodb+srv://103aDatabase:zZ112358@zz9tf.thtan.mongodb.net/myFirstDatabase?retryWrites=true&w=majority'

mongoose.connect( mongodb_URI, {useNewUrlParser: true} );
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {console.log("Service connected......")});

// *********************************************************** //
// Initializing the Express server 
// This code is run once when the app is started and it creates
// a server that respond to requests by sending responses
// *********************************************************** //
const app = express();
// Here we specify that we will be using EJS as our view engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(layouts);

// Here we process the requests so they are easy to handle
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Here we specify that static files will be in the public folder
app.use(express.static(path.join(__dirname, "public")));

// Here we enable session handling using cookies
app.use(
    session({
      secret: "zzbbyanana789sdfa8f9ds8f90ds87f8d9s789fds", // this ought to be hidden in process.env.SECRET
      resave: false,
      saveUninitialized: false,
    })
  );
  
const auth = require('./routes/auth')
app.use(auth)

const isLoggedIn = (req,res,next) => {
  if (res.locals.loggedIn) {
    next();
  }
  else res.redirect('/login');
}

app.get("/",
  async (req, res, next) => {
    const all_messages = await Message.find({}).sort({topic: 1, message: 1});

    messages = {}
    for (msg of all_messages){
      if (msg.topic in messages){
        messages[msg.topic].push(msg);
      } else {
        messages[msg.topic] = [msg];
      }
    }
    res.locals.messages = messages
    res.render("home");
});

app.post('/post_message',
  isLoggedIn,
  async (req,res,next) => {
    try{
      const {topic, message} = req.body; // get topic and message from the body

      const CreateAt = new Date(); // get the current date/time

      const message_id = req.session.next_id;
      req.session.next_id += 1; // get the message's id
      let data = { // create the data object
        topic: topic, 
        message: message, 
        date: CreateAt, 
        id: message_id} 
      let item = new Message(data) // create the database object (and test the types are correct)
      await item.save() // save the message item in the database
      res.redirect('/')  // go back to the todo page
    } catch (e){
      next(e);
    }
  }
)

// *********************************************************** //
//  Starting up the server!
// *********************************************************** //
//Here we set the port to use between 1024 and 65535  (2^16-1)
const port = "5000";
app.set("port", port);

// and now we startup the server listening on that port
const http = require("http");
const { reset } = require("nodemon");
const server = http.createServer(app);

server.listen(port);

function onListening() {
  var addr = server.address();
  var bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
  debug("Listening on " + bind);
}

function onError(error) {
  if (error.syscall !== "listen") {
    throw error;
  }

  var bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges");
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(bind + " is already in use");
      process.exit(1);
      break;
    default:
      throw error;
  }
}

server.on("error", onError);

server.on("listening", onListening);

module.exports = app;