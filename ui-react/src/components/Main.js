require('styles/main.scss');

import util from '../helpers/util';
import React from 'react';
import ReactDOM from 'react-dom';

import Button from 'react-bootstrap/lib/Button';

import Header from './Header';
import Panel from './Panel';

class AppComponent extends React.Component {
  constructor(props) {
    super(props);
    util._bind(this, 'addPanel');
    this.state = {
      panelCount: 1
    }
  }

  componentDidMount() {
  }

  addPanel() {
    this.setState({
      panelCount: this.state.panelCount + 1
    })
  }

  render() {
    return (
      <div id="container" className="container">
        {[...Array(this.state.panelCount)].map((x, i) =>
          <Panel key={i} id={i} />
        )}
        <Button bsSize="xsmall" bsStyle="primary" onClick={this.addPanel}>Add another graph</Button>
      </div>
    );
  }
}

AppComponent.defaultProps = {
};

export default AppComponent;
