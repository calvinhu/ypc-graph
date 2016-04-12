import Api from '../helpers/api';
import Dispatcher from '../dispatcher/AppDispatcher';
import {RECEIVE_PLAYER_LIST,RECEIVE_PLAYER_DETAILS} from '../constants/ActionTypes';

const API_ROOT = 'http://localhost:5000/'
var ActionCreator = {
  getPlayerList: function (year,type) {
    Api
      .get(API_ROOT + 'api/v0/data/' + year + '/' + type + '.json')
      .then(function (response) {
        // Dispatch an action containing the categories.
        Dispatcher.dispatch({
          actionType: RECEIVE_PLAYER_LIST,
          players: response.result
        });
      })
  },

  getDetails: function (playerObject) {
    var url;
    if (playerObject.week) {
      url = API_ROOT + 'api/v0/' + playerObject.type + 'yards/' + playerObject.playerID + '/' + playerObject.playerTeam + '/' + playerObject.year + '/' + playerObject.week;
    } else {
      url = API_ROOT + 'api/v0/' + playerObject.type + 'yards/' + playerObject.playerID + '/' + playerObject.playerTeam + '/' + playerObject.year;
    }
    Api
      .get(url)
      .then(function (response) {
        // Dispatch an action containing the categories.
        Dispatcher.dispatch({
          actionType: RECEIVE_PLAYER_DETAILS,
          response: response
        });
      })
  }
};

export default ActionCreator