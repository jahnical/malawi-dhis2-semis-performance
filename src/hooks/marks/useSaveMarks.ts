import { useState } from "react";
import { useDataEngine } from "@dhis2/app-runtime"
import { formatTrackerError, useShowAlerts } from "dhis2-semis-functions";

const POST_DATA_VALUE: any = {
    type: 'create',
    params: {
        async: false,
        importStrategy: "CREATE_AND_UPDATE"
    },
    resource: "tracker",
    // id: ({ id }: any) => id,
    data: ({ data }: any) => data
}

type saveMarksType = { id: string, data: object }

export default function useSaveMarks() {
    const engine = useDataEngine()
    const [data, setData] = useState()
    const { hide, show } = useShowAlerts()
    const [error, setError] = useState<boolean>(false)
    const [success, setSuccess] = useState<boolean>(false)
    const [loading, setLoading] = useState<boolean>(false)

    const saveMarks = async (data: any) => {
        setLoading(true);
        return await engine.mutate(POST_DATA_VALUE, {
            variables: { data },
            onComplete: ((resp) => {
                setData(resp);
                setSuccess(true);
                setLoading(false);
                // show({
                //     message: "Marks saved successfully",
                //     type: { success: true }
                // });
                setTimeout(() => { hide; setSuccess(false) }, 3000);
            }),
            onError: ((error) => {
                setError(true);
                setLoading(false);
                show({
                    message: `Could not save the marks: ${formatTrackerError(error)}`,
                    type: { critical: true, duration: 15000 }
                });
                setTimeout(() => { hide; setError(false); }, 3000);
            })
        })
    }

    return { loading, saveMarks, saved: data, error, success }
}