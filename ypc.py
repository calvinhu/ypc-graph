import nflgame
from flask import jsonify


def get_weeks(year):
  current_year, current_week = nflgame.live.current_year_and_week()
  phase = nflgame.live._cur_season_phase

  if int(year) == int(current_year) and phase == "REG": 
    weeks = [x for x in range(1, current_week+1)] 
  else:
    weeks = [x for x in range(1, 18)]

  return weeks

def get_rusher_stats(ap):
  if ap.playerid in nflgame.players:
    return {
      'id': ap.playerid,
      'name': nflgame.players[str(ap.playerid)].full_name, 
      'team': str(ap.team), 
      'rushing_yds': ap.rushing_yds, 
      'rushing_att': ap.rushing_att, 
      'rushing_tds': ap.rushing_tds + ap.receiving_tds
    }

def get_receiver_stats(ap):
  if ap.playerid in nflgame.players:
    return {
      'id': ap.playerid,
      'name': nflgame.players[ap.playerid].full_name, 
      'team': str(ap.team), 
      'receiving_yds': ap.receiving_yds, 
      'receiving_rec': ap.receiving_rec, 
      'receiving_tds': ap.rushing_tds + ap.receiving_tds
    }

def parse_rushing_play(play, playerid):
  if play.has_player(playerid) and (play.receiving_tar==1 or play.rushing_att==1):
    player_position = nflgame.players[playerid].position
    if play.rushing_att==1:
      play_type = 'RUSH'
    elif play.receiving_rec==1:
      play_type = 'PASS'
    else:
      play_type = 'INCOMPLETE'
    if (player_position == 'QB') and (play_type == 'PASS' or play_type == 'INCOMPLETE'):
      pass
    else:
      result = {
        'type': play_type,
        'yards': play.rushing_yds if play.rushing_att==1 else play.receiving_yds,
        'desc': str(play.desc),
        'down': str(play.down) + ' and ' + str(play.yards_togo),
        'time': str(play.time),
        'position': str(play.yardline),
        'game': str(play.drive.game),
        'week': play.drive.game.schedule['week']
      }
      return result

def parse_receiving_play(play, playerid):
  if play.has_player(playerid) and (play.receiving_tar==1 or play.rushing_att==1):
    player_position = nflgame.players[playerid].position
    if play.rushing_att==1:
      play_type = 'RUSH'
    elif play.receiving_rec==1:
      play_type = 'PASS'
    else:
      play_type = 'INCOMPLETE'
    if (player_position == 'QB') and (play_type == 'PASS' or play_type == 'INCOMPLETE'):
      pass
    else:
      result = {
        'type': play_type,
        'complete': play.receiving_rec,
        'yards': play.rushing_yds if play.rushing_att==1 else play.receiving_yds,
        'yac_yards': play.receiving_yac_yds,
        'desc': str(play.desc),
        'down': str(play.down) + ' and ' + str(play.yards_togo),
        'time': str(play.time),
        'position': str(play.yardline),
        'game': str(play.drive.game),
        'week': play.drive.game.schedule['week']}
      return result

def exists(it):
    return (it is not None)