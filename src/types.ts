export const CSSNamespace: string = 'wbn_ds_';

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
    borderRadius: number | Function | 'auto'
}

export interface Ribbon {
    show: boolean,
    notchSteps: boolean
}

export interface Tick {
    value: number,
    label: number | Function,
    style: 'scale' | 'bubble' | undefined,
    position: 'auto' | 'bottom' | 'top' | undefined
}

export interface Ticks {
    data: Tick[] | Function | null,
    responsive: true,
    labelsClickable: boolean,
    style: 'scale' | 'bubble',
    position: 'auto' | 'bottom' | 'top' | 'center',
    snap: boolean,
    onTick: Function
}

export interface Tooltip {
   show: boolean,
   style: 'round' | 'square',
   position: 'handle' | 'bottom' | 'top' | 'auto'
}

export interface DataBinding {
    bind: any | undefined,
    transform: Function
}

export type Container = Element;

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
}