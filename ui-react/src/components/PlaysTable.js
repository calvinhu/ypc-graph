import util from '../helpers/util';
import {PASS,RUSH,INCOMPLETE} from '../constants/StatCategories';
import React from 'react';

import {BootstrapTable, TableHeaderColumn, TableDataSet} from 'react-bootstrap-table';

class PlaysTableComponent extends React.Component {

  constructor(props) {
    super(props);
    util._bind(this, 'makeConfig', 'updateTable');
    this.state = {
    }
  }

  makeConfig(response) {
    var result = response.result;
    result.map((item,index) => {
      item['id'] = index
    });
    return result;
  }

  componentDidMount() {
    setTimeout(()=> {this.refs.table._adjustHeaderWidth()}, 500);
  }

  updateTable(data) {
    this.setState({
    }, () => {
    });
  }

  render() {
    function weekSort(a,b,order) {
      if (order == 'desc') {
        return a['id'] > b['id'] ? -1 : ((a['id'] < b['id']) ? 1 : 0);
      } else {
        return a['id'] < b['id'] ? -1 : ((a['id'] > b['id']) ? 1 : 0);
      }
    }

    function yardsFormatter(cell,row) {
      if (row.type == INCOMPLETE) {
        return ''
      } else {
        return cell
      }
    }

    function descriptionFormatter(cell,row) {
      var re = /^\(.*?\)/;
      return cell.replace(re,'')
    }

    function assignColor(rowData,rowIndex) {
      var color;
      if (parseInt(rowData.yards) < 0) {
        color = 'danger';
      } else if (rowData.type === RUSH) {
        color = 'info';
      } else if (rowData.type === PASS) {
        color = 'success';
      } else if (rowData.type === INCOMPLETE) {
        color = 'active';
      } else {
        color = 'default'
      }
      return color;
    }

    return (
      <div className="playsContainer">
        <BootstrapTable
          ref="table"
          data={this.makeConfig(this.props.response)}
          columnFilter={false}
          bordered={false}
          condensed={true}
          height="40vh"
          className="playsTable"
          trClassName={assignColor}
        >
          <TableHeaderColumn dataField="id" isKey={true} hidden={true}>ID</TableHeaderColumn>
          <TableHeaderColumn dataField="week" dataSort={true} sortFunc={weekSort} >Week</TableHeaderColumn>
          <TableHeaderColumn dataField="game">Game</TableHeaderColumn>
          <TableHeaderColumn dataField="time">Time</TableHeaderColumn>
          <TableHeaderColumn dataField="type">Type</TableHeaderColumn>
          <TableHeaderColumn dataField="yards" dataSort={true} dataFormat={yardsFormatter}>Yards</TableHeaderColumn>
          <TableHeaderColumn dataField="desc" columnClassName="playDescription" dataFormat={descriptionFormatter}>Description</TableHeaderColumn>
        </BootstrapTable>
      </div>
    );
  }
}


PlaysTableComponent.propTypes = {
};
PlaysTableComponent.defaultProps = {
  response: null
};



export default PlaysTableComponent;
