export const CSSNamespace: string = 'wbn_ds_';

export interface Stylable {
    width: number | Function | undefined,
    height: number | Function | undefined,
    borderRadius: number | Function | undefined,
    style: object | Function | undefined,
    color: string | Function | undefined,
    className: string | Function | undefined
}

export interface Label {
    text: string | Function | undefined,
    style: object | Function | undefined,
    className: string | Function | undefined
}

export interface Range {
    min: number,
    max: number,
    step: number | Function,
    decimals: number
}

export interface Handle extends Stylable {
    show: boolean,
    hoverColor: string | Function | undefined,
    position: number,
}

export interface Bar {
    thickness: number,
    backgroundColor: string | Function | undefined,
    className: string | Function | undefined,
    borderRadius: number | Function | undefined,
    hoverColor:string | Function | undefined,
    style: object | Function | undefined,
}

export interface Ribbon extends Stylable {
    show: boolean,
    color: string | Function | undefined,
    hoverColor: string | Function | undefined
}

export interface TickLabel extends Stylable {
    value: number,
    label: Label,
    position: number,
    hoverStyle: object | Function | undefined,
    activeStyle: object | Function | undefined,
}

export interface TickLabels extends Stylable {
    data: TickLabel[] | Function | null,
    responsive: true,
    labelsClickable: boolean,
    position: number,
    snap: boolean,
    style: object | Function | undefined,
    hoverStyle: object | Function | undefined
    selectedStyle: object | Function | undefined,
    onTick: Function
}

export interface TickMark extends Stylable {
    range: Range,
    position: number,
    hoverStyle: object | Function | undefined,
    activeStyle: object | Function | undefined
}

export interface Ticks {
    labels: TickLabels,
    marks: TickMark[]
}

export interface Tooltips extends Stylable {
   show: boolean,
   position: number,
   label: Label,
   ticks: {
        show: boolean,
        label: Label
   }
}

export interface DataBinding {
    scope: any,
    property: any | undefined,
    transform: Function
}

export type Direction = 'right' | 'left' | 'up' | 'down';
export type Orientation = 'horizontal' | 'vertical';

export interface Options {
    orientation: Orientation,
    direction: Direction,
    responsive: boolean,
    defaultValue: number,
    range: Range,
    bar: Bar,
    ribbon: Ribbon,
    handle: Handle,
    ticks: Ticks,
    tooltips: Tooltips,
    dataBinding: DataBinding,
    arrowKeys:boolean,
    onReady: Function,
    onUpdate: Function,
    onDrag: Function,
    onDragStart: Function,
    onDragEnd: Function
}