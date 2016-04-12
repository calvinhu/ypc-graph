import {Promise} from 'es6-promise'
import Request from 'superagent'

var Api = {
  get: function (url) {
    return new Promise(function (resolve, reject) {
      Request
        .get(url)
        .end(function (err,res) {
          if (res.status === 404) {
            reject();
          } else {
            resolve(JSON.parse(res.text));
          }
      });
    });
  }
};

export default Api;