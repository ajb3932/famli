import { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const inputBase =
  'w-full rounded-xl border bg-white/75 px-3.5 py-2.5 text-[15px] text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:ring-4 dark:bg-white/5 dark:text-slate-100 dark:placeholder:text-slate-500';
const inputOk = 'border-slate-200/90 focus:border-brand-400 focus:ring-brand-500/15 dark:border-white/10';
const inputErr = 'border-coral-400 focus:border-coral-400 focus:ring-coral-500/15';

/**
 * Label + control + error/hint. `children` is a render function receiving the
 * props to spread onto the control, so ids and aria wiring stay consistent.
 */
export function Field({ label, error, hint, required, className = '', children }) {
  const id = useId();
  const messageId = `${id}-message`;
  const message = error || hint;
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
          {required && <span className="ml-0.5 text-coral-500">*</span>}
        </label>
      )}
      {children({
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': message ? messageId : undefined,
        className: `${inputBase} ${error ? inputErr : inputOk}`,
      })}
      {message && (
        <p
          id={messageId}
          className={`mt-1.5 text-xs ${error ? 'animate-fade-in text-coral-600 dark:text-coral-400' : 'text-slate-500 dark:text-slate-400'}`}
        >
          {message}
        </p>
      )}
    </div>
  );
}

export function TextField({ label, error, hint, required, className, icon: Icon, ...inputProps }) {
  return (
    <Field label={label} error={error} hint={hint} required={required} className={className}>
      {(p) =>
        Icon ? (
          <div className="relative">
            <Icon className="pointer-events-none absolute top-1/2 left-3.5 size-4.5 -translate-y-1/2 text-slate-400" />
            <input {...p} {...inputProps} required={required} className={`${p.className} pl-10.5`} />
          </div>
        ) : (
          <input {...p} {...inputProps} required={required} />
        )
      }
    </Field>
  );
}

export function PasswordField({ label, error, hint, required, className, icon: Icon, ...inputProps }) {
  const [visible, setVisible] = useState(false);
  return (
    <Field label={label} error={error} hint={hint} required={required} className={className}>
      {(p) => (
        <div className="relative">
          {Icon && (
            <Icon className="pointer-events-none absolute top-1/2 left-3.5 size-4.5 -translate-y-1/2 text-slate-400" />
          )}
          <input
            {...p}
            {...inputProps}
            required={required}
            type={visible ? 'text' : 'password'}
            className={`${p.className} pr-11 ${Icon ? 'pl-10.5' : ''}`}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Hide password' : 'Show password'}
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-500/10 hover:text-slate-600 dark:hover:text-slate-200"
          >
            {visible ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
          </button>
        </div>
      )}
    </Field>
  );
}

export function TextAreaField({ label, error, hint, required, className, ...props }) {
  return (
    <Field label={label} error={error} hint={hint} required={required} className={className}>
      {(p) => <textarea {...p} {...props} required={required} className={`${p.className} min-h-24 resize-y`} />}
    </Field>
  );
}

export function SelectField({ label, error, hint, required, className, children, ...props }) {
  return (
    <Field label={label} error={error} hint={hint} required={required} className={className}>
      {(p) => (
        <select {...p} {...props} required={required} className={`${p.className} appearance-none pr-9`}>
          {children}
        </select>
      )}
    </Field>
  );
}

/** Animated segmented control (e.g. sort toggles, role pickers). */
export function Segmented({ options, value, onChange, label, className = '' }) {
  const index = Math.max(
    0,
    options.findIndex((o) => o.value === value)
  );
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={`glass relative inline-grid rounded-xl p-1 ${className}`}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-1 left-1 rounded-lg bg-white shadow-sm ring-1 ring-slate-900/5 transition-transform duration-300 ease-[var(--ease-spring)] dark:bg-white/15 dark:ring-white/10"
        style={{
          width: `calc((100% - 0.5rem) / ${options.length})`,
          transform: `translateX(${index * 100}%)`,
        }}
      />
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          onClick={() => onChange(option.value)}
          className={`relative z-10 rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${
            option.value === value
              ? 'text-slate-900 dark:text-white'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
