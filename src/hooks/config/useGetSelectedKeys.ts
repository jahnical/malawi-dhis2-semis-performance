import { useDataStoreKey, useProgramsKeys } from "dhis2-semis-components";

export default function useGetSelectedKeys() {
    // Performance (marks, subjects, grading) is a student-only feature
    const dataStoreData = useDataStoreKey({ sectionType: "student" });
    const programsValues = useProgramsKeys();

    return {
        dataStoreData,
        program: programsValues?.find((program) => program?.id == dataStoreData?.program)
    }
}
