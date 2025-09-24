import Templating from 'highcharts-github/ts/Core/Templating';
import Tick from 'highcharts-github/ts/Core/Axis/Tick';
import Axis from 'highcharts-github/ts/Core/Axis/Axis';
import Utilities from 'highcharts-github/ts/Core/Utilities';
import SVGElement from 'highcharts-github/ts/Core/Renderer/SVG/SVGElement';

import type PositionObject from 'highcharts-github/ts/Core/Renderer/PositionObject';
import type BBoxObject from 'highcharts-github/ts/Core/Renderer/BBoxObject';
import type Chart from 'highcharts-github/ts/Core/Chart/Chart';
import type { AxisCollectionKey } from 'highcharts-github/ts/Core/Axis/AxisOptions';
import type SVGPath from 'highcharts-github/ts/Core/Renderer/SVG/SVGPath';
import type {
    GroupedCategory,
    GroupedTick,
    GroupedAxis,
    GroupedAxisOptions,
    AxisLabelFormatterContextObject
} from './../types';

const { merge, pick, objectEach, isNumber, isObject, isString, pInt } = Utilities;
const { format } = Templating;

// Utility functions
const deepClone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj)) as T;
const sum = (arr: number[]): number => arr.reduce((acc, val): number => acc + val, 0);
const walk = <T>(
    arr: T[],
    key: keyof T,
    fn: (item: T) => boolean | void
): void => {
    for (let i = arr.length - 1; i >= 0; i--) {
        const children = arr[i][key] as T[];
        if (children) {
            walk(children, key, fn);
        }
        fn(arr[i]);
    }
};

// Category class
class Category {
    public userOptions: GroupedCategory;
    public name: string;
    public parent?: GroupedCategory;

    constructor(obj: GroupedCategory | string, parent?: GroupedCategory) {
        this.userOptions = deepClone(obj as GroupedCategory);
        this.name = typeof obj === 'string' ? obj : (obj.name || '');
        this.parent = parent;
    }

    toString(): string {
        const parts: string[] = [];
        let cat: GroupedCategory | undefined = this;

        while (cat) {
            parts.push(cat.name);
            cat = cat.parent;
        }

        return parts.join(', ');
    }
}

// Add category leaf to array
const addLeaf = (
    out: GroupedCategory[],
    cat: GroupedCategory | string,
    parent?: GroupedCategory
): void => {
    out.unshift(new Category(cat, parent));

    let currentParent = parent;
    while (currentParent) {
        currentParent.leaves = (currentParent.leaves || 0) + 1;
        currentParent = currentParent.parent;
    }
};

// Builds reverse category tree
const buildTree = (
    cats: Array<GroupedCategory | string>,
    out: GroupedCategory[],
    options: { depth: number },
    parent?: GroupedCategory,
    depth = 0
): void => {
    options.depth = options.depth || 0;

    for (let i = cats.length - 1; i >= 0; i--) {
        const cat = cats[i];
    
        if (typeof cat === 'object' && cat.categories) {
            if (parent) {
                cat.parent = parent;
            }
            buildTree(cat.categories, out, options, cat, depth + 1);
        } else {
            addLeaf(out, cat, parent);
        }
    }
    options.depth = Math.max(options.depth, depth);
};

// Pushes part of grid to path
const addGridPart = (path: Array<string | number>, d: number[], width: number): void => {
    // Based on crispLine from HC (#65)
    if (d[0] === d[2]) {
        d[0] = d[2] = Math.round(d[0]) - (width % 2 / 2);
    }
    if (d[1] === d[3]) {
        d[1] = d[3] = Math.round(d[1]) + (width % 2 / 2);
    }

    path.push(
        'M',
        d[0], d[1],
        'L',
        d[2], d[3]
    );
};

// Returns tick position
const tickPosition = (tick: GroupedTick, pos: number): PositionObject => {
    return tick.getPosition(tick.axis.horiz, pos, tick.axis.tickmarkOffset);
};

