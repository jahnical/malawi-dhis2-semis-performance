import { SimpleFieldProps } from "../../types/fieldType";
import SimpleField from "./SimpleField";
import { SingleSelect } from "./marksSelect/SimpleSelectField";

export function performanceFieldsMapping(props: SimpleFieldProps & { fieldType: string, options?: any }) {
    const { fieldType, options, ...rest } = props

    switch (fieldType) {
        case 'LIST': return (
            <SingleSelect {...rest} errorText={rest?.content} options={options} />
        )
        case 'TEXT': return (
            <SimpleField
                {...rest as any}
                inputType="text"
            />
        )
        default: return (
            <SimpleField
                {...rest as any}
            />
        )

    }
}