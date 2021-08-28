import { Defaults } from './defaults';
import { Options, CSSNamespace} from './types';

export class Config extends Defaults {
    
    constructor(container: any,config: Options) {

        const min = config.range.min;
        const max = config.range.max;
        //insure range is range
        if (min == max || min > max) console.error(`Range ${min}-${max} does not specify a min value lower than max.`);
        
        //insure default value within range
        const _clamp = (val) => { return [val,config.range.min,config.range.max]; }
        
        config.defaultValue = ((...args) => {
            const [val,min,max] = args; 
            if (val > max || val < min) console.error(`Default value ${val} out of range. Using min value ${min} instead.`);
            return val > max ? max : val < min ? min : val; 
        })
        .apply(null,_clamp(config.defaultValue));

        super(container, config);
    }
}