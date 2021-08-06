import { Defaults } from './defaults';
import { Options, CSSNamespace} from './types';

export class Config extends Defaults {
    
    constructor(container: any,config: Options) {
        super(container, config);
    }
}