// Create local function `fontMetrics` to provide compatibility with HC 11 (#200)
const fontMetrics = (fontSize: string | number, chart?: Chart, elem?: SVGElement): {
    h: number;
    b: number;
    f: number;
} => {
    let fontSizeNum: number | string | undefined;
  
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore: workaround for old IE, window.getComputedStyle always exists in modern browsers
    if ((chart?.renderer.styledMode || (isString(fontSize) && fontSize.includes('px'))) && window.getComputedStyle) {
        fontSizeNum = elem && SVGElement.prototype.getStyle.call(elem, 'font-size');
    } else {
        fontSizeNum = fontSize || elem?.styles.fontSize || chart?.renderer.style.fontSize;
    }
  
    if (isString(fontSizeNum) && fontSizeNum.includes('px')) {
        fontSizeNum = pInt(fontSizeNum);
    } else if (!isNumber(fontSizeNum) || isNaN(fontSizeNum)) {
        fontSizeNum = 12;
    }
  
    const lineHeight = (fontSizeNum < 24 ? fontSizeNum + 3 : Math.round(fontSizeNum * 1.2));
    const baseline = Math.round(lineHeight * 0.8);
  
    return {
        h: lineHeight,
        b: baseline,
        f: fontSizeNum
    };
};

// Main plugin implementation

// Cache prototypes
const axisProto = Axis.prototype as GroupedAxis;
const tickProto = Tick.prototype as GroupedTick;

// Cache original methods
const protoAxisInit = axisProto.init;
const protoAxisRender = axisProto.render;
const protoAxisSetCategories = axisProto.setCategories;
const protoTickGetLabelSize = tickProto.getLabelSize;
const protoTickAddLabel = tickProto.addLabel;
const protoTickDestroy = tickProto.destroy;
const protoTickRender = tickProto.render;
const protoTickReplaceMovedLabel = tickProto.replaceMovedLabel;

// Axis prototype extensions
axisProto.init = function (
    this: GroupedAxis,
    chart: Chart,
    options: Partial<GroupedAxisOptions>,
    coll?: AxisCollectionKey
): void {
    protoAxisInit.call(this, chart, options, coll);

    if (isObject(options) && options.categories) {
        this.setupGroups(options);
    }
};

// Setup required axis options
axisProto.setupGroups = function (this: GroupedAxis, options: Partial<GroupedAxisOptions>): void {
    const axis = this;
    const chart = axis.chart;
    const categories = deepClone(options.categories || []);
    const reverseTree: GroupedCategory[] = [];
    const stats: { depth: number } = { depth: 0 };
    const labelOptions = axis.options.labels;
    const userAttr = labelOptions && labelOptions.groupedOptions;
    const css = labelOptions && labelOptions.style;

    buildTree(categories, reverseTree, stats);
    axis.isGrouped = stats.depth !== 0;

    if (axis.isGrouped) {
        axis.categoriesTree = categories;
        axis.categories = reverseTree;
        axis.labelsDepth = stats.depth;
        axis.labelsSizes = [];
        axis.labelsGridPath = [];
        axis.tickLength = options.tickLength || axis.tickLength || null;
        axis.tickWidth = pick(options.tickWidth, axis.isXAxis ? 1 : 0);
        axis.directionFactor = [-1, 1, 1, -1][axis.side];
        axis.options.lineWidth = pick(options.lineWidth, 1);
        axis.groupFontHeights = [];
        
        for (let i = 0; i <= stats.depth; i++) {
            const hasOptions = userAttr && userAttr[i - 1];
            const mergedCSS = hasOptions && userAttr[i - 1].style ? merge(css, userAttr[i - 1].style) : css;
            axis.groupFontHeights[i] =
              Math.round(fontMetrics(mergedCSS.fontSize ? mergedCSS.fontSize : 0, chart).b * 0.3); // TODO why * 0.3?
        }
    }
};

