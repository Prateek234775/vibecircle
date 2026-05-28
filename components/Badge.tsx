interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "purple" | "warning" | "success";
}

export default function Badge({
  children,
  variant = "purple",
}: BadgeProps) {
  const styles = {
  default: "bg-gray-100 text-gray-700",
  purple: "bg-purple-100 text-purple-700",
  warning: "bg-yellow-100 text-yellow-700",
  success: "bg-green-100 text-green-700",
};

  return (
    <span
      className={`px-3 py-1 rounded-full text-sm font-medium ${styles[variant]}`}
    >
      {children}
    </span>
  );
}