import { Options, Container, CSSNamespace} from './types';

export class Defaults {
    constructor(container: Container,config: Options) {
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
        
        Object.assign(config, {
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
                style: config.handle?.style || 'round' 
            },
            ribbon: {
                show: config.ribbon?.show != undefined ? config.ribbon?.show : true,
                notchSteps: config.ribbon?.notchSteps != undefined ? config.ribbon?.notchSteps : true,
            },
            ticks: {
                data:config.ticks?.data || [],
                style:config.ticks?.style || 'scale',
                snap: config.ticks?.snap !== undefined ? config.ticks?.snap : true,
                labelsClickable:config.ticks?.labelsClickable !== undefined ? config.ticks.labelsClickable : true,
                position:config.ticks?.position || 'auto'
            },
            dataBinding: {
                bind: config.dataBinding?.bind || window[container.getAttribute('wbn-bind') || ''] || undefined,
                transform: config.dataBinding?.transform || window[container.getAttribute('wbn-bind-transform') || ''] || null,    
            },
            onReady: config.onReady || blankCallback,
            onUpdate: config.onUpdate || blankCallback
        
        });
        
        return config;
    }
}

