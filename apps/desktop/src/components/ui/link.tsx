export const Link = ({ to, children, ...props }: {
  to: string;
  children: React.ReactNode;
}) => {
  return (
    <a
      href={to}
      target="_blank"
      className="text-blue-500 hover:text-blue-400 underline"
      {...props}
    >
      {children}
    </a>
  );
}
