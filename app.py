import os
from time import gmtime, strftime
from flask import Flask, jsonify, render_template, abort, request, send_file, Response, send_from_directory, make_response, request, current_app
from flask_compress import Compress
import re
import mimetypes
import nflgame

app = Flask(__name__)
Compress(app)

API_ROOT = '/api/v0';
APP_ROOT = os.path.dirname(os.path.abspath(__file__))
APP_STATIC = os.path.join(APP_ROOT, 'static')

@app.errorhandler(400)
def custom400(error):
	response = jsonify({'message': error.description})

# VIEWS
@app.route('/')
def root():
	return render_template('index.html')

@app.route('/top')
def rushers():
	return render_template('index.html')

# API ROUTES

def send_file_206(path, safe_name):
	range_header = request.headers.get('Range', None)
	if not range_header:
		return send_from_directory('static/img', safe_name)

	size = os.path.getsize(path)
	byte1, byte2 = 0, None

	m = re.search('(\d+)-(\d*)', range_header)
	g = m.groups()

	if g[0]: byte1 = int(g[0])
	if g[1]: byte2 = int(g[1])

	length = size - byte1
	if byte2 is not None:
		length = byte2 - byte1

	data = None
	with open(path, 'rb') as f:
		f.seek(byte1)
		data = f.read(length)

	rv = Response(data,
		206,
		mimetype=mimetypes.guess_type(path)[0],
		direct_passthrough=True)
	rv.headers.add('Content-Range', 'bytes {0}-{1}/{2}'.format(byte1, byte1 + length - 1, size))
	rv.headers.add('Cache-Control', 'public,max-age=86400')
	return rv

@app.route(API_ROOT + '/stream/<path:filename>', methods=['GET'])
def show(filename):
	path_to_video = APP_STATIC + '/img/' + filename
	return send_file_206(path_to_video,filename)


@app.route(API_ROOT + '/data/<path:filename>', methods=['GET'])
def send_list(filename):
	return send_from_directory('static/data', filename)

@app.route(API_ROOT + '/weeks/<year>', methods=['GET'])
def weeks(year):
	current_year, current_week = nflgame.live.current_year_and_week()
	weeks = [x for x in range(1, current_week+1)] if int(year) == int(current_year) else [x for x in range(1, 18)]
	return jsonify(result = weeks)

@app.route(API_ROOT + '/toprushers/<year>/<count>', methods=['GET'])
def toprushers(year,count=100):
	try:
		topPlayers = []
		allgames = nflgame.games(int(year))
		allplayers = nflgame.combine_game_stats(allgames)
		for ap in allplayers.rushing().sort('rushing_yds').limit(int(count)):
			topPlayer = {
				'id': ap.playerid,
				'name': nflgame.players[ap.playerid].full_name, 
				'team': str(ap.team), 
				'rushing_yds': ap.rushing_yds, 
				'rushing_att': ap.rushing_att, 
				'rushing_tds': ap.rushing_tds
			}
			topPlayers.append(topPlayer)
		return jsonify(result = topPlayers)
	except (ValueError, KeyError, TypeError):
		abort(400, 'custom error message to appear in body')

@app.route(API_ROOT + '/topreceivers/<year>/<count>', methods=['GET'])
def topreceivers(year,count=100):
	try:
		topPlayers = []
		allgames = nflgame.games(int(year))
		allplayers = nflgame.combine_game_stats(allgames)
		for ap in allplayers.receiving().sort('receiving_yds').limit(int(count)):
			topPlayer = {
				'id': ap.playerid,
				'name': nflgame.players[ap.playerid].full_name, 
				'team': str(ap.team), 
				'receiving_yds': ap.receiving_yds, 
				'receiving_rec': ap.receiving_rec, 
				'receiving_tds': ap.receiving_tds
			}
			topPlayers.append(topPlayer)
		return jsonify(result = topPlayers)
	except (ValueError, KeyError, TypeError):
		abort(400, 'custom error message to appear in body')

