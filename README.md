
# Grouped Categories - Highcharts module

Go to project page to see this module in action: [http://blacklabel.github.io/grouped_categories/](http://blacklabel.github.io/grouped_categories/)

### Requirements

* Plugin requires the latest Highcharts (tested with 2.3.5)

### Installation

* Like any other Highcharts module (e.g. exporting), add `<script>` tag pointing to `grouped-categories.js` below Highcharts script tag.

* For NPM users: 
```
var Highcharts = require('highcharts'),
    HighchartsGroupedCategories = require('grouped-categories')(Highcharts);
```

* For BOWER users:

```
bower install highcharts-grouped-categories
```

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