axisProto.render = function (this: GroupedAxis): boolean | void {
    const axis = this;

    if (axis.isGrouped) {
        axis.labelsGridPath = [];
    }

    if (axis.originalTickLength === undefined) {
        axis.originalTickLength = axis.options.tickLength;
    }

    axis.options.tickLength = axis.isGrouped ? 0.001 : axis.originalTickLength;

    protoAxisRender.call(axis);

    if (!axis.isGrouped) {
        if (axis.labelsGrid) {
            axis.labelsGrid.attr({ visibility: 'hidden' });
        }
        return false;
    }

    const options = axis.options;
    const top = axis.top;
    const left = axis.left;
    const right = left + axis.width;
    const bottom = top + axis.height;
    const visible = axis.hasVisibleSeries || axis.hasData;
    let depth = axis.labelsDepth || 0;
    let grid = axis.labelsGrid;
    const horiz = axis.horiz;
    const d = axis.labelsGridPath;
    let i = options.drawHorizontalBorders === false ? (depth + 1) : 0; // TODO: check if this is needed
    let offset = axis.opposite ? (horiz ? top : right) : (horiz ? bottom : left);
    const tickWidth = axis.tickWidth || 0;
    let part: number[];

    if (axis.userTickLength) {
        depth -= 1;
    }

    if (!grid) {
        grid = axis.labelsGrid = axis.chart.renderer.path()
            .attr({
                strokeWidth: tickWidth,
                'stroke-width': tickWidth,
                stroke: options.tickColor || ''
            })
            .add(axis.axisGroup);

        if (!options.tickColor) {
            grid.addClass('highcharts-tick');
        }
    }

    while (i <= depth) {
        offset += axis.groupSize(i);
        part = horiz ? [left, offset, right, offset] : [offset, top, offset, bottom];
        addGridPart(d, part, tickWidth);
        i++;
    }

    // TODO: fix it
    grid.attr({ d: d as unknown as SVGPath, visibility: visible ? 'visible' : 'hidden' });
    axis.labelGroup?.attr({ visibility: visible ? 'visible' : 'hidden' });

    // TODO check if this assertion is correct, fix it
    walk((axis.categoriesTree || []) as GroupedCategory[], 'categories', (group: GroupedCategory): boolean => {
        const tick = group.tick;

        if (!tick) { return false; }

        if ((axis.min && tick.startAt! + tick.leaves! - 1 < axis.min) || (axis.max && tick.startAt! > axis.max)) {
            tick.label?.hide();
            tick.destroyed = 0;
        } else {
            tick.label?.attr({ visibility: visible ? 'visible' : 'hidden' });
        }

        return true;
    });

    return true;
};

axisProto.setCategories = function (
    this: GroupedAxis,
    newCategories: Array<GroupedCategory | string>,
    doRedraw?: boolean
): void {
    const axis = this;

    if (axis.categories) {
        axis.cleanGroups();
    }

    axis.setupGroups({ categories: newCategories });
    axis.categories = axis.userOptions.categories = newCategories;

    if (axis.categories.every((cat): boolean => isString(cat))) {
        protoAxisSetCategories.call(axis, axis.categories as string[], doRedraw);
    }
};

axisProto.cleanGroups = function (): void {
    const axis = this;
    const ticks = axis.ticks;

    for (const n in ticks) {
        if (ticks[n].parent) {
            delete (ticks[n]).parent;
        }
    }

    // TODO check it here, fix it
    walk((axis.categoriesTree || []) as GroupedCategory[], 'categories', (group: GroupedCategory): boolean => {
        const tick = group.tick;

        if (!tick) { return false; }

        tick.label?.destroy();
        objectEach(tick, (_v: GroupedTick[keyof GroupedTick], i: keyof GroupedTick): boolean => delete tick[i]);

        delete group.tick;
        return true;
    });

    axis.labelsGrid = null;
};

axisProto.groupSize = function (this: GroupedAxis, level: number | boolean, position?: number): number {
    const axis = this;
    const positions = (axis.labelsSizes || []);
    const direction = (axis.directionFactor || 1);
    const groupedOptions = axis.options.labels && axis.options.labels.groupedOptions && isNumber(level) ?
        axis.options.labels.groupedOptions[level - 1] : false;
    let userXY = 0;

    if (groupedOptions) {
        if (direction === -1) {
            userXY = groupedOptions.x || 0;
        } else {
            userXY = groupedOptions.y || 0;
        }
    }

    if (isNumber(level) && position !== undefined) {
        // TODO - Why + 10? Should be like this for sure? Try use label.distance here
        positions[level] = Math.max(positions[level] || 0, position + 10 + Math.abs(userXY));
    }

    if (level === true) {
        return sum(positions) * direction;
    } else if (isNumber(level) && positions[level]) {
        return positions[level] * direction;
    }

    return 0;
};

