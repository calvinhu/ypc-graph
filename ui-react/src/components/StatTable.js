import util from '../helpers/util';
import apiParser from '../helpers/apiParser';
import {RUSHING,RECEIVING} from '../constants/StatCategories';
import React from 'react';

import {BootstrapTable, TableHeaderColumn} from 'react-bootstrap-table';

import Input from 'react-bootstrap/lib/Input';

class StatTableComponent extends React.Component {

  constructor(props) {
    super(props);
    util._bind(this, 'makeConfig', 'updateTable');
    this.state = {
    }
  }

  makeConfig(response) {
    var data;
    switch (this.props.type) {
      case RUSHING:
        data = apiParser.makeRushingStats(response);
        break;
      case RECEIVING:
        data = apiParser.makeReceivingStats(response);
        break;
      default:
        data = apiParser.makeRushingStats(response);
    }
    
    var result = []
    for(var key in data) {
      if(data.hasOwnProperty(key)) {
        result.push(
          {
            metric: key,
            value: data[key]
          }
        )
      }
    }

    return result
  }

  componentDidMount() {
  }

  updateTable(data) {
    this.setState({
    }, () => {
    });
  }

  render() {
    function numberFormatter(cell, row){
      return cell >=1000 ? util.addCommas(cell) : cell
    }

    return (
      <div className="stats-container">
        <BootstrapTable
          data={this.makeConfig(this.props.response)}
          striped={true}
          bordered={false}
          condensed={true}
        >
          <TableHeaderColumn dataField="metric" isKey={true}>Metric</TableHeaderColumn>
          <TableHeaderColumn dataField="value" align="right" dataAlign="right" dataFormat={numberFormatter}>Value</TableHeaderColumn>
        </BootstrapTable>
      </div>
    );
  }
}



StatTableComponent.propTypes = {
};
StatTableComponent.defaultProps = {
  response: null,
  type: RUSHING
};



export default StatTableComponent;
