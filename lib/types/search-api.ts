export interface GlobalSearchResultDto {
  id: string;
  type: string;
  title: string;
  subtitle: string | null;
  targetView: string;
  targetParams: Record<string, string>;
}
