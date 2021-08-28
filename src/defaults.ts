import { Options, CSSNamespace} from './types';

export class Defaults {
    constructor(container: any,config: Options) {
        const errors = [
            [(!config),'No DataSlider configuration specified.'],
            [(!config?.range),'No range defined in the DataSlider configuration.']
        ];
        
        errors.forEach((errorArr,i) => { if (errorArr[0]) throw new Error((errorArr[1]).toString()); });
        
        const blankCallback = function(this) { return this; }; 
        
        const countDecimals = function (value) {
            if(Math.floor(value) === value) return 0;
            return value.toString().split(".")[1].length || 0; 
        }
        
        const emptyStyle = {
            height: null,
            width: null,
            color: null,
            borderRadius: null
        };
        
        Object.assign(config, {
            orientation: config?.orientation || 'horizontal',
            direction: config?.direction || (config.orientation === 'vertical' ? 'up' : 'right'),
            bar: {
                thickness: config.bar?.thickness || 10,
                backgroundColor: config.bar?.backgroundColor || '#000000',
                hoverColor: config.bar?.hoverColor || '#909090',
                className: config.bar?.className || CSSNamespace + 'slider',
                borderRadius: config.bar?.borderRadius !== undefined ? config.bar?.borderRadius : 10
            },
            responsive: config?.responsive !== undefined ? config.responsive : true,
            defaultValue: config?.defaultValue || window[container.getAttribute('wbn-bind') || ''] || config.range?.min  || 0,
            range: {
                min: config.range?.min !== undefined ? config.range?.min : 0,
                max: config.range?.max !== undefined ? config.range?.max : 100,
                step: config.range?.step !== undefined ? config.range?.step : 1,
                decimals: config.range?.decimals || countDecimals(config.range?.step) || 0
            },
            handle: {
                show: config.handle?.show !== undefined ? config.handle?.show : true,
                width: config.handle?.width || null,
                height: config.handle?.height || null,
                borderRadius: config.handle?.borderRadius || null,
                color: config.handle?.color || config.ribbon?.color || '#ccc',
                style: config.handle?.style || null,
                hoverColor: config.handle?.hoverColor || config.handle?.color || '#c0c0c0',
                position: config.handle?.position || 0,
                className:config.handle?.className || null,
                label: config.handle?.label || null
            },
            ribbon: {
                show: config.ribbon?.show !== undefined ? config.ribbon?.show : true,
                color: config.ribbon?.color || '#ccc',
                hoverColor: config.ribbon?.hoverColor || config.ribbon?.color || '#c0c0c0',
            },
            tooltips: {
                show: config.tooltips?.show !== undefined ? config.tooltips?.show : true,
                position:config.tooltips?.position || -15,
                label: {
                    text:config.tooltips?.label?.text || null,
                    style:config.tooltips?.label?.style || null
                },
                ticks: {
                    show:config.tooltips?.ticks?.show !== undefined ? config.tooltips?.ticks?.show : true,
                    label: {
                        text:config.tooltips?.ticks?.label?.text || config.tooltips?.label?.text || null,
                        style:config.tooltips?.ticks?.label?.style || config.tooltips?.label?.style || null,
                    }
                },
                style: config.tooltips?.style || null
            },
            ticks: {
                marks: config.ticks?.marks || [],
                labels: {
                    data:config.ticks?.labels?.data || [],
                    style:config.ticks?.labels?.style || null,
                    hoverStyle:config.ticks?.labels?.hoverStyle || null,
                    selectedStyle:config.ticks?.labels?.selectedStyle || null,
                    snap: config.ticks?.labels?.snap !== undefined ? config.ticks?.labels?.snap : false,
                    labelsClickable:config.ticks?.labels?.labelsClickable !== undefined ? config.ticks.labels?.labelsClickable : true,
                    position:config.ticks?.labels?.position,
                    onTick: config.ticks?.labels?.onTick || blankCallback,
                    className: config.ticks?.labels?.className || null
                }
            },
            caps: {
                startCap: config.caps?.startCap || null,
                endCap: config.caps?.endCap || null,
            },
            dataBinding: {
                scope: config.dataBinding?.scope || window,
                property: config.dataBinding?.property || null,
                transform: config.dataBinding?.transform || window[container.getAttribute('wbn-bind-transform') || ''] || null,    
            },
            arrowKeys: config.arrowKeys !== undefined ? config.arrowKeys : true,
            onReady: config.onReady || blankCallback,
            onUpdate: config.onUpdate || blankCallback,
            onDrag: config.onDrag || blankCallback,
            onDragStart: config.onDragStart || blankCallback,
            onDragEnd: config.onDragEnd || blankCallback,
        });
        
        return config;
    }
}

