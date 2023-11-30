import React from "react";

export const Link = ({
  to,
  children,
  className,
  ...props
}: {
  to: string;
  className?: string;
  children: React.ReactNode;
}) => {
  const isLink = typeof to !== "undefined";
  const ButtonOrLink = isLink ? "a" : "button";

  return (
    <ButtonOrLink
      href={to}
      target="_blank"
      className={`${className} text-blue-500 hover:text-blue-400 underline`}
      {...props}
    >
      {children}
    </ButtonOrLink>
  );
};
