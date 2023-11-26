export const Link = ({
  to,
  children,
  className,
  ...props
}: {
  to: string;
  className: string;
  children: React.ReactNode;
}) => {
  return (
    <a href={to} target="_blank" className={`${className} text-blue-500 hover:text-blue-400 underline`} {...props}>
      {children}
    </a>
  );
};
