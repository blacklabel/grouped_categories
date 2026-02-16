import * as _Highcharts from "highcharts/highcharts";
export function factory(highcharts: typeof Highcharts): void;
export default factory;
export let Highcharts: typeof _Highcharts;

/**
 * Grouped category definition with nested categories
 */
export interface GroupedCategory {
    name: string;
    categories: Array<string | GroupedCategory>;
}

/**
 * Category type that supports both simple strings and grouped categories
 */
export type GroupedCategoryType = string | GroupedCategory;

/**
 * Options for styling grouped category labels at different hierarchy levels
 */
export interface GroupedLabelsOptions {
    align?: Highcharts.AlignValue;
    rotation?: number;
    style?: Highcharts.CSSObject;
    x?: number;
    y?: number;
}

/**
 * Extended XAxisLabelsOptions with grouped categories support
 */
export interface GroupedXAxisLabelsOptions extends Highcharts.XAxisLabelsOptions {
    groupedOptions?: GroupedLabelsOptions[];
}

/**
 * Extended YAxisLabelsOptions with grouped categories support
 */
export interface GroupedYAxisLabelsOptions extends Highcharts.YAxisLabelsOptions {
    groupedOptions?: GroupedLabelsOptions[];
}

/**
 * Extended XAxisOptions with grouped categories support.
 * Use this interface when defining x-axis with grouped/nested categories.
 */
export interface GroupedXAxisOptions extends Omit<Highcharts.XAxisOptions, 'categories' | 'labels'> {
    categories?: GroupedCategoryType[];
    labels?: GroupedXAxisLabelsOptions;
}

/**
 * Extended YAxisOptions with grouped categories support.
 * Use this interface when defining y-axis with grouped/nested categories.
 */
export interface GroupedYAxisOptions extends Omit<Highcharts.YAxisOptions, 'categories' | 'labels'> {
    categories?: GroupedCategoryType[];
    labels?: GroupedYAxisLabelsOptions;
}

/**
 * Extended Highcharts.Options with grouped categories support.
 * Use this interface for chart options when using grouped categories.
 */
export interface GroupedCategoriesOptions extends Omit<Highcharts.Options, 'xAxis' | 'yAxis'> {
    xAxis?: GroupedXAxisOptions | GroupedXAxisOptions[];
    yAxis?: GroupedYAxisOptions | GroupedYAxisOptions[];
}
