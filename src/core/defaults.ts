import { Options, CSSNamespace} from './types';

export class Defaults {
    constructor(container: any,config: Options) {
        
        /* destructure incoming config */
        const { range, orientation, direction, bar, responsive, defaultValue, handle, ribbon, tooltips, ticks, caps, dataBinding, arrowKeys, onReady, onUpdate, onDrag, onDragEnd } = config;
        
        /* let devs know if config invalid */
        const errors = [
            [(!config),'No DataSlider configuration specified.'],
            [(!range),'No range defined in the DataSlider configuration.']
        ];
        
        errors.forEach((errorArr) => { if (errorArr[0]) throw new Error((errorArr[1]).toString()); });
        
        /* placeholder callback as default */
        const blankCallback = function(this: any) { return this; }; 
        
        /* infer decimals from step if not provided */
        const countDecimals = function (value: number) {
            if(Math.floor(value) === value) return 0;
            return value.toString().split(".")[1].length || 0; 
        }
        
        /* assigned passed config with defaults when not specified */
        Object.assign(config, {
            orientation: orientation || 'horizontal',
            direction: direction || (orientation === 'vertical' ? 'up' : 'right'),
            bar: {
                thickness: bar?.thickness || 10,
                backgroundColor: bar?.backgroundColor || '#000000',
                hoverColor: bar?.hoverColor || '#909090',
                className: bar?.className || CSSNamespace + 'slider',
                borderRadius: bar?.borderRadius !== undefined ? bar?.borderRadius : 10
            },
            responsive: responsive !== undefined ? responsive : true,
            defaultValue: defaultValue || window[container.getAttribute('wbn-bind') || ''] || range?.min  || 0,
            range: {
                min: range?.min !== undefined ? range?.min : 0,
                max: range?.max !== undefined ? range?.max : 100,
                step: range?.step !== undefined ? range?.step : 1,
                decimals: range?.decimals || countDecimals(Number(range?.step)) || 0
            },
            handle: {
                show: handle?.show !== undefined ? handle?.show : true,
                width: handle?.width || null,
                height: handle?.height || null,
                borderRadius: handle?.borderRadius || null,
                color: handle?.color || ribbon?.color || '#ccc',
                style: handle?.style || null,
                hoverColor: handle?.hoverColor || handle?.color || '#c0c0c0',
                position: handle?.position || 0,
                className:handle?.className || null,
                label: handle?.label || null
            },
            ribbon: {
                show: ribbon?.show !== undefined ? ribbon?.show : true,
                color: ribbon?.color || '#ccc',
                hoverColor: ribbon?.hoverColor || ribbon?.color || '#c0c0c0',
            },
            tooltips: {
                show: tooltips?.show !== undefined ? tooltips?.show : true,
                position: tooltips?.position || 0,
                label: {
                    text: tooltips?.label?.text || null,
                    style: tooltips?.label?.style || null
                },
                ticks: {
                    show: tooltips?.ticks?.show !== undefined ? tooltips?.ticks?.show : true,
                    label: {
                        text: tooltips?.ticks?.label?.text || tooltips?.label?.text || null,
                        style: tooltips?.ticks?.label?.style || tooltips?.label?.style || null,
                    }
                },
                style: tooltips?.style || null
            },
            ticks: {
                marks: ticks?.marks || [],
                labels: {
                    data: ticks?.labels?.data || [],
                    style: ticks?.labels?.style || null,
                    hoverStyle: ticks?.labels?.hoverStyle || null,
                    selectedStyle: ticks?.labels?.selectedStyle || null,
                    snap: ticks?.labels?.snap !== undefined ? ticks?.labels?.snap : false,
                    labelsClickable: ticks?.labels?.labelsClickable !== undefined ? ticks.labels?.labelsClickable : true,
                    position: ticks?.labels?.position,
                    onTick: ticks?.labels?.onTick || blankCallback,
                    className: ticks?.labels?.className || null
                }
            },
            caps: {
                startCap: caps?.startCap || null,
                endCap: caps?.endCap || null,
            },
            dataBinding: {
                scope: dataBinding?.scope || window,
                property: dataBinding?.property || null,
                transform: dataBinding?.transform || window[container.getAttribute('wbn-bind-transform') || ''] || null,    
            },
            arrowKeys: arrowKeys !== undefined ? arrowKeys : true,
            onReady: onReady || blankCallback,
            onUpdate: onUpdate || blankCallback,
            onDrag: onDrag || blankCallback,
            onDragEnd: onDragEnd || blankCallback,
        });
        
        return config;
    }
}