@app.route(API_ROOT + '/rushingyards/<playerid>/<team>/<year>', methods=['GET'])
@app.route(API_ROOT + '/rushingyards/<playerid>/<team>/<year>/<week>', methods=['GET'])
def rushingyards(playerid,team,year,week=None):
	try:
		rushing_yds_per_att = []
		current_year = 2016
		current_week = 17
		if week:
			weeks = [int(week)]
		else:
			current_year, current_week = nflgame.live.current_year_and_week()
			weeks = [x for x in range(1, current_week+1)] if int(year) == int(current_year) else [x for x in range(1, 18)]
			print "current weeks"
			print weeks

		try:
			games = nflgame.games(int(year), week=weeks, home=team, away=team)
		except (ValueError, KeyError, TypeError):
			print "FAILED"
			return jsonify(result = rushing_yds_per_att)

		if games != []:
			allplays = nflgame.combine_plays(games)
			player_position = nflgame.players[playerid].position
			for p in allplays:
				if p.has_player(playerid):
					if (p.receiving_tar==1) or (p.rushing_att==1):
						if p.rushing_att==1:
							type = 'RUSH'
						elif p.receiving_rec==1:
							type = 'PASS'
						else:
							type = 'INCOMPLETE'
						if (player_position == 'QB') and (type == 'PASS' or type == 'INCOMPLETE'):
							pass
						else:
							play = {
								'type': type, 
								'yards': p.rushing_yds if p.rushing_att==1 else p.receiving_yds, 
								# 'desc': str(re.sub(r'\([^)]*\)', '', p.desc)), 
								'desc': str(p.desc), 
								'down': str(p.down) + ' and ' + str(p.yards_togo),
								'time': str(p.time),
								'position': str(p.yardline),
								'game': str(p.drive.game), 
								'week': p.drive.game.schedule['week']
							}
							rushing_yds_per_att.append(play)
		else:
			print "EMPTY"
		return jsonify(result = rushing_yds_per_att)
	except (ValueError, KeyError, TypeError):
		abort(400, 'custom error message to appear in body')

@app.route(API_ROOT + '/receivingyards/<playerid>/<team>/<year>', methods=['GET'])
@app.route(API_ROOT + '/receivingyards/<playerid>/<team>/<year>/<week>', methods=['GET'])
def receivingyards(playerid,team,year,week=None):
	try:
		receiving_yds_per_att = []
		current_year = 2016
		current_week = 17
		if week:
			weeks = [int(week)]
		else:
			current_year, current_week = nflgame.live.current_year_and_week()
			weeks = [x for x in range(1, current_week+1)] if int(year) == int(current_year) else [x for x in range(1, 18)]

		try:
			games = nflgame.games(int(year), week=weeks, home=team, away=team)
		except (ValueError, KeyError, TypeError):
			return jsonify(result = receiving_yds_per_att)

		if games != []:
			allplays = nflgame.combine_plays(games)
			for p in allplays:
				if p.has_player(playerid):
					if (p.receiving_tar==1):
						if p.receiving_rec==1:
							type = 'PASS'
						else:
							type = 'INCOMPLETE'
						play = {
							'type': type,
							'complete': p.receiving_rec,
							'yards': p.receiving_yds, 
							'yac_yards': p.receiving_yac_yds, 
							'desc': str(p.desc), 
							'down': str(p.down) + ' and ' + str(p.yards_togo), 
							'time': str(p.time),
							'position': str(p.yardline),
							'game': str(p.drive.game), 
							'week': p.drive.game.schedule['week']}
						receiving_yds_per_att.append(play)

		return jsonify(result = receiving_yds_per_att)
	except (ValueError, KeyError, TypeError):
		abort(400, 'custom error message to appear in body')

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

if __name__ == '__main__':
	port = int(os.environ.get('PORT',5000))
	app.debug = True
	app.run(host='0.0.0.0', port=port)
