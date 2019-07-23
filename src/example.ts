import { Forms } from '.';


// Customize
const RequiredText = () => Forms.Input().Validate(e => e.string().required())
@Forms.Form
class MyForm extends Forms.BaseForm<MyForm> {

    @RequiredText()
    name?: any

    @Forms.Input({dtype: "email"})
    @Forms.Validate(e => e.string().required())
    email: string
}


const data= new MyForm({
    email: 'Test',
    name: "he"
})

console.log(data.validate().then(e => console.log(e)))
console.log(MyForm.getValidationSchema())
console.log(MyForm.getUISchema())
console.log(data)


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