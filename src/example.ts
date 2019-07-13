import { Forms } from '.';

@Forms.Form
class MyForm {

    @Forms.Input()
    name: string

    @Forms.Input({dtype: "email"})
    email: string
}

console.log(Forms.getSchema(MyForm))

/**
 * 
 * @example 
 * [ { required: undefined,
 *     key: 'name',
 *     type: 'input',
 *     value_type: 'text',
 *     disabled: undefined,
 *     default: 'name',
 *     max_length: undefined,
 *     min_length: undefined,
 *     widget: undefined },
 *   { required: undefined,
 *     key: 'email',
 *     type: 'input',
 *     value_type: 'email',
 *     disabled: undefined,
 *     default: 'email',
 *     max_length: undefined,
 *     min_length: undefined,
 *     widget: undefined } ]
 */