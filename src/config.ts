import { Defaults } from './defaults';
import { Options, Container, CSSNamespace} from './types';

export class Config extends Defaults {
    
    constructor(container: Container,config: Options) {
        super(container, config);

        
    }
}