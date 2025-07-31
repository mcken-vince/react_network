import './FormField.css'

function FormField({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  error,
  min,
  max,
  className = ''
}) {
  return (
    <div className="form-group">
      <label htmlFor={name}>{label}</label>
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className={`${error ? 'error' : ''} ${className}`}
        placeholder={placeholder}
        min={min}
        max={max}
      />
      {error && <span className="error-text">{error}</span>}
    </div>
  )
}

export default FormField
