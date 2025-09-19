import type Chart from 'highcharts-github/ts/Core/Chart/Chart';
import type CSSObject from 'highcharts-github/ts/Core/Renderer/CSSObject';
import type {
    AxisCollectionKey,
    AxisOptions,
    AxisLabelOptions
} from 'highcharts-github/ts/Core/Axis/AxisOptions';
import type Time from 'highcharts-github/ts/Core/Time';
import type Tick from 'highcharts-github/ts/Core/Axis/Tick';
import type Axis from 'highcharts-github/ts/Core/Axis/Axis';
import type SVGElement from 'highcharts-github/ts/Core/Renderer/SVG/SVGElement';

interface GroupedLabelOptions extends AxisLabelOptions {
  groupedOptions?: Array<{
      x?: number;
      y?: number;
      style?: CSSObject;
  }>;
  rotation?: number;
}

interface GroupedCategory {
  name: string;
  categories?: Array<GroupedCategory | string>;
  parent?: GroupedCategory;
  leaves?: number;
  tick?: GroupedTick;
}

interface GroupedAxisOptions extends Omit<AxisOptions, 'categories'> {
  categories: Array<GroupedCategory | string>;
  tickLength: number;
  tickWidth: number;
  lineWidth: number;
  tickColor: string;
  labels: GroupedLabelOptions;
  drawHorizontalBorders?: boolean; // TODO: check if this is needed
}

interface GroupedTick extends Omit<Tick, 'axis' | 'options'> {
  value?: string;
  childCount?: number;
  labelOffsets?: {
      x: number;
      y: number;
  };
  leaves?: number;
  startAt?: number;
  visible?: boolean;
  destroyed?: number;
  parent?: GroupedTick;
  options?: GroupedAxisOptions;
  axis: GroupedAxis;
  addGroupedLabels: (this: GroupedTick, category: GroupedCategory) => void;
}

interface AxisLabelFormatterContextObject {
  axis: Axis;
  chart: Chart;
  dateTimeLabelFormat?: Time.DateTimeFormat;
  isFirst: boolean;
  isLast: boolean;
  pos: number;
  text?: string;
  tick: Tick;
  value: number|string;
}

interface GroupedAxis extends Omit<Axis, 'options' | 'userOptions' | 'categories' | 'ticks' | 'init'> {
  options: GroupedAxisOptions;
  userOptions: GroupedAxisOptions;
  categoriesTree?: Array<GroupedCategory | string>;
  categories?: Array<GroupedCategory | string>;
  isGrouped?: boolean;
  labelsDepth?: number;
  labelsSizes?: number[];
  labelsGridPath: Array<string | number>;
  labelsGrid?: SVGElement | null;
  groupFontHeights?: number[];
  directionFactor?: number;
  userTickLength?: boolean;
  originalTickLength?: number;
  tickLength?: number | null;
  tickWidth?: number;
  ticks: Record<string, GroupedTick>;
  init: (chart: Chart, options: Partial<GroupedAxisOptions>, coll?: AxisCollectionKey) => void;
  setupGroups: (options: Partial<GroupedAxisOptions>) => void;
  groupSize: (level: number | boolean, position?: number) => number;
  cleanGroups: () => void;
}

export {
  GroupedLabelOptions,
  GroupedCategory,
  GroupedAxisOptions,
  GroupedTick,
  AxisLabelFormatterContextObject,
  GroupedAxis
};
