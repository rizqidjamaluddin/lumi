export class BindingNotFoundException {
    public message: string;
    constructor (key: string) {
        this.message = "A binding named " + key + " was requested from the app container, but was not found.";
    }
}