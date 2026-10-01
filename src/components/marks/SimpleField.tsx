import React from 'react';
import { FiAlertCircle, FiAlertTriangle, FiCheckCircle, FiLoader } from 'react-icons/fi';

type SimpleFieldProps = {
    field: any;
    error: boolean;
    content: string;
    loading: boolean;
    warning?: boolean;
    success?: boolean;
    visible?: boolean;
    disabled?: boolean;
    value: string | number;
    /** HTML input type - 'text' for alphabetic values like grade codes (e.g. "A"/"Pass"). */
    inputType?: 'number' | 'text';
    handleBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
    handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export default function SimpleField(props: SimpleFieldProps) {
    const {
        field,
        error,
        content,
        loading,
        warning,
        success,
        visible = true,
        disabled = false,
        value,
        inputType = 'number',
        handleBlur,
        handleChange,
        ...otherProps
    } = props;

    if (!visible) return null;

    const borderColor = error
        ? 'red'
        : warning
            ? 'orange'
            : success
                ? 'green'
                : '#ccc';

    return (
        <>
            <div
                style={{
                    position: 'relative',
                    display: 'inline-block',
                    width: '180px',
                }}
            >
                <input
                    {...field}
                    {...otherProps}
                    {...(inputType === 'number' ? { min: 0 } : {})}
                    type={inputType}
                    key={field?.id || ''}
                    value={value}
                    onBlur={handleBlur}
                    onChange={handleChange}
                    disabled={disabled}
                    style={{
                        width: '100px',
                        paddingRight: '2.2rem',
                        border: `2px solid ${borderColor}`,
                        color: "#333",
                        outline: "none",
                        borderRadius: "4px",
                        boxSizing: "border-box",
                        backgroundColor: disabled ? "#f5f5f5" : "#fff",
                        cursor: disabled ? "not-allowed" : "text",
                        transition: "border-color 0.3s ease, box-shadow 0.3s ease",
                        padding: '8px',
                    }}
                />

                {(loading || error || success || warning) && (
                    <div
                        style={{
                            position: 'absolute',
                            right: '8px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            pointerEvents: 'none',
                        }}
                    >
                        {loading && <FiLoader color="#ccc" size={20} title={content} />}
                        {success && <FiCheckCircle color="green" size={20} title={content} />}
                        {error && <FiAlertCircle color="red" size={20} title={content} />}
                        {warning && <FiAlertTriangle color="orange" size={20} title={content} />}
                    </div>
                )}
            </div>

            <div style={{ fontSize: '10px', color: '#6c757d', marginTop: '4px' }}>
                {content}
            </div>
        </>
    );
}
