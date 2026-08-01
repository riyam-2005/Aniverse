export function getPasswordRules(password: string) {
  return [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "One uppercase letter", met: /[A-Z]/.test(password) },
    { label: "One lowercase letter", met: /[a-z]/.test(password) },
    { label: "One number", met: /[0-9]/.test(password) },
  ];
}

export default function PasswordChecklist({ password }: { password: string }) {
  const rules = getPasswordRules(password);

  return (
    <ul className="mt-2 space-y-1">
      {rules.map((rule) => (
        <li
          key={rule.label}
          className={`flex items-center gap-1.5 text-[11px] transition-colors ${
            rule.met ? "text-cyan" : "text-ink-faint"
          }`}
        >
          <span className="inline-flex h-3.5 w-3.5 items-center justify-center">
            {rule.met ? "✓" : "·"}
          </span>
          {rule.label}
        </li>
      ))}
    </ul>
  );
}
