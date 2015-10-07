//setup Dependencies
var connect = require('connect');
var express = require('express');
var app = express();
var server = require('http').Server(app);
var port = (process.env.PORT || 8082);

//Setup Express
    app.set('views', __dirname + '/views');
    app.set('view options', { layout: false });
    app.use(connect.bodyParser());
    app.use(express.cookieParser());
    app.use(express.session({ secret: "shhhhhhhhh!"}));
    app.use(connect.static(__dirname + '/static'));
    app.use(app.router);

console.log('Listening on http://0.0.0.0:' + port );
server.listen(port);

///////////////////////////////////////////
//              Routes                   //
///////////////////////////////////////////

app.locals = { 
              title : 'Fantasy Dashboard'
             ,description: ''
             ,author: 'Calvin Hu'
             ,analyticssiteid: 'XXXXXXX' 
            };

/////// ADD ALL YOUR ROUTES HERE  /////////

app.get('/', function(req,res){
  res.render('index.jade');
});

//A Route for Creating a 500 Error (Useful to keep around)
app.get('/500', function(req, res){
    throw new Error('This is a 500 Error');
});

//The 404 Route (ALWAYS Keep this as the last route)

function NotFound(msg){
    this.name = 'NotFound';
    Error.call(this, msg);
    Error.captureStackTrace(this, arguments.callee);
}


