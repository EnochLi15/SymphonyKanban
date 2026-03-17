export type WorkspaceFormInput = {
  name: string;
  localPath: string;
  context: string;
};

export type WorkspacePayload = {
  name: string;
  localPath: string;
  context: string | null;
};

const trimValue = (value: string) => value.trim();

export const toWorkspacePayload = (input: WorkspaceFormInput): WorkspacePayload => {
  const name = trimValue(input.name);
  const localPath = trimValue(input.localPath);
  const context = trimValue(input.context);

  return {
    name,
    localPath,
    context: context ? context : null,
  };
};
