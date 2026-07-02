import React from 'react';

const STATUS_CONFIG = {
  CREATED:          { label: 'Created',          cls: 'badge-created',      dot: 'bg-blue-500' },
  ASSIGNED:         { label: 'Assigned',          cls: 'badge-assigned',     dot: 'bg-green-500' },
  PICKED_UP:        { label: 'Picked Up',         cls: 'badge-picked_up',    dot: 'bg-yellow-500' },
  IN_TRANSIT:       { label: 'In Transit',        cls: 'badge-in_transit',   dot: 'bg-blue-500' },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery',  cls: 'badge-out',          dot: 'bg-purple-500' },
  DELIVERED:        { label: 'Delivered',         cls: 'badge-delivered',    dot: 'bg-emerald-500' },
  FAILED:           { label: 'Failed',            cls: 'badge-failed',       dot: 'bg-red-500' },
  RESCHEDULED:      { label: 'Rescheduled',       cls: 'badge-rescheduled',  dot: 'bg-orange-500' },
};

const StatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || { label: status, cls: 'badge-created', dot: 'bg-gray-400' };
  return (
    <span className={`badge ${config.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} shrink-0`} />
      {config.label}
    </span>
  );
};

export default StatusBadge;
