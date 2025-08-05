function FormField({
  label,
  type = "text",
  name,
  value,
  onChange,
  placeholder,
  error,
  min,
  max,
  className = "",
}) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label htmlFor={name} className="font-semibold text-gray-800 text-sm">
        {label}
      </label>
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className={`w-full p-3 px-4 border-2 rounded-lg text-base transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
          error ? "border-red-500" : "border-gray-300 hover:border-gray-400"
        } ${className}`}
        placeholder={placeholder}
        min={min}
        max={max}
      />
      {error && <span className="text-red-500 text-xs mt-1">{error}</span>}
    </div>
  );
}

export default FormField;
