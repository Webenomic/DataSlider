export const CSSNamespace: string = 'wbn_ds_';

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

export interface Handle {
    show: boolean,
    width: number | Function | 'auto',
    height: number | Function | 'auto',
    borderRadius: number | Function | 'auto',
    style: string | undefined,
    label: Label
}

export interface Ribbon {
    show: boolean,
    notchSteps: boolean
}

export interface Tick {
    value: number,
    label: Label,
    width: number | Function | 'auto',
    height: number | Function | 'auto',
    borderRadius: number | Function | 'auto',
    style: string | Function | undefined,
    position: 'auto' | 'bottom' | 'top' | undefined
}

export interface Ticks {
    data: Tick[] | Function | null,
    responsive: true,
    labelsClickable: boolean,
    width: number | Function | 'auto',
    height: number | Function | 'auto',
    borderRadius: number | Function | 'auto',
    style: string | Function | undefined,
    position: 'auto' | 'bottom' | 'top' | 'center',
    snap: boolean,
    onTick: Function
}

export interface Tooltip {
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
    onDragStart: Function,
    onDragEnd: Function
}