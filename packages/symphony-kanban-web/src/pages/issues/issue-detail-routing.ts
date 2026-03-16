export const routeForStatus = (status: string): string => {
  switch (status) {
    case "InProgress":
      return "/session";
    case "Review":
      return "/review";
    case "Blocked":
      return "/error";
    default:
      return "";
  }
};

type ResolveRouteInput = {
  issueId: string;
  status: string;
  currentPath: string;
  isEditing: boolean;
};

export const resolveIssueDetailRoute = ({
  issueId,
  status,
  currentPath,
  isEditing,
}: ResolveRouteInput): string | null => {
  if (!issueId || isEditing) return null;
  const suffix = routeForStatus(status);
  const target = `/issues/${issueId}${suffix}`;
  if (currentPath === target) return null;
  return target;
};
