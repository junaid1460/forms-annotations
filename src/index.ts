export namespace Forms {
    interface Common {
        required?: boolean;
        disabled?: boolean;
        defaultValue?: any;
        min_length?: number;
        max_length?: number;
        widget?: string;
    }
    export interface Options<T = string> {
        view_value: string;
        value: T;
    }

    export function getSchema(target: any) {
        if (isForm(target)) {
            return (target as any).prototype.___formSchema.map((func: () => any) => func());
        }
    }

    export type AdminInterface<T> = { [name in keyof T]?: T[name] };

    export interface Form {
        ___formSchema: Array<() => any>;
        ___getSchema(): () => any;
    }

    function addToPrototype(cls: any, data: any) {
        makeForm(cls);
        if (isForm(cls)) {
            cls.___formSchema.push(data);
        }
    }

    function makeForm(target: any) {
        if (!Boolean(target.___formSchema)) {
            target.___formSchema = [];
        }
    }

    export function isForm(target: any): target is Form {
        return Boolean(target.___formSchema) || (target.prototype && target.prototype.___formSchema);
    }

    export function form<T>(target: T) {
        if (isForm(target)) {
            (target as any).prototype!.___getSchema = () => {
                return (target as any).prototype.___formSchema.map((func: () => any) => func()) as any;
            };
        } else {
            throw new Error("Form with no fields");
        }
        return target;
    }

    export function input<T>({ required, disabled, defaultValue, max_length, min_length, widget,type }: {type: "text" | "number" | "email"} & Common = {type: 'text'}) {
        return (target: T, propertyKey: string | symbol) => {
            addToPrototype(target, () => ({
                required: required,
                key: propertyKey,
                type: "input",
                value_type: type,
                disabled: disabled,
                default: defaultValue || propertyKey,
                max_length: max_length,
                min_length: min_length,
                widget: widget,
            }));
        };
    }

    export function custom<T>({ widget }: { widget: string }) {
        return (target: T, propertyKey: string | symbol) => {
            addToPrototype(target, () => ({
                key: propertyKey,
                type: "custom",
                widget: widget,
            }));
        };
    }

    export function number<T>({ required, defaultValue, disabled, widget, min_length, max_length }: {} & Common = {}) {
        return (target: T, propertyKey: string | symbol) => {
            addToPrototype(target, () => ({
                required: required,
                key: propertyKey,
                type: "number",
                disabled: disabled,
                default: defaultValue || propertyKey,
                max_length: max_length,
                min_length: min_length,
                widget: widget,
            }));
        };
    }

    export function list<T>({
        required,
        defaultValue,
        disabled,
        listof,
        max_length,
        min_length,
        widget,
    }: { listof: () => any } & Common) {
        return (target: T, propertyKey: string | symbol) => {
            addToPrototype(target, () => {
                const listItem = listof();
                return {
                    required: required,
                    key: propertyKey,
                    type: "list",
                    listof: getSchema(listItem),
                    disabled: disabled,
                    default: defaultValue || propertyKey,
                    max_length: max_length,
                    min_length: min_length,
                    widget: widget,
                };
            });
        };
    }

    export function timestamp<T>({ required, defaultValue, disabled, min_length, max_length }: {} & Common = {}) {
        return (target: T, propertyKey: string | symbol) => {
            addToPrototype(target, () => ({
                required: required,
                key: propertyKey,
                type: "timestamp",
                disabled: disabled,
                default: defaultValue || propertyKey,
            }));
        };
    }

    export function select<T>({ options, required, disabled, defaultValue }: { options: Array<Options<T>> } & Common) {
        return <T>(target: T, propertyKey: string | symbol) => {
            addToPrototype(target, () => ({
                required: required,
                options: options,
                key: propertyKey,
                type: "select",
                disabled: disabled,
                default: defaultValue || propertyKey,
            }));
        };
    }

    export function radio<T>({ required, options, defaultValue, disabled }: { options: Options[] } & Common) {
        return (target: T, propertyKey: string | symbol) => {
            addToPrototype(target, () => ({
                required: required,
                options: options,
                key: propertyKey,
                type: "radio",
                disabled: disabled,
                default: defaultValue || propertyKey,
            }));
        };
    }

    export function file<T>({ required, disabled, defaultValue, widget }: {} & Common = {}) {
        return (target: T, propertyKey: string | symbol) => {
            addToPrototype(target, () => ({
                required: required,
                key: propertyKey,
                type: "file",
                default: defaultValue || propertyKey,
                disabled: disabled,
                widget: widget,
            }));
        };
    }

    export function conditionalSubSchema<T>({ branchKey, branches }: { branchKey: keyof T; branches: () => { [name: string]: any } }) {
        return <T>(target: T, propertyKey: string | symbol) => {
            const processedBranches: any = {};
            Object.keys(branches()).forEach((e: string) => {
                const branch = branches()[e];
                processedBranches[e] = getSchema(branch);
            });
            addToPrototype(target, () => ({
                branch_key: branchKey,
                branches: processedBranches,
                key: propertyKey,
                type: "branch",
            }));
        };
    }

    export function subSchema<T>({ schema, widget }: { schema: any; widget?: any }) {
        return (target: T, propertyKey: string | symbol) => {
            addToPrototype(target, () => ({
                key: propertyKey,
                schema: getSchema(schema),
                widget: widget,
                type: "subtype",
            }));
        };
    }
}
