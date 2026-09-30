import { format } from 'date-fns';
import { useRecoilState } from 'recoil';
import { useEffect, useMemo, useRef, useState } from 'react';
import useSaveMarks from '../../hooks/marks/useSaveMarks';
import { EnrollmentStatus, TableDataRefetch } from 'dhis2-semis-types';
import { RulesEngine, useUploadEvents, useUrlParams } from 'dhis2-semis-functions';
import { performanceFieldsMapping } from './performanceFieldsMapping';
import { getTermRemarkDataValue, PerformanceConfig } from '../../utils/marks/termRemarks';
import { getGradeDataValue } from '../../utils/marks/gradeFromScore';
import { subjectsForGrade } from '../../utils/subjects/subjectsForGrade';

interface valueType extends Record<string, any> {
    enrollmentId: string
    orgUnitId: string
    programId: string
    programStageEvent: string
    status: EnrollmentStatus
    trackedEntity: string
}

type FieldsPerformancePros = {
    dataElements: any,
    value: valueType,
    otherProps: any,
    program: string
    originalData: any
    performanceConfig?: PerformanceConfig
    onRowUpdate?: (matcher: (row: Record<string, any>) => boolean, patch: Record<string, any>) => void
}

export default function FieldsPerformance(props: FieldsPerformancePros) {
    const { urlParameters } = useUrlParams()
    const { programStage, schoolName, grade } = urlParameters
    const { dataElements, value, program, originalData, performanceConfig, onRowUpdate } = props;
    const [values, setValues] = useState({ ...value })

    const { uploadValues } = useUploadEvents()
    const { saveMarks, error, loading, success } = useSaveMarks()

    const memoizedValues = useMemo(() => values, [JSON.stringify(values)]);
    const memoizedDataElements = useMemo(() => [dataElements], [JSON.stringify(dataElements)]);

    const { runRulesEngine, updatedVariables } = RulesEngine({
        values: memoizedValues, program: program, type: "programStage", variables: memoizedDataElements as any,
    })

    const [newMark, setNewMark] = useState(updatedVariables[0].value)
    const [refetch, setRefetch] = useRecoilState(TableDataRefetch);

    useEffect(() => {
        runRulesEngine({ overrideValues: memoizedValues, overrideVariables: memoizedDataElements as any })
    }, [value, newMark])

    // Picks up a value patched into this row from elsewhere (e.g. a grade auto-computed by
    // the paired score field's own save) without needing a full table refetch. Compares
    // against the previously seen prop, not against newMark, so this never fires on mount
    // or fights with the user's own in-progress typing.
    const prevExternalValue = useRef(dataElements?.value)
    useEffect(() => {
        if (prevExternalValue.current !== dataElements?.value) {
            prevExternalValue.current = dataElements?.value
            setNewMark(dataElements?.value)
        }
    }, [dataElements?.value])

    const handleChange = (e: any) => {
        const newValue = e?.target?.value ?? e
        setNewMark(newValue)

        // Update the values in the state
        setValues((prevValues) => ({
            ...prevValues,
            [dataElements.id]: newValue
        }))

        runRulesEngine({ overrideValues: memoizedValues, overrideVariables: memoizedDataElements as any })
    }

    const handleBlur = async () => {
        const applicableSubjectIds = subjectsForGrade(performanceConfig, grade)
        const termRemarkDataValue = getTermRemarkDataValue({
            rowData: originalData,
            editedScoreDataElement: dataElements?.id ?? "",
            editedScore: newMark,
            performanceConfig,
            applicableSubjectIds
        })
        const gradeDataValue = getGradeDataValue({
            editedScoreDataElement: dataElements?.id ?? "",
            editedScore: newMark,
            performanceConfig
        })
        const dataValues = [
            { value: newMark, dataElement: dataElements?.id },
            ...(termRemarkDataValue ? [termRemarkDataValue] : []),
            ...(gradeDataValue ? [gradeDataValue] : [])
        ]

        if (!values?.programStageEvent) {
            const data = {
                events: [{
                    notes: [],
                    status: "COMPLETED",
                    orgUnitName: schoolName!,
                    orgUnit: value?.orgUnitId,
                    program: value?.programId,
                    programStage: programStage!,
                    event: value?.programStageEvent,
                    enrollment: value?.enrollmentId,
                    trackedEntity: value?.trackedEntity,
                    occurredAt: format(new Date(), "yyyy-MM-dd"),
                    scheduledAt: format(new Date(), "yyyy-MM-dd"),
                    dataValues
                }]
            }

            await uploadValues(data, "COMMIT", "CREATE_AND_UPDATE")
                .then(() => setRefetch(!refetch))
        }
        else {
            const marks = {
                events: [{
                    dataValues,
                    orgUnit: value?.orgUnitId,
                    program: value?.programId,
                    programStage: programStage!,
                    enrollment: value?.enrollmentId,
                    event: value?.programStageEvent,
                    trackedEntity: value?.trackedEntity,
                    occurredAt: value?.registrationEventOccurredAt,
                }]
            }

            if (newMark != updatedVariables[0].value && !updatedVariables[0].error) {
                await saveMarks(marks)
                    .then(() => {
                        // Update the original data with the new mark
                        updatedVariables[0].value = newMark;
                        originalData[dataElements.id] = newMark;
                        if (termRemarkDataValue) {
                            originalData[termRemarkDataValue.dataElement] = termRemarkDataValue.value;
                        }
                        if (gradeDataValue) {
                            originalData[gradeDataValue.dataElement] = gradeDataValue.value;
                            // The paired grade field is its own table cell/component instance -
                            // patch just this row locally so it picks up the new value, instead
                            // of refetching the whole table.
                            onRowUpdate?.(
                                (row) => row.trackedEntity === value?.trackedEntity,
                                { [gradeDataValue.dataElement]: gradeDataValue.value }
                            )
                        }
                    })
                    .catch(() => {
                        setTimeout(() => {
                            setNewMark(updatedVariables[0].value);
                            originalData[dataElements.id] = updatedVariables[0].value;
                        }, 3000)
                    })
            }
        }
    }

    return (
        <>
            {
                performanceFieldsMapping({
                    visible: updatedVariables[0]?.visible,
                    loading: loading,
                    error: updatedVariables[0]?.error || error,
                    success: success,
                    warning: updatedVariables[0]?.warning,
                    disabled: updatedVariables[0]?.disabled,
                    value: newMark,
                    handleBlur: handleBlur,
                    handleChange: handleChange,
                    field: updatedVariables[0],
                    content: updatedVariables[0]?.content || "",
                    fieldType: updatedVariables[0]?.valueType,
                    options: updatedVariables[0]?.options?.optionSet?.options
                })
            }
        </>
    )
}
