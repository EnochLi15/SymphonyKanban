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
