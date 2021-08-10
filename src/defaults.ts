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
            height: config.height || 10,
            backgroundColor: config.backgroundColor || null,
            hoverColor: config.hoverColor || null,
            className: config.className || CSSNamespace + 'slider',
            responsive: config.responsive !== undefined ? config.responsive : true,
            defaultValue: config.defaultValue || window[container.getAttribute('wbn-bind') || ''] || 0,
            range: {
                min: config.range?.min || 0,
                max: config.range?.max || 100,
                step: config.range?.step || 1,
                decimals: config.range?.decimals || countDecimals(config.range?.step) || 0
            },
            handle: {
                show: config.handle?.show != undefined ? config.handle?.show : true,
                width: config.handle?.width || 'auto',
                height: config.handle?.height || 'auto',
                borderRadius: config.handle?.borderRadius || 'auto',
                color: config.handle?.color || config.ribbon?.color || null,
                style: config.handle?.style || null,
                hoverColor: config.handle?.hoverColor || config.hoverColor || config.handle?.color || null,
            },
            ribbon: {
                show: config.ribbon?.show != undefined ? config.ribbon?.show : true,
                color: config.ribbon?.color || null,
                hoverColor: config.ribbon?.hoverColor || config.hoverColor || config.ribbon?.color || null,
            },
            tooltip: {
                show: config.tooltip?.show != undefined ? config.tooltip?.show : true,
                position:config.tooltip?.position || 'auto',
                label: {
                    text:config.tooltip?.label?.text || null,
                    style:config.tooltip?.label?.style || null
                },
                ticks: {
                    show:config.tooltip?.ticks?.show || config.tooltip?.show || true,
                    label: {
                        text:config.tooltip?.ticks?.label?.text || config.tooltip?.label?.text || null,
                        style:config.tooltip?.ticks?.label?.style || config.tooltip?.label?.style || null,
                    }
                },
                style: config.tooltip?.style || null
            },
            ticks: {
                data:config.ticks?.data || [],
                style:config.ticks?.style || null,
                snap: config.ticks?.snap !== undefined ? config.ticks?.snap : true,
                labelsClickable:config.ticks?.labelsClickable !== undefined ? config.ticks.labelsClickable : true,
                position:config.ticks?.position || 'auto',
                onTick: config.ticks?.onTick || blankCallback
            },
            dataBinding: {
                scope: config.dataBinding?.scope || window,
                property: config.dataBinding?.property || undefined,
                transform: config.dataBinding?.transform || window[container.getAttribute('wbn-bind-transform') || ''] || null,    
            },
            onReady: config.onReady || blankCallback,
            onUpdate: config.onUpdate || blankCallback,
            onDrag: config.onDrag || blankCallback,
            onDragStart: config.onDragStart || blankCallback,
            onDragEnd: config.onDragEnd || blankCallback,
        });
        
        return config;
    }
}

