import { cloneDeep } from 'lodash';
import FieldsPerformance from '../../components/marks/FieldsPerformance';
import React from 'react';
import { EnrollmentStatus } from 'dhis2-semis-types';
import { PerformanceConfig } from '../marks/termRemarks';

interface IncludeFieldsProps {
    rowsData: Record<string, any>[];
    headerRows: [{
        id: string;
        label: string;
        name: string;
        type: string;
        value: string;
        valueType: string;
        mandatory: boolean;
        options?: { id: string; label: string }[];
    }];
    mode: boolean;
    dataElementIds: string[];
    otherProps?: any;
    program: string;
    performanceConfig?: PerformanceConfig;
    onRowUpdate?: (matcher: (row: Record<string, any>) => boolean, patch: Record<string, any>) => void;
}

interface changeDataElementTypeProps {
    headerRows: [{
        id: string;
        label: string;
        name: string;
        type: string;
        value: string;
        valueType: string;
        mandatory: boolean;
        options?: { id: string; label: string }[];
    }];
    dataElementIds: string[];
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
    const { headerRows, dataElementIds } = props;

    // Note: This function mutates headerRows. If immutability is required here too, use map or cloneDeep.
    headerRows?.forEach((headerRow: any) => {
        const { id } = headerRow;
        if (dataElementIds?.includes(id)) {
            headerRow.type = "custom";
        }
    });

    return headerRows;
};
