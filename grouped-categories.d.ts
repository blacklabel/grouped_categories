import type * as _Highcharts from "highcharts/highcharts";
export function factory(highcharts: typeof Highcharts): void;
export default factory;
export let Highcharts: typeof _Highcharts;

declare module 'highcharts' {
    /**
     * Grouped category definition with nested categories
     */
    interface GroupedCategory {
        name: string;
        categories: Array<string | GroupedCategory>;
    }

    /**
     * Category type that supports both simple strings and grouped categories
     */
    type GroupedCategoryType = string | GroupedCategory;

    /**
     * Options for styling grouped category labels at different hierarchy levels
     */
    interface GroupedLabelsOptions {
        align?: AlignValue;
        rotation?: number;
        style?: CSSObject;
        x?: number;
        y?: number;
    }

    /**
     * Extended XAxisLabelsOptions with grouped categories support
     */
    interface GroupedXAxisLabelsOptions extends XAxisLabelsOptions {
        groupedOptions?: GroupedLabelsOptions[];
    }

    /**
     * Extended YAxisLabelsOptions with grouped categories support
     */
    interface GroupedYAxisLabelsOptions extends YAxisLabelsOptions {
        groupedOptions?: GroupedLabelsOptions[];
    }

    /**
     * Extended XAxisOptions with grouped categories support.
     * Use this interface when defining x-axis with grouped/nested categories.
     */
    interface GroupedXAxisOptions extends Omit<XAxisOptions, 'categories' | 'labels'> {
        categories?: GroupedCategoryType[];
        labels?: GroupedXAxisLabelsOptions;
    }

    /**
     * Extended YAxisOptions with grouped categories support.
     * Use this interface when defining y-axis with grouped/nested categories.
     */
    interface GroupedYAxisOptions extends Omit<YAxisOptions, 'categories' | 'labels'> {
        categories?: GroupedCategoryType[];
        labels?: GroupedYAxisLabelsOptions;
    }

    /**
     * Extended Highcharts Options with grouped categories support.
     * Use this interface for chart options when using grouped categories.
     */
    interface GroupedCategoriesOptions extends Omit<Options, 'xAxis' | 'yAxis'> {
        xAxis?: GroupedXAxisOptions | GroupedXAxisOptions[];
        yAxis?: GroupedYAxisOptions | GroupedYAxisOptions[];
    }

    /**
     * Chart function overloads for grouped categories support
     */
    export function chart(options: GroupedCategoriesOptions, callback?: ChartCallbackFunction): Chart;
    export function chart(renderTo: string | HTMLElement, options: GroupedCategoriesOptions, callback?: ChartCallbackFunction): Chart;
}

