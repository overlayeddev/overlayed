interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const Slider = ({ className, value, onChange, ...props }: SliderProps) => {
  return (
    <div className="w-full">
      <input value={value} onChange={onChange} className="w-full" type="range" {...props} />
    </div>
  );
};
