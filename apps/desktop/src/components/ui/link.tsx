export const Link = ({
  to,
  children,
  className,
  internal = false,
  ...props
}: {
  to: string;
  className?: string;
  internal?: boolean;
  children: React.ReactNode;
}) => {
  return (
    <a
      href={to}
      target={`${internal ? "" : "_blank"}`}
      className={`${className} text-blue-500 hover:text-blue-400 underline`}
      {...props}
    >
      {children}
    </a>
  );
};
