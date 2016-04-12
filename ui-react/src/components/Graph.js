import util from '../helpers/util';
import apiParser from '../helpers/apiParser';

import React from 'react';

import ReactHighcharts from 'react-highcharts/bundle/highcharts';

class GraphComponent extends React.Component {

  constructor(props) {
    super(props);
    util._bind(this, 'makeConfig', 'updateGraph', 'resizeChart');
    this.state = {
    }
  }

  makeConfig(response) {
    var data = apiParser.makeGraphData(response);
    return {
      credits: {
        enabled: false
      },
      chart: {
        type: 'column',
        spacingBottom: 0,
        marginLeft: 25,
        height: 250,
        style: {
            fontFamily: '"San Francisco", "HelveticaNeue", "Helvetica Neue", Helvetica, Arial, sans-serif'
        }
      },
      title: {
        text: '',
        floating: true,
        x: -20 //center
      },
      yAxis: {
        title: {
          text: ''
        },
        allowDecimals: false,
        gridLineWidth: 0,
        minorGridLineWidth: 0,
        lineColor: 'transparent',
        min: 0,
        x: -50,
        offset: -5,
        stackLabels: {
          formatter() {
            return this.total == 0 ? '' : this.total;
          },
          enabled: true
        }
      },
      xAxis: {
        title: {
          text: 'yards per attempt'
        },
        allowDecimals: false,
        plotBands: [
          {
            color: '#f2dede',
            from: -5.5,
            to: -0.5
          },
          {
            color: '#f9f9f9',
            from: -0.5,
            to: 50.5
          }
        ],
        min: -5,
        max: 50,
        minPadding: 0,
        maxPadding: 0,
        tickInterval: 5,
        minorTickInterval: 1,
        minorTickLength: 5,
        minorGridLineWidth: 0,
        minorTickWidth: 1
      },
      legend: {
        layout: 'vertical',
        align: 'right',
        verticalAlign: 'top',
        borderWidth: 0,
        floating: true
      },
      tooltip: {
        formatter() {
          if (this.points[0].total == 0) {
            return false;
          } else {
            var s = '<b>' + this.x + ' Yard Plays</b>';

            this.points.forEach((item) => {
              s += '<br/>' + item.y+ ' ' +
                item.series.name;
            });

            s += '<br/>' + this.points[0].total + ' Total plays'

            return s;
          }
        },
        shadow: false,
        shared: true
      },
      plotOptions: {
        column: {
          groupPadding: 0,
          pointPadding: 0,
          borderWidth: 1,
          shadow: false
          
        },
        series: {
          stacking: 'normal'
        }
      },
      series: data
    }
  }

  componentDidMount() {
    function modifyLabels() {
      let chart = this.refs.chart.getChart();
      let min = chart.xAxis[0].min;
      let max = chart.xAxis[0].max;

      let xAxisLabels = [];
      for (let i=min ; i<=max ; i++) {
        if (i==min || i==max) {
          xAxisLabels.push(i)
        } else {
          xAxisLabels.push(i)
        }
      }
      chart.xAxis[0].setCategories(xAxisLabels)
    }

    // modifyLabels.bind(this)();
    this.resizeChart();
    // setTimeout(function() {self.resizeChart()}, 1000)
  }

  shouldComponentUpdate(nextProps, nextState) {
    return nextProps.response !== this.props.response;
  }

  resizeChart() {
    let chart = this.refs.chart.getChart();
    chart.reflow();
  }

  updateGraph(data) {
    this.setState({
    }, () => {
    });
  }

  render() {
    return (
      <div className="graph-container">
        <ReactHighcharts config={this.makeConfig(this.props.response)} isPureConfig={true} ref="chart" />
      </div>
    );
  }
}


GraphComponent.propTypes = {
};
GraphComponent.defaultProps = {
  response: null
};



export default GraphComponent;
