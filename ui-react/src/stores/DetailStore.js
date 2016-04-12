import Dispatcher from '../dispatcher/AppDispatcher';
import {RECEIVE_PLAYER_DETAILS} from '../constants/ActionTypes';
import {EventEmitter} from 'events';
import assign from 'object-assign';

var CHANGE_EVENT = 'change',
    _details = [];

function setDetails (details) {
  _details = details;
}

function parseResponse(response) {
  return response;
}

var DetailStore = assign({}, EventEmitter.prototype, {

  emitChange: function () {
    this.emit(CHANGE_EVENT);
  },

  addChangeListener: function (callback) {
    this.on(CHANGE_EVENT, callback);
  },

  removeChangeListener: function (callback) {
    this.removeListener(CHANGE_EVENT, callback);
  },

  getDetails: function () {
    return _details;
  }
});

DetailStore.dispatchToken = Dispatcher.register(function (payload) {
  var action = payload.actionType;
  var response = payload.response;

  switch (action) {
    case RECEIVE_PLAYER_DETAILS:
      setDetails(parseResponse(response));
      break;

    default:
      return true;
  }
  
  DetailStore.emitChange();

  return true;
});

export default DetailStore