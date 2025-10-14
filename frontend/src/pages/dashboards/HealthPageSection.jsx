import React from 'react';

export default function HealthPageSection({
  title,
  description,
  actions,
  className,
  children,
}) {
  const hasHeader = title || description || actions;
  const sectionClass = ['page-content', className].filter(Boolean).join(' ');

  return (
    <section className={sectionClass}>
      {hasHeader && (
        <div className="page-header">
          <div className="page-header-titles">
            {title ? <div className="page-title">{title}</div> : null}
            {description ? <div className="page-subtitle">{description}</div> : null}
          </div>
          {actions ? <div className="page-actions">{actions}</div> : null}
        </div>
      )}
      {children}
    </section>
  );
}
