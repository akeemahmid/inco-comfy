export interface InputFormProps {
    label: string
    placeholder: string
    value?: string
    type?: string
    large?: boolean
    onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
}

export function InputForm({ label, placeholder, value, type, large, onChange }: InputFormProps) {
    return (
        <div className="flex flex-col gap-1.5 mt-[3%]">
             <span className="text-lg font-semibold">{label}</span>
            {large ? (
                <textarea
                    className={`p-2 rounded-xl border-[#FFFFFF1A] border-2 w-full outline-none text-white`}
                    placeholder={placeholder}
                    rows={7}
                    cols={7}
                    value={value || ''}
                    onChange={onChange}
                />
            ) : (
                <input
                    className={`p-2 rounded-xl border-[#FFFFFF1A] border-2 w-full outline-none text-white`}
                    type={type}
                    placeholder={placeholder}
                    value={value || ''}
                    onChange={onChange}
                />
            )}
        </div>
    )
}