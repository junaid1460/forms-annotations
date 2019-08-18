import { Forms } from ".";

@Forms.Form
class ActionButton {
    @(Forms.Input().Validate((e) => e.string().required()))
    public action: string;
}
@Forms.Form
class AnotherForm {
    @(Forms.Input().Validate((e) => e.string().required()))
    public label?: string;
}

// Customize
const RequiredText = () => Forms.Input().Validate((e) => e.string().required());
@Forms.Form
class MyForm extends Forms.BaseForm<MyForm> {
    @RequiredText()
    public name?: any;

    @Forms.Input({ dtype: "email" })
    @Forms.Validate((e) => e.string().required())
    public email: string;

    @Forms.Select({
        options: [
            {
                value: "values",
                view_value: "sdfsdf",
            },
            {
                value: "another",
                view_value: "",
            },
        ],
    })
    public options?: any;

    @Forms.Branch<MyForm>({
        branch_key: "options",
        branches: () => ({
            values: ActionButton,
            another: AnotherForm,
        }),
    })
    public test?: AnotherForm | ActionButton;

    @Forms.SubSchema({ schema: AnotherForm })
    public value: AnotherForm;
}

const data = new MyForm({
    email: "junaid1460@gmail.com",
    name: "junaid",
    options: "another",
    test: {
        action: "My label",
    },
    value: {
        label: "Hello world",
    },
});

console.log(data.validate().then((e) => console.log(e)));
console.log(MyForm.getValidationSchema());
console.log(MyForm.getUISchema());
console.log(data);
