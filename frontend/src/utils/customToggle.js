import React from 'react';

const CustomToggle = React.forwardRef(({ children, onClick }, ref) => (
    <button
        type="button"
        ref={ref}
        onClick={(e) => {
            e.preventDefault();
            onClick(e);
        }}
        style={{ 
            background: 'none',
            border: 'none',
            padding: 0,
            textDecoration: 'none', 
            color: 'inherit', 
            fontSize: '1.5rem', 
            paddingRight: '10px',
            display: 'flex',
            alignItems: 'flex-end',
            cursor: 'pointer'
        }}
    >
        {children}
    </button>
));


export default CustomToggle;