// Tick prototype extensions
tickProto.addLabel = function (this: GroupedTick): boolean {
    const tick = this;
    const axis = tick.axis;
    const labelOptions = pick(tick.options && tick.options.labels, axis.options.labels);

    let category: string | GroupedCategory;

    // Initialize topLabelSize on the axis
    axis.topLabelSize = 0;

    protoTickAddLabel.call(tick);

    // Not grouped axis should not be affected, #228
    if (!axis.isGrouped) {
        return false;
    }

    if (!axis.categories || !(category = axis.categories[tick.pos])) {
        return false;
    }

    if (tick.label) {
        const formatter = function (ctx: AxisLabelFormatterContextObject): string {
            if (labelOptions.formatter) {
                return labelOptions.formatter.call(ctx, ctx);
            }

            if (labelOptions.format) {
                ctx.text = axis.defaultLabelFormatter.call(ctx);
                return format(labelOptions.format, ctx, axis.chart);
            }

            return axis.defaultLabelFormatter.call(ctx);
        };

        tick.label.attr('text', formatter({
            axis: axis as Axis, // TODO: fix it
            tick: tick as Tick, // TODO: fix it
            chart: axis.chart,
            isFirst: !!tick.isFirst,
            isLast: !!tick.isLast,
            value: isObject(category) ? category.name : category,
            pos: tick.pos
        }));

        tick.label.textPxLength = tick.label.getBBox().width;
    }

    if (axis.isGrouped && axis.options.labels.enabled && !isString(category)) {
        tick.addGroupedLabels(category);
    }

    return true;
};

tickProto.addGroupedLabels = function (this: GroupedTick, category: GroupedCategory): void {
    const tick = this;
    const axis = tick.axis;
    const chart = axis.chart;
    const options = axis.options.labels;
    const useHTML = options.useHTML;
    const css = options.style;
    const userAttr = options.groupedOptions;
    const attr = { align: 'center' as const, rotation: options.rotation, x: 0, y: 0, style: undefined };
    const sizeKey = axis.horiz ? 'height' : 'width';

    let depth = 0;
    let label: SVGElement;
    let currentTick: GroupedTick | undefined = tick;
    let currentCategory: GroupedCategory | undefined = category;

    while (currentTick) {
        if (currentCategory && depth > 0 && !currentCategory.tick) {
            tick.value = currentCategory.name;
            const ctx = {
                chart,
                axis: axis as Axis, // TODO: fix it
                tick: tick as Tick, // TODO: fix it
                isFirst: !!tick.isFirst,
                isLast: !!tick.isLast,
                value: currentCategory.name,
                pos: tick.pos
            };
            const name = options.formatter ? options.formatter.call(ctx, ctx) : currentCategory.name;
            const hasOptions = userAttr && userAttr[depth - 1];
            const mergedAttrs = hasOptions ? merge(attr, userAttr[depth - 1]) : attr;
            const mergedCSS = hasOptions && userAttr[depth - 1].style ? merge(css, userAttr[depth - 1].style) : css;

            delete mergedAttrs.style;

            label = chart.renderer.text(name, 0, 0, useHTML).attr(mergedAttrs).add(axis.labelGroup);

            if (label && !chart.styledMode) {
                label.css(mergedCSS);
            }

            currentTick.startAt = tick.pos;
            currentTick.childCount = (currentCategory.categories || []).length;
            currentTick.leaves = currentCategory.leaves;
            currentTick.visible = !!currentTick.childCount;
            currentTick.label = label;
            currentTick.labelOffsets = { x: mergedAttrs.x, y: mergedAttrs.y };

            currentCategory.tick = currentTick;
        }

        if (currentTick && currentTick.label) {
            axis.groupSize(depth, (currentTick.label.getBBox())[sizeKey]);
        }

        currentCategory = currentCategory?.parent;

        if (currentCategory) {
            currentTick = currentTick.parent = currentCategory.tick || {} as GroupedTick;
        } else {
            currentTick = undefined;
        }

        depth++;
    }
};

