# Grouped Categories Highcharts module

### Requirements

* Plugin requires the latest Highcharts (tested with 2.3.5)

### Installation

* Like any other Highcharts module (e.g. exporting), add `<script>` tag pointing to `grouped-categories.js` below Highcharts script tag.

### Usage

It's quite simple and intuitive, just pass object as category:

```
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
```
