import { cloneDeep } from 'lodash';
import FieldsPerformance from '../../components/marks/FieldsPerformance';
import React from 'react';
import { EnrollmentStatus, VariablesTypes } from 'dhis2-semis-types';
import { PerformanceConfig } from '../marks/termRemarks';

interface HeaderRow {
    id: string;
    label: string;
    name: string;
    type: string;
    value: string;
    valueType: string;
    mandatory: boolean;
    options?: { id: string; label: string }[];
}

interface IncludeFieldsProps {
    rowsData: Record<string, any>[];
    headerRows: HeaderRow[];
    mode: boolean;
    dataElementIds: string[];
    otherProps?: any;
    program: string;
    performanceConfig?: PerformanceConfig;
    onRowUpdate?: (matcher: (row: Record<string, any>) => boolean, patch: Record<string, any>) => void;
}

interface changeDataElementTypeProps {
    headerRows: HeaderRow[];
    dataElementIds: string[];
    /** Data element columns always shown regardless of Standard Group filtering (e.g. term remarks). Read-only, placed last. */
    alwaysVisibleIds?: string[];
    /** Subjects used to pair each score column with its grade column, sorted alphabetically. */
    subjectsOrder?: { scoreDataElement?: string; gradeDataElement?: string }[];
}

export const includeFields = (props: IncludeFieldsProps) => {
    const { rowsData, headerRows, mode, dataElementIds, otherProps, program, performanceConfig, onRowUpdate } = props;

    // Create a deep copy of the input rowsData to avoid mutating the original
    const modifiedRowsData = cloneDeep(rowsData);

    // Transform the rows immutably using map
    const newRowsData = modifiedRowsData.map((row: any, i: number) => {
        // Create a new row object to avoid mutating the cloned row
        const newRow = { ...row };

        headerRows.forEach(headerRow => {
            const { id, type } = headerRow;
            // Handle undefined/null values cleanly by converting to an empty string
            const immutableValue = row[id] == null ? "" : String(row[id]);

            // Conditionally update the field with a React element
            if (type === "custom" && dataElementIds?.includes(id) && mode) {
                newRow[id] = React.createElement(FieldsPerformance, {
                    dataElements: {
                        ...headerRow,
                        value: immutableValue, name: id,
                        disabled: Boolean(modifiedRowsData[i]?.status === EnrollmentStatus.CANCELLED)
                    },
                    value: modifiedRowsData[i] as any, // Pass the specific value, not the entire row
                    otherProps: otherProps,
                    // handleChange, error, and warning would typically be passed from a parent component
                    program: program,
                    originalData: rowsData[i],
                    performanceConfig,
                    onRowUpdate,
                });
            }
        });

        return newRow;
    });

    return newRowsData;
};

export const changeDataElementType = (props: changeDataElementTypeProps) => {
    const { headerRows, dataElementIds, alwaysVisibleIds = [], subjectsOrder = [] } = props;

    // Drops subject columns not in this student's Standard Group. Attribute and
    // alwaysVisibleIds columns always stay.
    const filtered = headerRows?.filter((headerRow: any) => {
        const isDataElementColumn = headerRow.type === VariablesTypes.DataElement || headerRow.type === "custom";
        if (!isDataElementColumn) return true;

        if (alwaysVisibleIds.includes(headerRow.id)) return true;

        const applies = dataElementIds?.includes(headerRow.id);
        if (applies) headerRow.type = "custom";
        return applies;
    }) ?? [];

    const byId = new Map(filtered.map((row: any) => [row.id, row]));
    const placed = new Set<string>();
    const ordered: any[] = [];

    // Non-data-element columns (attributes) keep their original relative order, first.
    filtered.forEach((row: any) => {
        const isDataElementColumn = row.type === VariablesTypes.DataElement || row.type === "custom";
        if (!isDataElementColumn) {
            ordered.push(row);
            placed.add(row.id);
        }
    });

    // Pairs each subject's score and grade columns, subjects sorted alphabetically by name.
    const subjectName = (subject: { scoreDataElement?: string }) => {
        const column = subject.scoreDataElement && byId.get(subject.scoreDataElement);
        return (column?.name ?? '') as string;
    };
    const sortedSubjects = [...subjectsOrder].sort((a, b) => subjectName(a).localeCompare(subjectName(b)));

    sortedSubjects.forEach(subject => {
        [subject.scoreDataElement, subject.gradeDataElement].forEach(id => {
            if (id && !placed.has(id) && byId.has(id)) {
                ordered.push(byId.get(id));
                placed.add(id);
            }
        });
    });

    // Aggregate fields not tied to a specific subject (e.g. term remarks) go last.
    alwaysVisibleIds.forEach(id => {
        if (!placed.has(id) && byId.has(id)) {
            ordered.push(byId.get(id));
            placed.add(id);
        }
    });

    // Keeps anything not explicitly placed above, so no column is silently dropped.
    filtered.forEach((row: any) => {
        if (!placed.has(row.id)) {
            ordered.push(row);
            placed.add(row.id);
        }
    });

    return ordered;
};
