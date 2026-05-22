import { Search, SlidersHorizontal, X } from 'lucide-react';

import { Button } from './Button.jsx';
import { Input } from './Input.jsx';

export function ScreenToolbar({
  activeFilters = [],
  children,
  dateRange = null,
  filtersLabel = 'Filters',
  onDateChange,
  onReset,
  onSearchChange,
  primaryAction,
  searchPlaceholder = 'Search records',
  searchValue = '',
  tabs = [],
}) {
  return (
    <section className="screen-toolbar">
      <div className="screen-toolbar-main">
        {onSearchChange ? (
          <div className="screen-toolbar-search">
            <Search className="screen-toolbar-search-icon" size={16} />
            <Input
              className="screen-toolbar-search-input"
              label=""
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={searchPlaceholder}
              value={searchValue}
            />
          </div>
        ) : null}

        {dateRange ? (
          <div className="screen-toolbar-date-range">
            <Input
              label=""
              onChange={(event) => onDateChange?.({ ...dateRange, from: event.target.value })}
              type="date"
              value={dateRange.from ?? ''}
            />
            <span>to</span>
            <Input
              label=""
              onChange={(event) => onDateChange?.({ ...dateRange, to: event.target.value })}
              type="date"
              value={dateRange.to ?? ''}
            />
          </div>
        ) : null}

        {children ? <div className="screen-toolbar-children">{children}</div> : null}
      </div>

      <div className="screen-toolbar-actions">
        {tabs.length ? (
          <div className="screen-toolbar-tabs">
            {tabs.map((tab) => (
              <button
                className={`screen-toolbar-tab ${tab.active ? 'is-active' : ''}`}
                key={tab.key}
                onClick={tab.onClick}
                type="button"
              >
                <span>{tab.label}</span>
                {tab.count !== undefined ? <small>{tab.count}</small> : null}
              </button>
            ))}
          </div>
        ) : null}

        {activeFilters.length ? (
          <div className="screen-toolbar-filter-chips">
            {activeFilters.map((filter) => (
              <span className="filter-chip" key={`${filter.key}-${filter.label}`}>
                <SlidersHorizontal size={12} />
                {filter.label}
                {filter.onRemove ? (
                  <button aria-label={`Remove ${filter.label}`} onClick={filter.onRemove} type="button">
                    <X size={12} />
                  </button>
                ) : null}
              </span>
            ))}
          </div>
        ) : null}

        {onReset ? (
          <Button className="screen-toolbar-reset" onClick={onReset} type="button" variant="ghost">
            {filtersLabel}
          </Button>
        ) : null}

        {primaryAction}
      </div>
    </section>
  );
}
