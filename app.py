import os
from flask import Flask, jsonify, render_template, abort, send_from_directory, make_response, request, current_app
from flask.ext.compress import Compress
import nflgame

app = Flask(__name__, static_url_path='/static')
Compress(app)

@app.errorhandler(400)
def custom400(error):
	response = jsonify({'message': error.description})

@app.route('/')
def root():
	return render_template('histogram.html')

@app.route('/rushers')
def rushers():
	return render_template('top.html', type='rushing')

@app.route('/receivers')
def receivers():
	return render_template('top.html', type='receiving')

@app.route('/api/v0/data/<path:filename>')
def send_list(filename):
	return send_from_directory('static/data', filename)

@app.route('/api/v0/weeks/<year>', methods=['GET'])
def weeks(year):
	current_year, current_week = nflgame.live.current_year_and_week()
	weeks = [x for x in range(1, current_week+1)] if int(year) == int(current_year) else [x for x in range(1, 18)]
	return jsonify(result = weeks)

@app.route('/api/v0/toprushers/<year>/<count>', methods=['GET'])
def toprushers(year,count=100):
	try:
		topPlayers = []
		allgames = nflgame.games(int(year))
		allplayers = nflgame.combine_game_stats(allgames)
		for ap in allplayers.rushing().sort('rushing_yds').limit(int(count)):
			topPlayer = {'id': ap.playerid,'name': nflgame.players[ap.playerid].full_name, 'team': str(ap.team), 'rushing_yds': ap.rushing_yds, 'rushing_att': ap.rushing_att}
			topPlayers.append(topPlayer)
		return jsonify(result = topPlayers)
	except (ValueError, KeyError, TypeError):
		abort(400, 'custom error message to appear in body')

@app.route('/api/v0/topreceivers/<year>/<count>', methods=['GET'])
def topreceivers(year,count=100):
	try:
		topPlayers = []
		allgames = nflgame.games(int(year))
		allplayers = nflgame.combine_game_stats(allgames)
		for ap in allplayers.receiving().sort('receiving_yds').limit(int(count)):
			topPlayer = {'id': ap.playerid,'name': nflgame.players[ap.playerid].full_name, 'team': str(ap.team), 'receiving_yds': ap.receiving_yds, 'receiving_rec': ap.receiving_rec}
			topPlayers.append(topPlayer)
		return jsonify(result = topPlayers)
	except (ValueError, KeyError, TypeError):
		abort(400, 'custom error message to appear in body')

@app.route('/api/v0/rushingyards/<playerid>/<team>/<year>', methods=['GET'])
@app.route('/api/v0/rushingyards/<playerid>/<team>/<year>/<week>', methods=['GET'])
def rushingyards(playerid,team,year,week=None):
	try:
		print playerid
		current_year, current_week = nflgame.live.current_year_and_week()
		rushing_yds_per_att = []

		if week:
			weeks = [int(week)]
		else:
			weeks = [x for x in range(1, current_week+1)] if int(year) == int(current_year) else [x for x in range(1, 18)]

		try:
			games = nflgame.games(int(year), week=weeks, home=team, away=team)
		except (ValueError, KeyError, TypeError):
			return jsonify(result = rushing_yds_per_att)

		if games != []:
			allplays = nflgame.combine_plays(games)
			for p in allplays:
				if p.has_player(playerid):
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

@app.route('/api/v0/receivingyards/<playerid>/<team>/<year>', methods=['GET'])
@app.route('/api/v0/receivingyards/<playerid>/<team>/<year>/<week>', methods=['GET'])
def receivingyards(playerid,team,year,week=None):
	try:
		print playerid

		current_year, current_week = nflgame.live.current_year_and_week()
		receiving_yds_per_att = []

		if week:
			weeks = [int(week)]
		else:
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
							'desc': str(p), 
							'down': str(p.down) + ' and ' + str(p.yards_togo), 
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
	resp.headers['Access-Control-Allow-Origin'] = request.headers.get('Origin','*')
#    resp.headers['Access-Control-Allow-Credentials'] = 'false'
	resp.headers['Access-Control-Allow-Methods'] = 'POST, PUT, GET'
	resp.headers['Access-Control-Allow-Headers'] = request.headers.get(
		'Access-Control-Request-Headers', 'Authorization' )
	# set low for debugging
	if app.debug:
		resp.headers['Access-Control-Max-Age'] = '1'
	return resp

###################

if __name__ == '__main__':
	port = int(os.environ.get('PORT',5000))
	app.run(host='0.0.0.0', port=port)
