// Set global options for all the charts on the page
Highcharts.setOptions({
  chart: {
    borderWidth: 5,
    borderColor: '#e8eaeb',
    borderRadius: 0,
    backgroundColor: '#f7f7f7'
  },
  title: {
    style: {
      fontSize: '1em'
    },
    useHTML: true,
    x: -10,
    y: 8,
    text: '<span class="chart-title"> Grouped categories <span class="chart-href"> <a href="https://blacklabel.net/highcharts/" target="_blank"> Black Label </a> </span> <span class="chart-subtitle">plugin by </span></span>'
  }
});

// Create the main chart (the top of the page)
Highcharts.chart('chart', {
  chart: {
    type: 'column'
  },
  series: [
    {
      data: [4, 14, 18, 5, 6, 5, 14, 15, 18]
    }
  ],
  xAxis: {
    categories: [
      {
        name: 'Fruit',
        categories: ['Apple', 'Banana', 'Orange']
      },
      {
        name: 'Vegetable',
        categories: ['Carrot', 'Potato', 'Tomato']
      },
      {
        name: 'Fish',
        categories: ['Cod', 'Salmon', 'Tuna']
      }
    ]
  }
});

// Create the second chart to showcase basic configuration
Highcharts.chart('chart-basic', {
  chart: {
    type: 'column'
  },
  series: [
    {
      data: [4, 14, 18, 5, 6, 5, 14, 15, 18]
    }
  ],
  xAxis: {
    categories: [
      {
        name: 'Fruit',
        categories: ['Apple', 'Banana', 'Orange']
      },
      {
        name: 'Vegetable',
        categories: ['Carrot', 'Potato', 'Tomato']
      },
      {
        name: 'Fish',
        categories: ['Cod', 'Salmon', 'Tuna']
      }
    ]
  }
});

// Create the third chart to showcase more complex configuration
Highcharts.chart('chart-more', {
  chart: {
    type: 'column'
  },
  series: [
    {
      data: [19, 6, 2, 1, 9, 4, 15, 2, 9, 11, 16, 18]
    }
  ],
  xAxis: {
    categories: [
      {
        name: 'America',
        categories: [
          {
            name: 'USA',
            categories: ['New York', 'San Francisco']
          },
          {
            name: 'Canada',
            categories: ['Toronto', 'Vancouver']
          },
          {
            name: 'Mexico',
            categories: ['Acapulco', 'Leon']
          }
        ]
      },
      {
        name: 'Europe',
        categories: [
          {
            name: 'United Kingdom',
            categories: ['London', 'Liverpool']
          },
          {
            name: 'France',
            categories: ['Paris', 'Marseille']
          },
          {
            name: 'Germany',
            categories: ['Berlin', 'Munich']
          }
        ]
      }
    ]
  }
});
