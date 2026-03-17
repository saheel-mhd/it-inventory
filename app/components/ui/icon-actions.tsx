import { IconProps } from "~/app/components/ui/icon-types";

export function IconEye({ title = "View", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden={title ? undefined : true} {...props}>
      {title ? <title>{title}</title> : null}
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
    </svg>
  );
}

export function IconChevronRight({ title = "Open", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden={title ? undefined : true} {...props}>
      {title ? <title>{title}</title> : null}
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

export function IconReturn({ title = "Return", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden={title ? undefined : true} {...props}>
      {title ? <title>{title}</title> : null}
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h9a5 5 0 1 1 0 10h-3" />
    </svg>
  );
}

export function IconLogout({ title = "Logout", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden={title ? undefined : true} {...props}>
      {title ? <title>{title}</title> : null}
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}

export function IconCategory({ title = "Category", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden={title ? undefined : true} {...props}>
      {title ? <title>{title}</title> : null}
      <path d="M20.59 13.41 11 3.83a2 2 0 0 0-1.41-.58H4a2 2 0 0 0-2 2v5.59a2 2 0 0 0 .58 1.41L12.17 22a2 2 0 0 0 2.83 0l5.59-5.59a2 2 0 0 0 0-2.83Z" />
      <path d="M7 7h.01" />
    </svg>
  );
}

export function IconAssetType({ title = "Asset Type", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden={title ? undefined : true} {...props}>
      {title ? <title>{title}</title> : null}
      <path d="M12 2 3 7l9 5 9-5-9-5Z" />
      <path d="m3 17 9 5 9-5" />
      <path d="m3 12 9 5 9-5" />
    </svg>
  );
}

export function IconWarranty({ title = "Warranty", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden={title ? undefined : true} {...props}>
      {title ? <title>{title}</title> : null}
      <path d="m9 12 2 2 4-4" />
      <path d="M12 3 4 7v6c0 5 3.4 8.7 8 10 4.6-1.3 8-5 8-10V7l-8-4Z" />
    </svg>
  );
}

export function IconDepartment({ title = "Department", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden={title ? undefined : true} {...props}>
      {title ? <title>{title}</title> : null}
      <path d="M3 21h18" />
      <path d="M5 21V7l8-4 8 4v14" />
      <path d="M9 9h.01" />
      <path d="M9 12h.01" />
      <path d="M9 15h.01" />
      <path d="M13 9h.01" />
      <path d="M13 12h.01" />
      <path d="M13 15h.01" />
      <path d="M17 9h.01" />
      <path d="M17 12h.01" />
      <path d="M17 15h.01" />
    </svg>
  );
}

export function IconPencil({ title = "Edit", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden={title ? undefined : true} {...props}>
      {title ? <title>{title}</title> : null}
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

export function IconCheck({ title = "Activate", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden={title ? undefined : true} {...props}>
      {title ? <title>{title}</title> : null}
      <path d="m5 12 5 5L20 7" />
    </svg>
  );
}

export function IconBan({ title = "Disable", ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden={title ? undefined : true} {...props}>
      {title ? <title>{title}</title> : null}
      <circle cx="12" cy="12" r="10" />
      <path d="m4.9 4.9 14.2 14.2" />
    </svg>
  );
}

export function IconImportExport({
  title = "Import / Export",
  ...props
}: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden={title ? undefined : true} {...props}>
      {title ? <title>{title}</title> : null}
      <path d="M12 3v12" />
      <path d="m7 8 5-5 5 5" />
      <path d="M12 21V9" />
      <path d="m17 16-5 5-5-5" />
    </svg>
  );
}
