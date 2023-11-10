import { cva, type VariantProps } from "class-variance-authority";

const button = cva(
  "rounded-md disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      intent: {
        primary: [
          "bg-blue-500",
          "text-white",
          "border-transparent",
          "hover:bg-blue-600",
        ],
        danger: [
          "bg-red-500",
          "text-white",
          "border-transparent",
          "hover:bg-red-600",
        ],
        secondary: ["text-white", "hover:text-blue-500"],
      },
      size: {
        small: ["text-sm", "py-1", "px-2"],
        medium: ["text-base", "py-2", "px-4"],
        large: ["text-lg", "py-4", "px-4"],
      },
    },
    compoundVariants: [
      { intent: "primary", size: "medium", class: "uppercase" },
    ],
    defaultVariants: {
      intent: "primary",
      size: "medium",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof button> { }

export const Button: React.FC<ButtonProps> = ({
  className,
  intent,
  size,
  ...props
}) => <button className={button({ intent, size, className })} {...props} />;
