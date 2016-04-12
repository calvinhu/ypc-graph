import util from '../helpers/util';
import React from 'react';

import ActionCreator from '../actions/ActionCreator';
import DetailStore from '../stores/DetailStore';

import PlayerForm from './PlayerForm'
import Graph from './Graph'
import PlaysTable from './PlaysTable'
import StatTable from './StatTable'

import Col from 'react-bootstrap/lib/Col';
import Row from 'react-bootstrap/lib/Row';

class PanelComponent extends React.Component {

  constructor(props) {
    super(props);
    util._bind(this, '_onFormChange', '_onChange');
    this.state = {
      loading: false,
      playerObject: null,
      playerDetails: null
    }
  }

  _onFormChange(input) {
    this.setState({
      playerObject: input,
      loading: true
    },
      () => {
        ActionCreator.getDetails(this.state.playerObject);
      });
  }

  componentWillMount() {
    DetailStore.addChangeListener(this._onChange);
  }

  componentWillUnmount() {
    DetailStore.removeChangeListener(this._onChange);
  }

  _onChange() {
    var newDetails = DetailStore.getDetails()
    this.setState({
      playerDetails: newDetails,
      loading: false
    },
      () => {
      });
  }

  render() {
    var graphWithData = this.state.playerDetails ? <Graph response={this.state.playerDetails} /> : null
    var statsWithData = this.state.playerDetails ? <StatTable response={this.state.playerDetails} type={this.state.playerObject.type}/> : null
    var playsWithData = this.state.playerDetails ? <PlaysTable response={this.state.playerDetails} /> : null

    return (
      <div className="panel-container">
        {this.state.loading ? <div className='overlay'><div className='spinner'></div></div> : null }
        <Row>
          <Col sm={12}>
            <h3 className="player-name pull-left">{this.state.playerObject ? this.state.playerObject.playerName + ' (' + this.state.playerObject.playerTeam + ')' : ''}</h3>
            <PlayerForm updatePanel={this._onFormChange} players={this.state.players}/>
          </Col>
        </Row>
        <Row >
          <Col sm={10} xs={12} xsOffset={0} smOffset={0} className="scrollable-container">
            {graphWithData}
          </Col>
          <Col sm={2} xs={8} xsOffset={2} smOffset={0} >
            {statsWithData}
          </Col>
        </Row>
        <Row>
          <Col sm={12}>
            {playsWithData}
          </Col>
        </Row>
      </div>
    );
  }
}

PanelComponent.propTypes = {
};
PanelComponent.defaultProps = {
};



export default PanelComponent;
