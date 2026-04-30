/**
 * Grouped Categories v1.3.4 (2026-03-10)
 *
 * (c) 2012-2026 Black Label
 *
 * License: Creative Commons Attribution (CC)
 */

/* global Highcharts module */
(function (factory) {
	if (typeof module === 'object' && module.exports) {
		module.exports = factory;
	} else {
		factory(Highcharts);
	}
}(function (HC) {
	'use strict';

	/* jshint expr:true, boss:true */
	var UNDEFINED = void 0,
		mathRound = Math.round,
		mathMin = Math.min,
		mathMax = Math.max,
		merge = HC.merge,
		pick = HC.pick,
		each = HC.each,

		// cache prototypes
		axisProto = HC.Axis.prototype,
		tickProto = HC.Tick.prototype,

		// cache original methods
		protoAxisInit = axisProto.init,
		protoAxisRender = axisProto.render,
		protoAxisSetCategories = axisProto.setCategories,
		protoTickGetLabelSize = tickProto.getLabelSize,
		protoTickAddLabel = tickProto.addLabel,
		protoTickDestroy = tickProto.destroy,
		protoTickRender = tickProto.render;

	function deepClone(thing) {
		return JSON.parse(JSON.stringify(thing));
	}

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

	// returns sum of an array
	function sum(arr) {
		var l = arr.length,
			x = 0;

		while (l--) {
			x += arr[l];
		}

		return x;
	}

	// Adds category leaf to array
	function addLeaf(out, cat, parent) {
		out.unshift(new Category(cat, parent));

		while (parent) {
			parent.leaves = parent.leaves ? (parent.leaves + 1) : 1;
			parent = parent.parent;
		}
	}

	// Builds reverse category tree
	function buildTree(cats, out, options, parent, depth) {
		var len = cats.length,
			cat;

		depth = depth ? depth : 0;
		options.depth = options.depth ? options.depth : 0;

		while (len--) {
			cat = cats[len];

			if (cat.categories) {
				if (parent) {
					cat.parent = parent;
				}
				buildTree(cat.categories, out, options, cat, depth + 1);
			} else {
				addLeaf(out, cat, parent);
			}
		}
		options.depth = mathMax(options.depth, depth);
	}

	// Precompute startAt (leaf offset) on each category node
	function assignStartAt(cats, offset) {
		var i, cat, counter = offset || 0;
		for (i = 0; i < cats.length; i++) {
			cat = cats[i];
			if (cat && cat.categories) {
				cat._startAt = counter;
				counter = assignStartAt(cat.categories, counter);
			} else {
				counter++;
			}
		}
		return counter;
	}

	// Pushes part of grid to path
	function addGridPart(path, d, width) {
		// Based on crispLine from HC (#65)
		if (d[0] === d[2]) {
			d[0] = d[2] = mathRound(d[0]) - (width % 2 / 2);
		}
		if (d[1] === d[3]) {
			d[1] = d[3] = mathRound(d[1]) + (width % 2 / 2);
		}

		path.push(
			'M',
			d[0], d[1],
			'L',
			d[2], d[3]
		);
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

			if (children) {
				walk(children, key, fn);
			}
			fn(arr[l]);
		}
	}

	// Create local function `fontMetrics` to provide compatibility with HC 11 (#200)
	function fontMetrics(fontSize, elem) {
		if ((HC.SVGRenderer.styledMode || !/px/.test(fontSize)) &&
			(HC.win.getComputedStyle) // old IE doesn't support it
		) {
			fontSize = elem && HC.SVGElement.prototype.getStyle.call(elem, 'font-size');
		} else {
			fontSize = fontSize ||
				// When the elem is a DOM element (#5932)
				(elem && elem.style && elem.style.fontSize) ||
				// Fall back on the renderer style default
				(HC.SVGRenderer.style && HC.SVGRenderer.style.fontSize);
		}
		// Handle different units
		if (/px/.test(fontSize)) {
			fontSize = HC.pInt(fontSize);
		} else {
			fontSize = 12;
		}
		// Empirical values found by comparing font size and bounding box
		// height. Applies to the default font family.
		// https://jsfiddle.net/highcharts/7xvn7/
		var lineHeight = (fontSize < 24 ?
				fontSize + 3 :
				Math.round(fontSize * 1.2)),
			baseline = Math.round(lineHeight * 0.8);
		return {
			h: lineHeight,
			b: baseline,
			f: fontSize
		};
	}

	// Adjusts parent label CSS for overflow (hide / ellipsis / restore).
	function adjustTickLabelOverflow(axis, groupedTick, leaves, depth) {
		if (!groupedTick.label) {
			return;
		}
		var horiz = axis.horiz,
			rotation = groupedTick.rotation ||
				(groupedTick.labelOffsets && groupedTick.labelOffsets.rotation) || 0,
			isVerticalRotation = rotation === 90 || rotation === -90,
			groupSlotWidth,
			visibleRange,
			width,
			SLOT_PADDING = 6,
			usableSlotWidth,
			rad,
			bBox,
			effectiveWidth,
			styles = groupedTick.label.styles || {};

		// Calculate available slot width for this group label
		if (horiz) {
			visibleRange = ((axis.max || 0) - (axis.min || 0) + 1) || 1;
			groupSlotWidth = (axis.width / visibleRange) * leaves;
		} else {
			width = axis.groupSize(depth, groupedTick.label.getBBox().width);
			groupSlotWidth = Math.abs(width);
		}

		// For vertically rotated labels, width constraint does not apply — skip
		if (isVerticalRotation) {
			groupedTick.label.css({
				display: 'block',
				width: undefined,
				textOverflow: undefined,
				whiteSpace: undefined
			});
			return;
		}

		usableSlotWidth = mathMax(0, groupSlotWidth - SLOT_PADDING);

		// Force nowrap before measuring — HC 12 soft-wraps, skewing bBox
		if (styles.whiteSpace !== 'nowrap') {
			groupedTick.label.css({
				whiteSpace: 'nowrap',
				width: undefined,
				textOverflow: undefined
			});
			styles = groupedTick.label.styles || {};
		}

		// For rotated (non-90°) labels, calculate effective horizontal width
		if (rotation !== 0) {
			rad = Math.abs(rotation) * (Math.PI / 180);
			bBox = groupedTick.label.getBBox();
			effectiveWidth = bBox.width * Math.cos(rad) + bBox.height * Math.sin(rad);
			if (effectiveWidth <= usableSlotWidth) {
				groupedTick.label.css({
					display: 'block',
					width: undefined,
					textOverflow: undefined,
					whiteSpace: 'nowrap'
				});
				return;
			}
		}

		// Hide label if slot is too narrow to render anything meaningful
		if (usableSlotWidth < 12) {
			groupedTick.label.css({
				display: 'none',
				width: undefined,
				textOverflow: undefined,
				whiteSpace: undefined
			});
		}
		// Was hidden, now has room — restore and re-evaluate
		else if (styles.display === 'none') {
			groupedTick.label.css({
				display: 'block',
				width: undefined,
				textOverflow: undefined,
				whiteSpace: 'nowrap'
			});
			if (groupedTick.label.getBBox().width > usableSlotWidth) {
				groupedTick.label.css({
					display: 'block',
					width: usableSlotWidth + 'px',
					textOverflow: 'ellipsis',
					whiteSpace: 'nowrap'
				});
			}
		}
		// Already truncated at this width — no-op
		else if (styles.textOverflow === 'ellipsis' &&
			styles.width &&
			Math.abs(usableSlotWidth - +String(styles.width).replace('px', '')) < 0.5) {
			// no-op
		}
		// Truncate with ellipsis if label overflows its slot
		else if (groupedTick.label.getBBox().width > usableSlotWidth ||
			(groupedTick.label.getBBox().width === 0 &&
				styles.width &&
				usableSlotWidth === +String(styles.width).replace('px', ''))) {
			groupedTick.label.css({
				display: 'block',
				width: usableSlotWidth + 'px',
				textOverflow: 'ellipsis',
				whiteSpace: 'nowrap'
			});
		}
		// Clear previous overflow CSS when label now fits
		else if (styles.textOverflow === 'ellipsis' ||
			(styles.width && usableSlotWidth > +String(styles.width).replace('px', ''))) {
			groupedTick.label.css({
				display: 'block',
				width: undefined,
				textOverflow: undefined,
				whiteSpace: 'nowrap'
			});
		}
	}

	//
	// Axis prototype
	//

	axisProto.init = function (chart, options, coll) {
		// default behaviour
		protoAxisInit.call(this, chart, options, coll);

		if (typeof options === 'object' && options.categories) {
			this.setupGroups(options);
		}
	};

	// setup required axis options
	axisProto.setupGroups = function (options) {
		var categories = deepClone(options.categories),
			reverseTree = [],
			stats = {},
			labelOptions = this.options.labels,
			userAttr = labelOptions.groupedOptions,
			css = labelOptions.style;

		// build categories tree
		buildTree(categories, reverseTree, stats);
		assignStartAt(categories, 0);

		// set axis properties
		this.categoriesTree = categories;
		this.categories = reverseTree;
		this.isGrouped = stats.depth !== 0;
		this.labelsDepth = stats.depth;
		this.labelsSizes = [];
		this.labelsGridPath = [];
		this.tickLength = options.tickLength || this.tickLength || null;
		// Cached parent-group data for grid separators (built on first render)
		this._gcParentGroups = null;
		this._gcMaxDepthFromRoot = 0;
		// #66: tickWidth for x axis defaults to 1, for y to 0
		this.tickWidth = pick(options.tickWidth, this.isXAxis ? 1 : 0);
		this.directionFactor = [-1, 1, 1, -1][this.side];
		this.options.lineWidth = pick(options.lineWidth, 1);
		// #85: align labels vertically
		this.groupFontHeights = [];
		for (var i = 0; i <= stats.depth; i++) {
			var hasOptions = userAttr && userAttr[i - 1],
				mergedCSS = hasOptions && userAttr[i - 1].style ? merge(css, userAttr[i - 1].style) : css;
			this.groupFontHeights[i] = Math.round(fontMetrics(mergedCSS ? mergedCSS.fontSize : 0).b * 0.3);
		}

		// Reduce default distance to 40% for grouped axes to center leaf labels vertically.
		// If the user explicitly set labels.distance, respect it as-is.
		if (this.isGrouped && !this._gcDistanceAdjusted) {
			var userLabels = options.labels;
			if (!userLabels || userLabels.distance == null) {
				this.options.labels.distance = this.options.labels.distance * 0.4;
			}
			this._gcDistanceAdjusted = true;
		}
	};


	axisProto.render = function () {
		// clear grid path
		if (this.isGrouped) {
			this.labelsGridPath = [];
			// Keep 0.5 offset — HC resets to 0 on auto-step, misaligning labels
			this.tickmarkOffset = 0.5;
		}

		// cache original tick length
		if (this.originalTickLength === UNDEFINED) {
			this.originalTickLength = this.options.tickLength;
		}

		// use default tickLength for not-grouped axis
		// and generate grid on grouped axes,
		// use tiny number to force highcharts to hide tick
		this.options.tickLength = this.isGrouped ? 0.001 : this.originalTickLength;

		protoAxisRender.call(this);

		if (!this.isGrouped) {
			if (this.labelsGrid) {
				this.labelsGrid.attr({
					visibility: 'hidden'
				});
			}
			return false;
		}

		var axis = this,
			options = axis.options,
			top = axis.top,
			left = axis.left,
			right = left + axis.width,
			bottom = top + axis.height,
			visible = axis.hasVisibleSeries || axis.hasData,
			depth = axis.labelsDepth,
			grid = axis.labelsGrid,
			horiz = axis.horiz,
			d = axis.labelsGridPath,
			i = options.drawHorizontalBorders === false ? (depth + 1) : 0,
			offset = axis.opposite ? (horiz ? top : right) : (horiz ? bottom : left),
			tickWidth = axis.tickWidth,
			part;

		if (axis.userTickLength) {
			depth -= 1;
		}

		// render grid path for the first time
		if (!grid) {
			grid = axis.labelsGrid = axis.chart.renderer.path()
			.attr({
				// #58: use tickWidth/tickColor instead of lineWidth/lineColor:
				strokeWidth: tickWidth, // < 4.0.3
				'stroke-width': tickWidth, // 4.0.3+ #30
				stroke: options.tickColor || '' // for styled mode (tickColor === undefined)
			})
			.add(axis.axisGroup);
			// for styled mode - add class
			if (!options.tickColor) {
				grid.addClass('highcharts-tick');
			}
		}

		// go through every level and draw horizontal grid line
		while (i <= depth) {
			offset += axis.groupSize(i);

			part = horiz ?
				[left, offset, right, offset] :
				[offset, top, offset, bottom];

			addGridPart(d, part, tickWidth);
			i++;
		}

		// Leaf-level grid separators for all positions (independent of auto-step)
		var leafSize = axis.groupSize(0),
			cats = axis.categories || [],
			catMin = axis.min != null ? axis.min : 0,
			catMax = axis.max != null ? axis.max : cats.length - 1,
			tickmarkOffset = 0.5,
			refTick = null,
			tk;
		for (tk in axis.ticks) {
			if (axis.ticks.hasOwnProperty(tk)) {
				refTick = axis.ticks[tk];
				break;
			}
		}
		if (refTick) {
			var pos, xy, rc, totalSize, firstGridAttrs;
			for (pos = Math.ceil(catMin); pos <= catMax; pos++) {
				xy = refTick.getPosition(horiz, pos, tickmarkOffset);
				rc = ((horiz && xy.x === axis.pos + axis.len) ||
					(!horiz && xy.y === axis.pos)) ? -1 : 0;
				if (pos === Math.ceil(catMin)) {
					totalSize = axis.groupSize(true);
					firstGridAttrs = horiz ?
						[axis.left, xy.y, axis.left, xy.y + totalSize] :
						axis.isXAxis ?
							[xy.x, top, xy.x + totalSize, top] :
							[xy.x, top + axis.len, xy.x + totalSize, top + axis.len];
					addGridPart(d, firstGridAttrs, tickWidth);
				}
				if (horiz && axis.left < xy.x) {
					addGridPart(d, [xy.x - rc, xy.y, xy.x - rc, xy.y + leafSize], tickWidth);
				} else if (!horiz && axis.top <= xy.y) {
					addGridPart(d, [xy.x, xy.y + rc, xy.x + leafSize, xy.y + rc], tickWidth);
				}
			}

			// Parent-level grid separators — computed from categoriesTree
			// (tick.startAt is unreliable under auto-step)
			var refXY = refTick.getPosition(horiz, Math.ceil(catMin), tickmarkOffset),
				baseStart = horiz ? refXY.y : refXY.x,
				parentGroups,
				bucketsByDepth,
				maxDepthFromRoot,
				lvlOffset,
				lvl,
				lvlSize,
				bucket,
				pgi,
				pg,
				lastLeaf,
				clampedLast,
				xyR,
				rc2;

			// Build or reuse cached parent groups
			if (!axis._gcParentGroups) {
				parentGroups = [];
				maxDepthFromRoot = 0;
				bucketsByDepth = [];
				(function collectGroups(nodes, depthFromRoot, startCounter) {
					var counter = startCounter,
						ni,
						node,
						groupStart,
						entry;
					for (ni = 0; ni < nodes.length; ni++) {
						node = nodes[ni];
						if (node && node.categories && node.categories.length) {
							groupStart = counter;
							counter = collectGroups(node.categories, depthFromRoot + 1, counter);
							entry = {
								startAt: groupStart,
								leaves: counter - groupStart,
								depthFromRoot: depthFromRoot
							};
							parentGroups.push(entry);
							if (depthFromRoot > maxDepthFromRoot) {
								maxDepthFromRoot = depthFromRoot;
							}
							(bucketsByDepth[depthFromRoot] = bucketsByDepth[depthFromRoot] || []).push(entry);
						} else {
							counter++;
						}
					}
					return counter;
				})(axis.categoriesTree || [], 1, 0);
				axis._gcParentGroups = parentGroups;
				axis._gcParentBuckets = bucketsByDepth;
				axis._gcMaxDepthFromRoot = maxDepthFromRoot;
			} else {
				bucketsByDepth = axis._gcParentBuckets;
				maxDepthFromRoot = axis._gcMaxDepthFromRoot;
			}

			lvlOffset = baseStart + leafSize;
			for (lvl = 1; lvl <= depth; lvl++) {
				lvlSize = axis.groupSize(lvl);
				bucket = bucketsByDepth[maxDepthFromRoot - lvl + 1];
				if (bucket) {
					for (pgi = 0; pgi < bucket.length; pgi++) {
						pg = bucket[pgi];
						lastLeaf = pg.startAt + pg.leaves - 1;
						if ((axis.max != null && pg.startAt > axis.max) ||
							(axis.min != null && lastLeaf < axis.min)) {
							continue;
						}
						clampedLast = axis.max != null ? mathMin(lastLeaf, axis.max) : lastLeaf;
						xyR = refTick.getPosition(horiz, clampedLast, tickmarkOffset);
						rc2 = ((horiz && xyR.x === axis.pos + axis.len) ||
							(!horiz && xyR.y === axis.pos)) ? -1 : 0;
						if (horiz && axis.left < xyR.x) {
							addGridPart(d, [xyR.x - rc2, lvlOffset, xyR.x - rc2, lvlOffset + lvlSize], tickWidth);
						} else if (!horiz && axis.top <= xyR.y) {
							addGridPart(d, [lvlOffset, xyR.y + rc2, lvlOffset + lvlSize, xyR.y + rc2], tickWidth);
						}
					}
				}
				lvlOffset += lvlSize;
			}
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

			if (!tick) {
				return false;
			}
			if (tick.startAt + tick.leaves - 1 < axis.min || tick.startAt > axis.max) {
				tick.label.hide();
				tick.destroyed = 0;
			} else {
				tick.label.attr({
					visibility: visible ? 'visible' : 'hidden'
				});
			}
			return true;
		});

		// Second pass: re-apply parent label overflow after HC's style passes
		walk(axis.categoriesTree, 'categories', function (group) {
			var groupTick = group.tick,
				gd = 0,
				p = group;
			if (!groupTick || !groupTick.label) {
				return true;
			}
			while (p) {
				gd++;
				p = p.parent;
			}
			adjustTickLabelOverflow(axis, groupTick, group.leaves || 1, gd);
			return true;
		});
		return true;
	};

	axisProto.setCategories = function (newCategories, doRedraw) {
		if (this.categories) {
			this.cleanGroups();
		}
		this._gcParentGroups = null;
		this._gcParentBuckets = null;
		this._gcMaxDepthFromRoot = 0;
		this.setupGroups({
			categories: newCategories
		});
		this.categories = this.userOptions.categories = newCategories;
		protoAxisSetCategories.call(this, this.categories, doRedraw);
	};

	// cleans old categories
	axisProto.cleanGroups = function () {
		var ticks = this.ticks,
			n;

		for (n in ticks) {
			if (ticks[n].parent) {
				delete ticks[n].parent;
			}
		}
		walk(this.categoriesTree, 'categories', function (group) {
			var tick = group.tick;

			if (!tick) {
				return false;
			}
			tick.label.destroy();

			each(tick, function (v, i) {
				delete tick[i];
			});
			delete group.tick;

			return true;
		});
		this.labelsGrid = null;
	};

	// keeps size of each categories level
	axisProto.groupSize = function (level, position) {
		var positions = this.labelsSizes,
			direction = this.directionFactor,
			groupedOptions = this.options.labels.groupedOptions ? this.options.labels.groupedOptions[level - 1] : false,
			userXY = 0;

		if (groupedOptions) {
			if (direction === -1) {
				userXY = groupedOptions.x ? groupedOptions.x : 0;
			} else {
				userXY = groupedOptions.y ? groupedOptions.y : 0;
			}
		}

		if (position !== UNDEFINED) {
			positions[level] = mathMax(positions[level] || 0, position + 10 + Math.abs(userXY));
		}

		if (level === true) {
			return sum(positions) * direction;
		} else if (positions[level]) {
			return positions[level] * direction;
		}

		return 0;
	};

	//
	// Tick prototype
	//

	// Override methods prototypes
	tickProto.addLabel = function () {
		var tick = this,
			axis = tick.axis,
			labelOptions = pick(
				tick.options && tick.options.labels,
				axis.options.labels
			),
			category,
			formatter;

		// Initialize topLabelSize on the axis
		axis.topLabelSize = 0;

		protoTickAddLabel.call(tick);

		if (!axis.categories || !(category = axis.categories[tick.pos])) {
			return false;
		}

		// set label text - but applied after formatter #46
		if (tick.label) {
			formatter = function (ctx) {
				if (labelOptions.formatter) {
					return labelOptions.formatter.call(ctx, ctx);
				}
				if (labelOptions.format) {
					ctx.text = axis.defaultLabelFormatter.call(ctx);
					return HC.format(labelOptions.format, ctx, axis.chart);
				}
				return axis.defaultLabelFormatter.call(ctx, ctx);
			};

			tick.label.attr('text', formatter({
				axis: axis,
				chart: axis.chart,
				isFirst: tick.isFirst,
				isLast: tick.isLast,
				value: category.name,
				pos: tick.pos
			}));

			// update with new text length, since textSetter removes the size caches when text changes. #137
			tick.label.textPxLength = tick.label.getBBox().width;
		}

		// create elements for parent categories
		if (axis.isGrouped && axis.options.labels.enabled) {
			tick.addGroupedLabels(category);
		}
		return true;
	};

	// render ancestor label
	tickProto.addGroupedLabels = function (category) {
		var tick = this,
			axis = this.axis,
			chart = axis.chart,
			options = axis.options.labels,
			useHTML = options.useHTML,
			css = options.style,
			userAttr = options.groupedOptions,
			attr = {
				align: 'center',
				rotation: options.rotation,
				x: 0,
				y: 0
			},
			size = axis.horiz ? 'height' : 'width',
			depth = 0,
			label;


		while (tick) {
			if (depth > 0 && !category.tick) {
				// render label element
				this.value = category.name;
				var name = options.formatter ? options.formatter.call(this, category) : category.name,
					hasOptions = userAttr && userAttr[depth - 1],
					mergedAttrs = hasOptions ? merge(attr, userAttr[depth - 1]) : attr,
					mergedCSS = hasOptions && userAttr[depth - 1].style ? merge(css, userAttr[depth - 1].style) : css;

				// #63: style is passed in CSS and not as an attribute
				delete mergedAttrs.style;

				label = chart.renderer.text(name, 0, 0, useHTML)
					.attr(mergedAttrs)
					.add(axis.labelGroup);

				// css should only be set for non styledMode configuration. #167
				if (label && !chart.styledMode) {
					label.css(mergedCSS);
				}

				// tick properties — use precomputed _startAt from tree
				tick.startAt = category._startAt != null ? category._startAt : this.pos;
				tick.childCount = category.categories.length;
				tick.leaves = category.leaves;
				tick.visible = this.childCount;
				tick.label = label;
				tick.labelOffsets = {
					x: mergedAttrs.x,
					y: mergedAttrs.y
				};

				// link tick with category
				category.tick = tick;
			}

			// set level size, #93
			if (tick && tick.label) {
				axis.groupSize(depth, tick.label.getBBox()[size]);
			}

			// go up to the parent category
			category = category.parent;

			if (category) {
				tick = tick.parent = category.tick || {};
			} else {
				tick = null;
			}

			depth++;
		}
	};

	// set labels position & render categories grid
	tickProto.render = function (index, old, opacity) {
		protoTickRender.call(this, index, old, opacity);

		var treeCat = this.axis.categories && this.axis.categories[this.pos];

		if (!this.axis.isGrouped || !treeCat || this.pos > this.axis.max) {
			return;
		}

		var tick = this,
			group = tick,
			axis = tick.axis,
			tickPos = tick.pos,
			isFirst = tick.isFirst,
			max = axis.max,
			min = axis.min,
			horiz = axis.horiz,
			grid = axis.labelsGridPath,
			size = axis.groupSize(0),
			tickWidth = axis.tickWidth,
			xy = tickPosition(tick, tickPos),
			start = horiz ? xy.y : xy.x,
			baseLine = fontMetrics(axis.options.labels.style ? axis.options.labels.style.fontSize : 0).b,
			depth = 1,
			reverseCrisp = ((horiz && xy.x === axis.pos + axis.len) || (!horiz && xy.y === axis.pos)) ? -1 : 0, // adjust grid lines for edges
			gridAttrs,
			lvlSize,
			minPos,
			maxPos,
			attrs,
			bBox;

		// Leaf grid separators are drawn centrally in axisProto.render

		// Reset stale overflow CSS on leaf labels — HC handles their visibility
		if (tick.label && tick.label.styles) {
			if (tick.label.styles.display === 'none' ||
				tick.label.styles.textOverflow === 'ellipsis' ||
				tick.label.styles.width) {
				tick.label.css({
					display: '',
					width: undefined,
					textOverflow: undefined
				});
			}
		}

		size = start + size;

		function fixOffset(tCat) {
			var ret = 0;
			if (isFirst) {
				ret = tCat.parent.categories.indexOf(tCat.name);
				ret = ret < 0 ? 0 : ret;
				return ret;
			}
			return ret;
		}


		while (group.parent) {
			group = group.parent;

			var fix = fixOffset(treeCat),
				userX = group.labelOffsets.x,
				userY = group.labelOffsets.y;

			minPos = tickPosition(tick, mathMax(group.startAt - 1, min - 1));
			maxPos = tickPosition(tick, mathMin(group.startAt + group.leaves - 1 - fix, max));
			bBox = group.label.getBBox(true);
			lvlSize = axis.groupSize(depth);
			// check if on the edge to adjust
			reverseCrisp = ((horiz && maxPos.x === axis.pos + axis.len) || (!horiz && maxPos.y === axis.pos)) ? -1 : 0;

			adjustTickLabelOverflow(axis, group, group.leaves || 1, depth);

			attrs = horiz ? {
				x: (minPos.x + maxPos.x) / 2 + userX,
				y: size + axis.groupFontHeights[depth] + lvlSize / 2 + userY / 2
			} : {
				x: size + lvlSize / 2 + userX,
				y: (minPos.y + maxPos.y - bBox.height) / 2 + baseLine + userY
			};

			if (!isNaN(attrs.x) && !isNaN(attrs.y)) {
				group.label.attr(attrs);
				// Parent grid separators drawn centrally in axisProto.render
			}

			size += lvlSize;
			depth++;
		}
	};

	tickProto.destroy = function () {
		var group = this.parent;

		while (group) {
			group.destroyed = group.destroyed ? (group.destroyed + 1) : 1;
			group = group.parent;
		}

		protoTickDestroy.call(this);
	};

	// return size of the label (height for horizontal, width for vertical axes)
	tickProto.getLabelSize = function () {
		if (this.axis.isGrouped === true) {
			// #72, getBBox might need recalculating when chart is tall
			var size = protoTickGetLabelSize.call(this) + 10;
			if (this.axis.topLabelSize < size) {
				this.axis.topLabelSize = this.axis.labelsSizes[0];
				this.axis.labelsSizes[0] = size;
			}
			return sum(this.axis.labelsSizes);
		}
		return protoTickGetLabelSize.call(this);
	};

	// Since datasorting is not supported by the plugin,
	// override replaceMovedLabel method, #146.
	HC.wrap(HC.Tick.prototype, 'replaceMovedLabel', function (proceed) {
		if (!this.axis.isGrouped) {
			proceed.apply(this, Array.prototype.slice.call(arguments, 1));
		} else {
			// Get rid of unnecessary duplicated label, #222
			var movedLabel = this.movedLabel;
			if (movedLabel) {
				movedLabel.destroy();
				delete this.movedLabel;
			}
		}
	});

}));
