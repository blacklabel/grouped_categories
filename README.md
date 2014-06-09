<script src="http://code.jquery.com/jquery-1.9.1.min.js"></script>
<script src="http://code.highcharts.com/highcharts.js"></script>
<script src="./grouped-categories.js"></script>

# Grouped Categories - Highcharts module

Go to project page to see this module in action: [http://blacklabel.github.io/grouped_categories/](http://blacklabel.github.io/grouped_categories/)


<div id="chart" style="height: 300px"></div>
<script>
window.chart = new Highcharts.Chart({
    chart: {
        renderTo: "chart",
        type: "column"
    },
    series: [{
        data: [4, 14, 18, 5, 6, 5, 14, 15, 18]
    }],
    xAxis: {
        categories: [{
            name: "Fruit",
            categories: ["Apple", "Banana", "Orange"]
        }, {
            name: "Vegetable",
            categories: ["Carrot", "Potato", "Tomato"]
        }, {
            name: "Fish",
            categories: ["Cod", "Salmon", "Tuna"]
        }]
    }
});
</script>

### Requirements

* Plugin requires the latest Highcharts (tested with 2.3.5)

### Installation

* Like any other Highcharts module (e.g. exporting), add `<script>` tag pointing to `grouped-categories.js` below Highcharts script tag.

### Usage and demos

It's quite simple and intuitive, just pass object as category:

```
xAxis: {
    categories: [{
        name: "Fruit",
        categories: ["Apple", "Banana", "Orange"]
    }, {
        name: "Vegetable",
        categories: ["Carrot", "Potato", "Tomato"]
    }, {
        name: "Fish",
        categories: ["Cod", "Salmon", "Tuna"]
    }]
}
```

<div id="chart-basic" style="height: 300px"></div>
<script>
window.chart = new Highcharts.Chart({
    chart: {
        renderTo: "chart-basic",
        type: "column"
    },
    series: [{
        data: [4, 14, 18, 5, 6, 5, 14, 15, 18]
    }],
    xAxis: {
        categories: [{
            name: "Fruit",
            categories: ["Apple", "Banana", "Orange"]
        }, {
            name: "Vegetable",
            categories: ["Carrot", "Potato", "Tomato"]
        }, {
            name: "Fish",
            categories: ["Cod", "Salmon", "Tuna"]
        }]
    }
});
</script>



You can also define more category levels:

```
xAxis: {
    categories: [{
        name: "America",
        categories: [{
            name: "USA",
            categories: ["New York", "San Francisco"]
        }, {
            name: "Canada",
            categories: ["Toronto", "Vancouver"]
        }, {
            name: "Mexico",
            categories: ["Acapulco", "Leon"]
        }]
    }, {
        name: "Europe",
        categories: [{
            name: "United Kingdom",
            categories: ["London", "Liverpool"]
        }, {
            name: "France",
            categories: ["Paris", "Marseille"]
        }, {
            name: "Germany",
            categories: ["Berlin", "Munich"]
        }]
    }]
}
```

<div id="chart-more" style="height: 300px;"></div>
<script>
window.chart = new Highcharts.Chart({
  chart: {
    renderTo: "chart-more",
    type: "column"
  },
  series: [{
    data: [19, 6, 2, 1, 9, 4, 15, 2, 9, 11, 16, 18]
  }],
  xAxis: {
    categories: [{
      name: "America",
      categories: [{
        name: "USA",
        categories: ["New York", "San Francisco"]
      }, {
        name: "Canada",
        categories: ["Toronto", "Vancouver"]
      }, {
        name: "Mexico",
        categories: ["Acapulco", "Leon"]
      }]
    }, {
      name: "Europe",
      categories: [{
        name: "United Kingdom",
        categories: ["London", "Liverpool"]
      }, {
        name: "France",
        categories: ["Paris", "Marseille"]
      }, {
        name: "Germany",
        categories: ["Berlin", "Munich"]
      }]
    }]
  }
});

</script>


For each level you can define subset of styling options. 0-level categories are based on the default Highcharts options.

```
xAxis: {  	
	labels: {
	    groupedOptions: [{
	  	    style: {
	  	  	    color: 'red' // set red font for labels in 1st-Level  
	  	    }
	    }, {
	  	    rotation: -45, // rotate labels for a 2nd-level
	  	    align: 'right'
	    }],
	    rotation: 0 // 0-level options aren't changed, use them as always
    },
    categories: [{
        name: "America",
        categories: [{
            name: "USA",
            categories: ["New York", "San Francisco"]
        }, {
            name: "Canada",
            categories: ["Toronto", "Vancouver"]
        }, {
            name: "Mexico",
            categories: ["Acapulco", "Leon"]
        }]
    }, {
        name: "Europe",
        categories: [{
            name: "United Kingdom",
            categories: ["London", "Liverpool"]
        }, {
            name: "France",
            categories: ["Paris", "Marseille"]
        }, {
            name: "Germany",
            categories: ["Berlin", "Munich"]
        }]
    }]
}
```



### Code

The latest code is available on github: [https://github.com/blacklabel/grouped_categories/](https://github.com/blacklabel/grouped_categories/)

### Demo

Demos are available at project's github page: [http://blacklabel.github.io/grouped_categories/](http://blacklabel.github.io/grouped_categories/)

