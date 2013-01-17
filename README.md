# Grouped Categories Highcharts module

![Grouped Categories](https://f.cloud.github.com/assets/381865/75319/77f67946-60bf-11e2-8e0a-b8291a3024e9.png)


### Requirements

* Plugin requires the latest Highcharts (tested with 2.3.5)

### Installation

* Like any other Highcharts module (e.g. exporting), add `<script>` tag pointing to `grouped-categories.js` below Highcharts script tag.

### Usage

It's quite simple and intuitive, just pass object as category:

```javascript
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

```javascript
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




### Demos

Check out jsfiddle demos:

* Basic usage: http://jsfiddle.net/shD6K/
* More levels: http://jsfiddle.net/UJE8X/
