import util from '../helpers/util';
import React from 'react';
import ActionCreator from '../actions/ActionCreator';
import PlayerStore from '../stores/PlayerStore';
import {RUSHING,RECEIVING} from '../constants/StatCategories';

import Input from 'react-bootstrap/lib/Input';

class PlayerFormComponent extends React.Component {

  constructor(props) {
    super(props);
    util._bind(this, 'handleYearChange', 'handleTypeChange', 'handlePlayerChange', 'handleWeekChange', 'submit', '_onChange');
    this.state = {
      year: '2015',
      type: RUSHING,
      week: null,
      playerID: null,
      playerName: null,
      playerTeam: null,
      players: []
    }
  }

  componentWillMount() {
    PlayerStore.addChangeListener(this._onChange);
  }

  componentDidMount() {
    ActionCreator.getPlayerList(this.state.year, this.state.type);
  }

  componentWillUnmount() {
    PlayerStore.removeChangeListener(this._onChange);
  }

  handleYearChange(event) {
    this.setState(
      {
        year: event.target.value
      },
      () => {
        ActionCreator.getPlayerList(this.state.year, this.state.type);
      });
  }

  handleTypeChange(event) {
    this.setState(
      {
        type: event.target.value
      },
      () => {
        ActionCreator.getPlayerList(this.state.year, this.state.type);
      });
  }

  handleWeekChange(event) {
    this.setState(
      {
        week: event.target.value
      },
      () => {
        if (this.state.playerID !== null) {
          this.submit();
        }
      });
  }

  handlePlayerChange(event) {
    this.setState({
      playerID: event.target.value,
      playerName: event.target.selectedOptions[0].dataset.name,
      playerTeam: event.target.selectedOptions[0].dataset.team
    }, () => {
      this.submit();
    });
  }

  _onChange() {
    var newPlayerList = PlayerStore.getPlayerList()
    this.setState({
      players: newPlayerList
    });
  }

  submit() {
    var playerObject = {
      year: this.state.year,
      type: this.state.type,
      week: this.state.week,
      playerID: this.state.playerID,
      playerName: this.state.playerName,
      playerTeam: this.state.playerTeam
    }
    this.props.updatePanel(playerObject)
  }

  render() {
    return (
      <form className="player-bar pull-right">
        <div className="pull-left input-container">
          <Input type="select" ref="inputYear" className="form-control" defaultValue={this.state.year} onChange={this.handleYearChange}>
            <option value="2015">2015</option>
            <option value="2014">2014</option>
            <option value="2013">2013</option>
            <option value="2012">2012</option>
          </Input>
          <Input type="select" ref="inputWeek" className="form-control" defaultValue={this.state.week} onChange={this.handleWeekChange}>
              <option value="">ALL</option>
              {[...Array(16)].map((x, i) =>
                <option key={i + 1} value={i + 1}>Week {i + 1}</option>
              )}
          </Input>
        </div>
        <div className="pull-left input-container">
          <Input type="select" ref="inputType" className="form-control" defaultValue={this.state.type} onChange={this.handleTypeChange}>
            <option value={RUSHING}>Rush</option>
            <option value={RECEIVING}>Receive</option>
          </Input>
        </div>
        <div className="pull-left input-container">
          <Input type="select" ref="inputPlayer" className="form-control" defaultValue="NONE" onChange={this.handlePlayerChange}>
            <option value="NONE" >Select a Player</option>
            {
              this.state.players.map((item) => {
                return <optgroup key={item.team} label={item.team}>
                  {
                    item.players.map((item) => {
                      return <option key={item.id} label={item.name + ' (' + item.team + ')'} data-team={item.team} data-name={item.name} value={item.id}></option>
                    })
                  }
                </optgroup>
              })
            }
          </Input>
        </div>
      </form>
    );
  }
}

PlayerFormComponent.propTypes = {
};
PlayerFormComponent.defaultProps = {
};

export default PlayerFormComponent