tickProto.render = function (index: number, old?: boolean, opacity?: number): void {
    protoTickRender.call(this, index, old, opacity);

    const tick = this;
    const axis = tick.axis;
    const treeCat = axis.categories && axis.categories[tick.pos];

    if (!axis.isGrouped || !treeCat || (axis.max && tick.pos > axis.max)) {
        return;
    }

    const tickPos = tick.pos;
    const isFirst = tick.isFirst;
    const max = axis.max;
    const min = axis.min;
    const horiz = axis.horiz;
    const grid = axis.labelsGridPath;
    const tickWidth = axis.tickWidth || 0;
    const xy = tickPosition(tick, tickPos);
    const start = horiz ? xy.y : xy.x;
    const baseLine = fontMetrics(
        axis.options.labels.style.fontSize ? axis.options.labels.style.fontSize : 0, axis.chart
    ).b;

    let group = tick;
    let size = axis.groupSize(0);
    let depth = 1;
    let reverseCrisp = ((horiz && xy.x === axis.pos + axis.len) || (!horiz && xy.y === axis.pos)) ? -1 : 0;
    let gridAttrs: number[];
    let lvlSize: number;
    let minPos: PositionObject;
    let maxPos: PositionObject;
    let attrs: { x: number; y: number };
    let bBox: BBoxObject | undefined;

    if (isFirst) {
        gridAttrs = horiz ?
            [axis.left, xy.y, axis.left, xy.y + axis.groupSize(true)] :
            axis.isXAxis ?
                [xy.x, axis.top, xy.x + axis.groupSize(true), axis.top] :
                [xy.x, axis.top + axis.len, xy.x + axis.groupSize(true), axis.top + axis.len];

        addGridPart(grid, gridAttrs, tickWidth);
    }

    if (horiz && axis.left < xy.x) {
        addGridPart(grid, [xy.x - reverseCrisp, xy.y, xy.x - reverseCrisp, xy.y + size], tickWidth);
    } else if (!horiz && axis.top <= xy.y) {
        addGridPart(grid, [xy.x, xy.y + reverseCrisp, xy.x + size, xy.y + reverseCrisp], tickWidth);
    }

    size = start + size;

    function fixOffset(tCat: string | GroupedCategory): number {
        let ret = 0;

        if (isFirst && !isString(tCat)) {
            ret = (tCat.parent?.categories || []).indexOf(tCat.name);
            ret = ret < 0 ? 0 : ret;
            return ret;
        }

        return ret;
    }

    while (group.parent) {
        group = group.parent;

        const fix = fixOffset(treeCat);
        const userX = group.labelOffsets?.x || 0;
        const userY = group.labelOffsets?.y || 0;

        minPos = tickPosition(tick, min ? Math.max(group.startAt! - 1, min - 1) : group.startAt! - 1);
        maxPos = tickPosition(
            tick,
            max ? Math.min(group.startAt! + group.leaves! - 1 - fix, max) : group.startAt! + group.leaves! - 1 - fix
        );
        bBox = group.label?.getBBox(true);
        lvlSize = axis.groupSize(depth);
        reverseCrisp = ((horiz && maxPos.x === axis.pos + axis.len) || (!horiz && maxPos.y === axis.pos)) ? -1 : 0;

        // TODO - check y position calculation
        attrs = horiz ? {
            x: (minPos.x + maxPos.x) / 2 + userX,
            y: (size) + ((axis).groupFontHeights?.[depth] || 0) + lvlSize / 2 + userY / 2
        } : {
            x: (size) + lvlSize / 2 + userX,
            y: (minPos.y + maxPos.y - (bBox?.height || 0)) / 2 + baseLine + userY
        };

        if (!isNaN(attrs.x) && !isNaN(attrs.y)) {
            group.label?.attr(attrs);

            if (grid) {
                if (horiz && axis.left < maxPos.x) {
                    addGridPart(
                        grid,
                        [maxPos.x - reverseCrisp, size, maxPos.x - reverseCrisp, size + lvlSize],
                        tickWidth
                    );
                } else if (!horiz && axis.top <= maxPos.y) {
                    addGridPart(
                        grid,
                        [size, maxPos.y + reverseCrisp, size + lvlSize, maxPos.y + reverseCrisp],
                        tickWidth
                    );
                }
            }
        }

        size = size + lvlSize;
        depth++;
    }
};

tickProto.destroy = function (): void {
    const tick = this;
    let group = tick.parent;

    while (group) {
        group.destroyed = group.destroyed ? (group.destroyed + 1) : 1;
        group = group.parent;
    }

    protoTickDestroy.call(tick);
};

tickProto.getLabelSize = function (): number {
    const tick = this;
    const axis = tick.axis;

    if (axis.isGrouped === true) {
        const size = protoTickGetLabelSize.call(tick) + 10; // TODO - Why + 10, label.distance here?
        const topLabelSize = (axis.labelsSizes?.[0] || 0);

        if (topLabelSize < size) {
            if (!axis.labelsSizes) {
                axis.labelsSizes = [];
            }

            axis.topLabelSize = axis.labelsSizes[0];
            axis.labelsSizes[0] = size;
        }

        return sum(axis.labelsSizes || []);
    }

    return protoTickGetLabelSize.call(tick);
};

tickProto.replaceMovedLabel = function (): void {
    const tick = this;

    if (!tick.axis.isGrouped) {
        protoTickReplaceMovedLabel.call(tick);
    } else {
        // Get rid of unnecessary duplicated label, #222
        const movedLabel = this.movedLabel;

        if (movedLabel) {
            movedLabel.destroy();
            delete this.movedLabel;
        }
    }
};
