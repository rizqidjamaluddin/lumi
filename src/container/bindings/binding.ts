import {Container} from "../container";
export abstract class Binding {
    abstract get (container: Container): any;

    protected shared: boolean = false;
    public share(): this {
        this.shared = true;
        return this;
    }

}