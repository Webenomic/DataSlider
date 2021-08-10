export const CSSNamespace: string = 'wbn_ds_';

export interface Stylable {
    width: number | Function | 'auto',
    height: number | Function | 'auto',
    borderRadius: number | Function | 'auto',
    style: string | Function | undefined,
    color: string | Function | undefined
}

export interface Label {
    text: string | Function | undefined,
    style: string | Function | undefined
}

export interface Range {
    min: number,
    max: number,
    step: number | Function,
    decimals: number
}

export interface Handle extends Stylable {
    show: boolean,
    hoverColor: string | Function | undefined
}

export interface Ribbon {
    show: boolean,
    color: string | Function | undefined,
    hoverColor: string | Function | undefined
}

export interface Tick extends Stylable {
    value: number,
    label: Label,
    position: 'auto' | 'bottom' | 'top' | undefined,
    hoverColor: string | Function | undefined,
    activeColor: string | Function | undefined
}

export interface Ticks extends Stylable {
    data: Tick[] | Function | null,
    responsive: true,
    labelsClickable: boolean,
    position: 'auto' | 'bottom' | 'top' | 'center',
    snap: boolean,
    hoverColor: string | Function | undefined
    activeColor: string | Function | undefined
    onTick: Function
}

export interface Tooltip extends Stylable {
   show: boolean,
   position: 'bottom' | 'top' | 'auto',
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

export interface Options {
    height: number,
    backgroundColor:string | Function | undefined,
    hoverColor:string | Function | undefined,
    className: string,
    responsive: boolean,
    ribbon: Ribbon,
    defaultValue: number,
    range: Range,
    handle: Handle,
    ticks: Ticks,
    tooltip: Tooltip,
    dataBinding: DataBinding,
    onReady: Function,
    onUpdate: Function,
    onDrag: Function,
    onDragStart: Function,
    onDragEnd: Function
}