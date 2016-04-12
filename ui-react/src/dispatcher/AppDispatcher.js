var Dispatcher = require('flux').Dispatcher;
// var assign = require('object-assign');

var dispatcherSingelton = (function() {
  var single;
  if (!single) {
    single = new Dispatcher();
  }
  return function() { return single };
}())

module.exports = dispatcherSingelton();