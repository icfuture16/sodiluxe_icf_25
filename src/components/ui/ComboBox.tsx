import { Fragment, useState } from 'react'
import { Combobox, Transition } from '@headlessui/react'

interface ComboBoxOption {
  id: string
  label: string
}

interface ComboBoxProps {
  options: ComboBoxOption[]
  value: ComboBoxOption | null
  onChange: (value: ComboBoxOption | null) => void
  placeholder?: string
  disabled?: boolean
  onInputChange?: (query: string) => void
}

export function ComboBox({ options, value, onChange, placeholder = '', disabled = false, onInputChange }: ComboBoxProps) {
  const [query, setQuery] = useState('')

  const filteredOptions =
    query === ''
      ? options
      : options.filter((option) =>
          option?.label?.toLowerCase().includes(query.toLowerCase())
        )

  return (
    <Combobox value={value} onChange={onChange} disabled={disabled}>
      <div className="relative">
        <Combobox.Input
  className="w-full rounded-md border border-gray-300 py-2 pl-3 pr-10 text-sm shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
  displayValue={(option: ComboBoxOption) => option?.label || ''}
  onChange={(event) => {
    setQuery(event.target.value)
    if (onInputChange) onInputChange(event.target.value)
  }}
  placeholder={placeholder}
/>
        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          afterLeave={() => setQuery('')}
        >
          <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
            {filteredOptions.length === 0 && query !== '' ? (
              <div className="relative cursor-default select-none px-4 py-2 text-gray-700">
                Aucun résultat
              </div>
            ) : (
              filteredOptions.map((option) => (
                <Combobox.Option
                  key={option.id}
                  className={({ active }) =>
                    `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                      active ? 'bg-primary text-white' : 'text-gray-900'
                    }`
                  }
                  value={option}
                >
                  {({ selected, active }) => (
                    <>
                      <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>{option.label}</span>
                      {selected ? (
                        <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${active ? 'text-white' : 'text-primary'}`}>
                          ✓
                        </span>
                      ) : null}
                    </>
                  )}
                </Combobox.Option>
              ))
            )}
          </Combobox.Options>
        </Transition>
      </div>
    </Combobox>
  )
}
