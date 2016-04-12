import util from '../helpers/util';
import React from 'react';

import Navbar from 'react-bootstrap/lib/Navbar';

class HeaderComponent extends React.Component {
  constructor(props) {
    super(props);
    util._bind(this, 'updateView', 'onChange');
    this.state = {
    }
  }

  updateView(value) {
    this.setState({
      currentView: value
    })
  }

  onChange(value,e,tab) {
    this.updateView(value)
  }

  render() {
    return (
      <Navbar fixedTop fluid={true}>
        <Navbar.Header>
          <Navbar.Brand>
            <a href="#">YPC Graph</a>
          </Navbar.Brand>
          <Navbar.Toggle />
        </Navbar.Header>
        <Navbar.Collapse>
          <Navbar.Text>
          <Navbar.Link eventKey={1} href="#">Histogram</Navbar.Link>
          </Navbar.Text>
          <Navbar.Text>
          <Navbar.Link eventKey={2} href="#">Statistics</Navbar.Link>
          </Navbar.Text>
        </Navbar.Collapse>
      </Navbar>
    );
  }
}

HeaderComponent.defaultProps = {
};

export default HeaderComponent;
