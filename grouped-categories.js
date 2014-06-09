/**
 * Grouped Categories v1.0.3 (2014-03-14)
 *
 * (c) 2012-2013 Black Label
 *
 * License: Creative Commons Attribution (CC)
 */
(function(HC){
/*jshint expr:true, boss:true */
var UNDEFINED = void 0,
    mathRound = Math.round,
    mathMin   = Math.min,
    mathMax   = Math.max,
    merge     = HC.merge,

    // cache prototypes
    axisProto  = HC.Axis.prototype,
    tickProto  = HC.Tick.prototype,

    // cache original methods
    _axisInit          = axisProto.init,
    _axisRender        = axisProto.render,
    _axisSetCategories = axisProto.setCategories,
    _tickGetLabelSize  = tickProto.getLabelSize,
    _tickAddLabel      = tickProto.addLabel,
    _tickDestroy       = tickProto.destroy,
    _tickRender        = tickProto.render;


function Category(obj, parent) {
	this.userOptions = deepClone(obj);
  this.name = obj.name || obj;
  this.parent = parent;

  return this;
}

Category.prototype.toString = function () {
  var parts = [],
      cat = this;

  while (cat) {
    parts.push(cat.name);
    cat = cat.parent;
  }

  return parts.join(', ');
};


// Highcharts methods
function defined(obj) {
  return obj !== UNDEFINED && obj !== null;
}

// calls parseInt with radix = 10, adds 0.5 to avoid blur
function pInt(n) {
  return parseInt(n, 10) - 0.5;
}

// returns sum of an array
function sum(arr) {
  var l = arr.length,
      x = 0;

  while (l--)
    x += arr[l];

  return x;
}


// Builds reverse category tree
function buildTree(cats, out, options, parent, depth) {
  var len = cats.length,
      cat;

  depth || (depth = 0);
  options.depth || (options.depth = 0);

  while (len--) {
    cat = cats[len];


    if (parent)
      cat.parent = parent;


    if (cat.categories)
      buildTree(cat.categories, out, options, cat, depth + 1);

    else
      addLeaf(out, cat, parent);
  }

  options.depth = mathMax(options.depth, depth);
}

// Adds category leaf to array
function addLeaf(out, cat, parent) {
  out.unshift(new Category(cat, parent));

  while (parent) {
    parent.leaves++ || (parent.leaves = 1);
    parent = parent.parent;
  }
}

// Pushes part of grid to path
function addGridPart(path, d) {
  path.push(
    'M',
    pInt(d[0]), pInt(d[1]),
    'L',
    pInt(d[2]), pInt(d[3])
  );
}

// Destroys category groups
function cleanCategory(category) {
  var tmp;

  while (category) {
    tmp = category.parent;

    if (category.label)
      category.label.destroy();

    delete category.parent;
    delete category.label;

    category = tmp;
  }
}

// Returns tick position
function tickPosition(tick, pos) {
  return tick.getPosition(tick.axis.horiz, pos, tick.axis.tickmarkOffset);
}

function walk(arr, key, fn) {
  var l = arr.length,
      children;

  while (l--) {
    children = arr[l][key];

    if (children)
      walk(children, key, fn);

    fn(arr[l]);
  }
}
function deepClone(thing) {
    var other, key;
   
    function isArray(obj) {
        return Object.prototype.toString.call(obj) === '[object Array]';
    }
    
    function isObject(obj) {
        return Object.prototype.toString.call(obj) === '[object Object]';
    }

    // check for type, array or object
    other = isArray(thing) ? [] : {};

    for (key in thing) {
        if (thing.hasOwnProperty(key)) {
            if (isObject(thing[key])) {
                other[key] = deepClone(thing[key]);
            } else {
                other[key] = thing[key];
            }           
        }        
    };
    return other;
}

//
// Axis prototype
//

axisProto.init = function (chart, options) {
  // default behaviour
  _axisInit.call(this, chart, options);

  if (typeof options === 'object' && options.categories)
    this.setupGroups(options);
};

// setup required axis options
axisProto.setupGroups = function (options) {
  var categories,
      reverseTree = [],
      stats       = {};
 
  categories = deepClone(options.categories);;

  // build categories tree
  buildTree(categories, reverseTree, stats);

  // set axis properties
  this.categoriesTree   = categories;
  this.categories       = reverseTree;
  this.isGrouped        = stats.depth !== 0;
  this.labelsDepth      = stats.depth;
  this.labelsSizes      = [];
  this.labelsGridPath   = [];
  this.tickLength       = options.tickLength || this.tickLength || null;
  this.directionFactor  = [-1, 1, 1, -1][this.side];

  this.options.lineWidth = options.lineWidth || 1;
};


axisProto.render = function () {
  // clear grid path
  if (this.isGrouped)
    this.labelsGridPath = [];

  // cache original tick length
  if (this.originalTickLength === UNDEFINED)
    this.originalTickLength = this.options.tickLength;

  // use default tickLength for not-grouped axis
  // and generate grid on grouped axes,
  // use tiny number to force highcharts to hide tick
  this.options.tickLength = this.isGrouped ? 0.001 : this.originalTickLength;

  _axisRender.call(this);


  if (!this.isGrouped) {
    if (this.labelsGrid)
      this.labelsGrid.attr({visibility: 'hidden'});
    return;
  }

  var axis    = this,
      options = axis.options,
      top     = axis.top,
      left    = axis.left,
      right   = left + axis.width,
      bottom  = top + axis.height,
      visible = axis.hasVisibleSeries,
      depth   = axis.labelsDepth,
      grid    = axis.labelsGrid,
      horiz   = axis.horiz,
      d       = axis.labelsGridPath,
      i       = options.drawHorizontalBorders === false ? depth+1 : 0,
      offset  = axis.opposite ? (horiz ? top : right) : (horiz ? bottom : left),
      part;

  if (axis.userTickLength)
    depth -= 1;

  // render grid path for the first time
  if (!grid) {
    grid = axis.labelsGrid = axis.chart.renderer.path()
      .attr({
        strokeWidth: options.lineWidth,
        stroke: options.lineColor
      })
      .add(axis.axisGroup);
  }

  // go through every level and draw horizontal grid line
  while (i <= depth) {
    offset += axis.groupSize(i);

    part = horiz ?
      [left, offset, right, offset] :
      [offset, top, offset, bottom];

    addGridPart(d, part);
    i++;
  }

  // draw grid path
  grid.attr({
    d: d,
    visibility: visible ? 'visible' : 'hidden'
  });

  axis.labelGroup.attr({
    visibility: visible ? 'visible' : 'hidden'
  });


  walk(axis.categoriesTree, 'categories', function (group) {
    var tick = group.tick;

    if (!tick)
      return;

    if (tick.startAt + tick.leaves - 1 < axis.min || tick.startAt > axis.max) {
      tick.label.hide();
      tick.destroyed = 0;
    }
    else
      tick.label.show();
  });
};

axisProto.setCategories = function (newCategories, doRedraw) {
  if (this.categories)
    this.cleanGroups();

  this.setupGroups({
    categories: newCategories
  });
  this.categories = this.userOptions.categories = newCategories;
  _axisSetCategories.call(this, this.categories, doRedraw);
};

// cleans old categories
axisProto.cleanGroups = function () {
  var ticks = this.ticks,
      n;

  for (n in ticks)
    if (ticks[n].parent);
      delete ticks[n].parent;

  walk(this.categoriesTree, 'categories', function (group) {
    var tick = group.tick,
        n;

    if (!tick)
      return;

    tick.label.destroy();

    for (n in tick)
      delete tick[n];

    delete group.tick;
  });
  this.labelsGrid = null;
};

// keeps size of each categories level
axisProto.groupSize = function (level, position) {
  var positions = this.labelsSizes,
      direction = this.directionFactor;

  if (position !== UNDEFINED)
    positions[level] = mathMax(positions[level] || 0, position + 10);

  if (level === true)
    return sum(positions) * direction;

  else if (positions[level])
    return positions[level] * direction;

  return 0;
};



//
// Tick prototype
//

// Override methods prototypes
tickProto.addLabel = function () {
  var category;

  _tickAddLabel.call(this);

  if (!this.axis.categories ||
      !(category = this.axis.categories[this.pos]))
    return;

  // set label text
  if (category.name)
    this.label.attr('text', category.name);

  // create elements for parent categories
  if (this.axis.isGrouped)
    this.addGroupedLabels(category);
};

// render ancestor label
tickProto.addGroupedLabels = function (category) {
  var tick    = this,
      axis    = this.axis,
      chart   = axis.chart,
      options = axis.options.labels,
      useHTML = options.useHTML,
      css     = options.style,
      userAttr= options.groupedOptions,
      attr    = { align: 'center' , rotation: options.rotation },
      size    = axis.horiz ? 'height' : 'width',
      depth   = 0,
      label;


  while (tick) {
    if (depth > 0 && !category.tick) {
      // render label element
      this.value = category.name;
      var name = options.formatter ? options.formatter.call(this, category) : category.name,
      	  hasOptions = userAttr && userAttr[depth-1],
     	  mergedAttrs =  hasOptions ? merge(attr, userAttr[depth-1] ) : attr,
     	  mergedCSS = hasOptions && userAttr[depth-1].style ? merge(css, userAttr[depth-1].style ) : css;
      label = chart.renderer.text(name, 0, 0, useHTML)
        .attr(mergedAttrs)
        .css(mergedCSS)
        .add(axis.labelGroup);

      // tick properties
      tick.startAt = this.pos;
      tick.childCount = category.categories.length;
      tick.leaves = category.leaves;
      tick.visible = this.childCount;
      tick.label = label;

      // link tick with category
      category.tick = tick;
    }

    // set level size
    axis.groupSize(depth, tick.label.getBBox()[size]);

    // go up to the parent category
    category = category.parent;

    if (category)
      tick = tick.parent = category.tick || {};
    else
      tick = null;

    depth++;
  }
};

// set labels position & render categories grid
tickProto.render = function (index, old, opacity) {
  _tickRender.call(this, index, old, opacity);

  var treeCat = this.axis.categories[this.pos];
  
  if (!this.axis.isGrouped || !treeCat || this.pos > this.axis.max)
    return;

  var tick    = this,
      group   = tick,
      axis    = tick.axis,
      tickPos = tick.pos,
      isFirst = tick.isFirst,
      max     = axis.max,
      min     = axis.min,
      horiz   = axis.horiz,
      cat     = axis.categories[tickPos],
      grid    = axis.labelsGridPath,
      size    = axis.groupSize(0),
      tickLen = axis.tickLength || size,
      factor  = axis.directionFactor,
      xy      = tickPosition(tick, tickPos),
      start   = horiz ? xy.y : xy.x,
      baseLine= axis.chart.renderer.fontMetrics(axis.options.labels.style.fontSize).b,
      depth   = 1,
      gridAttrs,
      lvlSize,
      minPos,
      maxPos,
      attrs,
      bBox;

  // render grid for "normal" categories (first-level), render left grid line only for the first category
  if (isFirst) {
    gridAttrs = horiz ?
      [axis.left, xy.y, axis.left, xy.y + axis.groupSize(true)] :
      axis.isXAxis ?
        [xy.x, axis.top, xy.x + axis.groupSize(true), axis.top] :
        [xy.x, axis.top + axis.len, xy.x + axis.groupSize(true), axis.top + axis.len];

    addGridPart(grid, gridAttrs);
  }

  gridAttrs = horiz ?
    [xy.x, xy.y, xy.x, xy.y + size] :
    [xy.x, xy.y, xy.x + size, xy.y];

  addGridPart(grid, gridAttrs);

  size = start + size;

  function fixOffset(group, treeCat, tick){
  		var ret = 0;
			if(isFirst) {
					ret = $.inArray(treeCat.name, treeCat.parent.categories);
					ret = ret < 0 ? 0 : ret;
					return ret;
			} 
			return ret;
  }


  while (group = group.parent) {
  	var fix = fixOffset(group, treeCat, tick);
  	
    minPos  = tickPosition(tick, mathMax(group.startAt - 1, min - 1));
    maxPos  = tickPosition(tick, mathMin(group.startAt + group.leaves - 1 - fix, max));
    bBox    = group.label.getBBox();
    lvlSize = axis.groupSize(depth);
    attrs = horiz ? {
      x: (minPos.x + maxPos.x) / 2,
      y: size + lvlSize / 2 + baseLine - bBox.height / 2 - 4
    } : {
			x: size + lvlSize / 2,
			y: (minPos.y + maxPos.y - bBox.height) / 2  + baseLine
		};

    group.label.attr(attrs);

    if (grid) {
      gridAttrs = horiz ?
        [maxPos.x, size, maxPos.x, size + lvlSize] :
        [size, maxPos.y, size + lvlSize, maxPos.y];

      addGridPart(grid, gridAttrs);
    }

    size += lvlSize;
    depth++;
  }
};

tickProto.destroy = function () {
  var group = this;

  while (group = group.parent)
    group.destroyed++ || (group.destroyed = 1);

  _tickDestroy.call(this);
};

// return size of the label (height for horizontal, width for vertical axes)
tickProto.getLabelSize = function () {
  if (this.axis.isGrouped === true)
    return sum(this.axis.labelsSizes);
  else
    return _tickGetLabelSize.call(this);
};

}(Highcharts));
