import React from 'react';

const sizeMap = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl font-bold'
};

const Avatar = ({ name = 'User', color = '#3B82F6', size = 'md', className = '' }) => {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div
      className={`inline-flex items-center justify-center rounded-full font-semibold text-white shadow-sm flex-shrink-0 transition-transform select-none ${sizeMap[size] || sizeMap.md} ${className}`}
      style={{ backgroundColor: color }}
      title={name}
    >
      {initials}
    </div>
  );
};

export default Avatar;

