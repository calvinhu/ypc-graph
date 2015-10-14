import nflgame
import os
from flask import Flask
from flask import jsonify
from flask import render_template
from flask import abort
app = Flask(__name__, static_url_path='/static')

from datetime import timedelta
from flask import make_response, request, current_app
from functools import update_wrapper


def crossdomain(origin=None, methods=None, headers=None, max_age=21600, attach_to_all=True, automatic_options=True):
	if methods is not None:
		methods = ', '.join(sorted(x.upper() for x in methods))
	if headers is not None and not isinstance(headers, basestring):
		headers = ', '.join(x.upper() for x in headers)
	if not isinstance(origin, basestring):
		origin = ', '.join(origin)
	if isinstance(max_age, timedelta):
		max_age = max_age.total_seconds()

	def get_methods():
		if methods is not None:
			return methods

		options_resp = current_app.make_default_options_response()
		return options_resp.headers['allow']

	def decorator(f):
		def wrapped_function(*args, **kwargs):
			if automatic_options and request.method == 'OPTIONS':
				resp = current_app.make_default_options_response()
			else:
				resp = make_response(f(*args, **kwargs))
			if not attach_to_all and request.method != 'OPTIONS':
				return resp

			h = resp.headers
			h['Access-Control-Allow-Origin'] = origin
			h['Access-Control-Allow-Methods'] = get_methods()
			h['Access-Control-Max-Age'] = str(max_age)
			h['Access-Control-Allow-Credentials'] = 'true'
			h['Access-Control-Allow-Headers'] = \
				"Origin, X-Requested-With, Content-Type, Accept, Authorization"
			if headers is not None:
				h['Access-Control-Allow-Headers'] = headers
			return resp

		f.provide_automatic_options = False
		return update_wrapper(wrapped_function, f)
	return decorator

@app.errorhandler(400)
def custom400(error):
	response = jsonify({'message': error.description})

@app.route('/')
def root():
	return render_template('index.html')

@app.route('/api/v0/weeks/<year>', methods=['GET'])
@crossdomain(origin='*')
def weeks(year):
	current_year, current_week = nflgame.live.current_year_and_week()
	weeks = [x for x in range(1, current_week+1)] if int(year) == int(current_year) else [x for x in range(1, 17)]
	return jsonify(result = weeks)


@app.route('/api/v0/toprushers/<count>', methods=['GET'])
@crossdomain(origin='*')
def toprushers(count):
	try:
		topPlayers = []
		allgames = nflgame.games(2015)
		allplayers = nflgame.combine_game_stats(allgames)
		for ap in allplayers.rushing().sort('rushing_yds').limit(int(count)):
			topPlayer = {'id': ap.playerid,'name': nflgame.players[ap.playerid].full_name, 'team': str(ap.team)}
			topPlayers.append(topPlayer)
		return jsonify(result = topPlayers)
	except (ValueError, KeyError, TypeError):
		abort(400, 'custom error message to appear in body')

@app.route('/api/v0/topreceivers/<count>', methods=['GET'])
@crossdomain(origin='*')
def topreceivers(count):
	try:
		topPlayers = []
		allgames = nflgame.games(2015)
		allplayers = nflgame.combine_game_stats(allgames)
		for ap in allplayers.receiving().sort('receiving_yds').limit(int(count)):
			topPlayer = {'id': ap.playerid,'name': nflgame.players[ap.playerid].full_name, 'team': str(ap.team)}
			topPlayers.append(topPlayer)
		return jsonify(result = topPlayers)
	except (ValueError, KeyError, TypeError):
		abort(400, 'custom error message to appear in body')

@app.route('/api/v0/rushingyards/<year>/<playerid>', methods=['GET'])
@crossdomain(origin='*')
def rushingyards(year,playerid):
	try:
		print playerid

		current_year, current_week = nflgame.live.current_year_and_week()
		weeks = [x for x in range(1, current_week+1)] if int(year) == int(current_year) else [x for x in range(1, 17)]
		current_player = nflgame.players[playerid]
		current_playerid = current_player.playerid
		current_team = current_player.team

		games = nflgame.games(int(year), week=weeks, home=current_team, away=current_team)

		rushing_yds_per_att = []

		allplays = nflgame.combine_plays(games)

		for p in allplays:
			if p.has_player(current_playerid):
				if (p.receiving_tar==1) or (p.rushing_att==1):
					if p.rushing_att==1:
						type = 'RUSH'
					elif p.receiving_rec==1:
						type = 'PASS'
					else:
						type = 'INCOMPLETE'
					play = {
						'type': type, 
						'yards': p.rushing_yds if p.rushing_att==1 else p.receiving_yds, 
						'desc': str(p), 
						'down': str(p.down) + ' and ' + str(p.yards_togo), 
						'game': str(p.drive.game), 
						'week': p.drive.game.schedule['week']
					}
					rushing_yds_per_att.append(play)

		return jsonify(result = rushing_yds_per_att)
	except (ValueError, KeyError, TypeError):
		abort(400, 'custom error message to appear in body')

@app.route('/api/v0/receivingyards/<year>/<playerid>', methods=['GET'])
@crossdomain(origin='*')
def receivingyards(year,playerid):
	try:
		print playerid

		current_year, current_week = nflgame.live.current_year_and_week()
		weeks = [x for x in range(1, current_week+1)] if int(year) == int(current_year) else [x for x in range(1, 17)]
		current_player = nflgame.players[playerid]
		current_playerid = current_player.playerid
		current_team = current_player.team

		games = nflgame.games(int(year), week=weeks, home=current_team, away=current_team)

		receiving_yds_per_att = []

		allplays = nflgame.combine_plays(games)

		for p in allplays:
			if p.has_player(current_playerid):
				if (p.receiving_tar==1) or (p.rushing_att==1):
					if p.rushing_att==1:
						type = 'RUSH'
					elif p.receiving_rec==1:
						type = 'PASS'
					else:
						type = 'INCOMPLETE'
					play = {
						'type': type,
						'complete': p.receiving_rec,
						'yards': p.rushing_yds if p.rushing_att==1 else p.receiving_yds, 
						'yac_yards': p.receiving_yac_yds, 
						'desc': str(p), 
						'down': str(p.down) + ' and ' + str(p.yards_togo), 
						'game': str(p.drive.game), 
						'week': p.drive.game.schedule['week']}
					receiving_yds_per_att.append(play)

		return jsonify(result = receiving_yds_per_att)
	except (ValueError, KeyError, TypeError):
		abort(400, 'custom error message to appear in body')

###################

if __name__ == '__main__':
	port = int(os.environ.get('PORT',5000))
	app.run(host='0.0.0.0', port=port)
