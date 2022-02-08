
# Grouped Categories - Highcharts module

Go to project page to see this module in action: [http://blacklabel.github.io/grouped_categories/](http://blacklabel.github.io/grouped_categories/)

### Requirements

* Plugin requires the latest Highcharts (tested with 2.3.5)
* For Highcharts version `>= 9.1.0` the plugin needs to be in version `>= 1.2.0`

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

### Dashboard Developer Notes

We forked from the upstream repository to add our own customizations.
Follow these steps to merge the upstream changes into our repo
1.  Branch off from master
    1.  git checkout -b branch_name
2.  Pull in the upstream changes on the master branch
    1.  git pull https://github.com/blacklabel/grouped_categories.git master
3.  Fixed merged conflicts, should be safe to take incoming changes
4.  Reapply our own customizations
    1.  grouped-categories.js - add the code block below before the while (i <= depth) loop, and then comment out the while loop
    ```javascript
        //Generate an array that contains the lengths of the category sets closest to the axis
        var baseCategoryLengths = [];
        var drill = function(categories, curDepth, targetDepth){
            if(curDepth == targetDepth)
                return baseCategoryLengths.push(categories.length);
            else
                for(var j=0; j < categories.length; j++){
                    drill(categories[j].categories, curDepth+1, targetDepth);
                }
        };
        drill(axis.categoriesTree, 0, depth);
        //We increment through the grid array by <number of levels> * <amount of array indexes to define a point>(it takes 6 indexes in the array to define a line)
        var arrayIncrement = (depth+1)*6;
        //The Y position of the 'base' of the axis (X pos if on Y axis, Y pos if on X axis)
        var axisBaseYCoord = (horiz) ? d[2] : d[1];
        //We target the X pos if on Y axis, we target the Y pos if on X axis)
        var targetCoord = (horiz) ? 3 : 4;
        //We check every 6th grid index because 6 indexes = 1 point
        var curCategoryPos = 0;
        var targetLine = baseCategoryLengths[curCategoryPos++]*arrayIncrement;
        for(var j=11; j < d.length; j+=6){
            //If the cur. position matches the target line we want to keep
            if((j+1)%(targetLine) == 0){
                targetLine += baseCategoryLengths[curCategoryPos++]*arrayIncrement;
                //We modify the current lines start position to be the grids base (covers the gap left by deleting all the 1st level lines)
                d[j-targetCoord] = axisBaseYCoord;
                //We skip the next grid line, since it's an extension of the current grid line
                j+=6;
                continue;
            }
            //Set line start position to 0
            d[j-3] = 0;
            d[j-4] = 0;

            //Set line end position to 0
            d[j] = 0;
            d[j-1] = 0;

        }

		// go through every level and draw horizontal grid line
		// while (i <= depth) {
		// 	offset += axis.groupSize(i);

		// 	part = horiz ?
		// 		[left, offset, right, offset] :
		// 		[offset, top, offset, bottom];

		// 	addGridPart(d, part, tickWidth);
		// 	i++;
		// }

    ```
   