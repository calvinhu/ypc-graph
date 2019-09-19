import os
import sys
from time import gmtime, strftime
from flask import Flask, jsonify, render_template, abort, request, send_file, Response, send_from_directory, make_response, request, current_app
from flask_compress import Compress
from itertools import *
import nflgame
import logging
from memory_profiler import profile
import ypc

app = Flask(__name__)
Compress(app)

API_ROOT = '/api/v0';
APP_ROOT = os.path.dirname(os.path.abspath(__file__))
APP_STATIC = os.path.join(APP_ROOT, 'static')

@app.errorhandler(400)
def custom400(error):
  response = jsonify({'message': error.description})
  return response

# SSL
CHECK_URL = "/.well-known/acme-challenge/E21iMwAQvH_ezOQTr1PIb-FTWQdhho1Q3KwJc0lpsvo"
@app.route(CHECK_URL)
def check_url():
  return "E21iMwAQvH_ezOQTr1PIb-FTWQdhho1Q3KwJc0lpsvo.c98f0gzyazQulnJchxS6U0wR09DCHc4HutKAPXlEx_8"

# RELOAD NFLGAME
@app.route('/reload')
def reload_nflgame():
  reload(nflgame)
  return render_template('index.html')

@app.route('/update_players')
def update_players():
  import subprocess
  output = subprocess.check_output(['nflgame-update-players'], stderr=subprocess.STDOUT)
  return output

# VIEWS
@app.route('/')
def root():
  return render_template('index.html')

@app.route('/top')
def top():
  return render_template('index.html')

@app.route('/player/<path:path>')
def player(path):
  return render_template('index.html')

# API ROUTES
@app.route(API_ROOT + '/player_name/<id>')
def get_player_name(id):
  if id in nflgame.players:
    return jsonify(result = nflgame.players[id].name)
  else:
    abort(400, {"description": "No such player with the ID: {}".format(id)})

@app.route(API_ROOT + '/data/<path:filename>', methods=['GET'])
def send_list(filename):
  return send_from_directory('static/data', filename)

@app.route(API_ROOT + '/weeks/<year>', methods=['GET'])
def weeks(year):
  return jsonify(result = ypc.get_weeks(year))

@app.route(API_ROOT + '/toprushers/<year>/<count>', methods=['GET'])
def toprushers(year,count=100):
  try:
    weeks = ypc.get_weeks(year)
    plays = nflgame.combine_game_stats(nflgame.games(int(year), weeks)).rushing().sort('rushing_yds').limit(int(count))
    topplayers = imap(ypc.get_rusher_stats, plays)
    return jsonify(result = list(topplayers))
  except Exception as e:
    abort(400, e)

@app.route(API_ROOT + '/topreceivers/<year>/<count>', methods=['GET'])
def topreceivers(year,count=100):
  try:
    weeks = ypc.get_weeks(year)
    plays = nflgame.combine_game_stats(nflgame.games(int(year), weeks)).receiving().sort('receiving_yds').limit(int(count))
    topplayers = imap(ypc.get_receiver_stats, plays)
    return jsonify(result = list(topplayers))
  except Exception as e:
    abort(400, e)

@app.route(API_ROOT + '/rushingyards/<playerid>/<team>/<year>', methods=['GET'])
@app.route(API_ROOT + '/rushingyards/<playerid>/<team>/<year>/<week>', methods=['GET'])
def rushingyards(playerid, team, year, week=None):
  try:
    if week:
      weeks = [int(week)]
    else:
      weeks = ypc.get_weeks(year)
    games = nflgame.games(int(year), week=weeks, home=team, away=team)
    if games != []:
      all_plays = nflgame.combine_plays(games)
      rushing_yds_per_att = list(ifilter(ypc.exists, imap(lambda x:ypc.parse_rushing_play(x,playerid), all_plays)))
    return jsonify(result = rushing_yds_per_att)
  except Exception as e:
    app.logger.error("error: {}".format(e))
    return jsonify(result = [])

@app.route(API_ROOT + '/receivingyards/<playerid>/<team>/<year>', methods=['GET'])
@app.route(API_ROOT + '/receivingyards/<playerid>/<team>/<year>/<week>', methods=['GET'])
def receivingyards(playerid,team,year,week=None):
  try:
    if week:
      weeks = [int(week)]
    else:
      weeks = ypc.get_weeks(year)
    games = nflgame.games(int(year), week=weeks, home=team, away=team)
    if games != []:
      all_plays = nflgame.combine_plays(games)
      receiving_yds_per_att = list(ifilter(ypc.exists, imap(lambda x:ypc.parse_receiving_play(x,playerid), all_plays)))

    return jsonify(result = receiving_yds_per_att)
  except Exception as e:
    app.logger.error("error: {}".format(e))
    return jsonify(result = [])

@app.after_request
def add_cors(resp):
  """ Ensure all responses have the CORS headers. This ensures any failures are also accessible
    by the client. """
  resp.headers['Accept-Ranges'] = 'bytes'
  resp.headers['Last-Modified'] = strftime("%a, %d %b %Y %X GMT", gmtime())
  resp.headers['Access-Control-Allow-Origin'] = request.headers.get('Origin','*')
  resp.headers['Access-Control-Allow-Methods'] = 'POST, PUT, GET'
  resp.headers['Access-Control-Allow-Headers'] = request.headers.get(
    'Access-Control-Request-Headers', 'Authorization' )
  if app.debug:
    resp.headers['Access-Control-Max-Age'] = '432000000'
  return resp

###################

def main():
  port = int(os.environ.get('PORT',5000))
  app.debug = True
  app.run(host='0.0.0.0', port=port)

if __name__ != '__main__':
  gunicorn_logger = logging.getLogger('gunicorn.error')
  app.logger.handlers = gunicorn_logger.handlers
  app.logger.setLevel(gunicorn_logger.level)

if __name__ == '__main__':
  main()
