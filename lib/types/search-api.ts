export interface GlobalSearchResultDto {
  id: string;
  type: string;
  title: string;
  subtitle: string | null;
  targetView: string;
  targetParams: Record<string, string>;
}

export interface GlobalSearchScopeDto {
  id: string;
  label: string;
  placeholder: string;
  icon: string;
}
